
-- ENUMS
CREATE TYPE public.app_role AS ENUM ('admin', 'engineer');
CREATE TYPE public.ticket_status AS ENUM ('new', 'assigned', 'in_progress', 'resolved', 'closed');

-- PROFILES
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles viewable by authenticated" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid());

-- USER ROLES
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());

-- has_role security definer
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- handle_new_user trigger: first user => admin, others => engineer
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_count INT;
  assigned_role public.app_role;
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));

  SELECT COUNT(*) INTO user_count FROM public.user_roles;
  IF user_count = 0 THEN
    assigned_role := 'admin';
  ELSE
    assigned_role := 'engineer';
  END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, assigned_role);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- updated_at helper
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- SUPPORT TICKETS
CREATE TABLE public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  public_ref TEXT NOT NULL UNIQUE DEFAULT ('SS-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))),
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  issue_type TEXT NOT NULL,
  detail TEXT,
  address TEXT,
  status public.ticket_status NOT NULL DEFAULT 'new',
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  engineer_name TEXT,
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.support_tickets TO authenticated;
GRANT INSERT ON public.support_tickets TO anon;
GRANT ALL ON public.support_tickets TO service_role;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- Anyone (anon + authenticated) can create a ticket
CREATE POLICY "Public can create tickets" ON public.support_tickets FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Admins see/update everything
CREATE POLICY "Admins view all tickets" ON public.support_tickets FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update all tickets" ON public.support_tickets FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Engineers see all, update only assigned ones
CREATE POLICY "Engineers view all tickets" ON public.support_tickets FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'engineer'));
CREATE POLICY "Engineers update assigned tickets" ON public.support_tickets FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'engineer') AND assigned_to = auth.uid());

CREATE TRIGGER support_tickets_updated_at BEFORE UPDATE ON public.support_tickets FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Public lookup RPC (limited fields) so anon visitors can track without exposing the table
CREATE OR REPLACE FUNCTION public.get_ticket_public(p_ref TEXT)
RETURNS TABLE (
  public_ref TEXT,
  customer_name TEXT,
  issue_type TEXT,
  status public.ticket_status,
  engineer_name TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public_ref, customer_name, issue_type, status, engineer_name, created_at, updated_at
  FROM public.support_tickets
  WHERE public_ref = p_ref
  LIMIT 1;
$$;
GRANT EXECUTE ON FUNCTION public.get_ticket_public(TEXT) TO anon, authenticated;

-- TICKET UPDATES (log)
CREATE TABLE public.ticket_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  author_name TEXT,
  from_status public.ticket_status,
  to_status public.ticket_status,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.ticket_updates TO authenticated;
GRANT ALL ON public.ticket_updates TO service_role;
ALTER TABLE public.ticket_updates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff view updates" ON public.ticket_updates FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'engineer'));
CREATE POLICY "Staff insert updates" ON public.ticket_updates FOR INSERT TO authenticated WITH CHECK ((public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'engineer')) AND author_id = auth.uid());

-- Public timeline lookup (status changes only, no notes)
CREATE OR REPLACE FUNCTION public.get_ticket_timeline_public(p_ref TEXT)
RETURNS TABLE (
  to_status public.ticket_status,
  author_name TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.to_status, u.author_name, u.created_at
  FROM public.ticket_updates u
  JOIN public.support_tickets t ON t.id = u.ticket_id
  WHERE t.public_ref = p_ref
  ORDER BY u.created_at ASC;
$$;
GRANT EXECUTE ON FUNCTION public.get_ticket_timeline_public(TEXT) TO anon, authenticated;

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_tickets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ticket_updates;
