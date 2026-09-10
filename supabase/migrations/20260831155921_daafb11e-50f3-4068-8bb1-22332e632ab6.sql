CREATE TYPE public.booking_status AS ENUM ('pending','in_progress','completed','cancelled');

CREATE TABLE public.service_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  public_ref text NOT NULL UNIQUE,
  service_title text NOT NULL,
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  customer_email text,
  city text,
  address text,
  scheduled_date date NOT NULL,
  scheduled_slot text NOT NULL,
  notes text,
  amount_inr integer NOT NULL DEFAULT 0,
  payment_status text NOT NULL DEFAULT 'unpaid',
  status public.booking_status NOT NULL DEFAULT 'pending',
  assigned_to uuid REFERENCES auth.users(id),
  engineer_name text,
  admin_notes text,
  user_id uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, UPDATE ON public.service_bookings TO authenticated;
GRANT ALL ON public.service_bookings TO service_role;
ALTER TABLE public.service_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and engineers can view bookings" ON public.service_bookings
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'engineer') OR user_id = auth.uid());

CREATE POLICY "Admins and engineers can update bookings" ON public.service_bookings
FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'engineer'))
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'engineer'));

CREATE TRIGGER service_bookings_updated_at BEFORE UPDATE ON public.service_bookings
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.booking_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.service_bookings(id) ON DELETE CASCADE,
  from_status public.booking_status,
  to_status public.booking_status,
  note text,
  author_id uuid REFERENCES auth.users(id),
  author_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.booking_updates TO authenticated;
GRANT ALL ON public.booking_updates TO service_role;
ALTER TABLE public.booking_updates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view booking timeline" ON public.booking_updates
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'engineer'));

CREATE POLICY "Staff can add booking timeline entries" ON public.booking_updates
FOR INSERT TO authenticated
WITH CHECK ((public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'engineer')) AND author_id = auth.uid());

CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL DEFAULT 'razorpay',
  purpose text NOT NULL,
  order_id text NOT NULL UNIQUE,
  payment_id text,
  signature text,
  amount_inr integer NOT NULL,
  currency text NOT NULL DEFAULT 'INR',
  status text NOT NULL DEFAULT 'created',
  course_id uuid REFERENCES public.courses(id) ON DELETE SET NULL,
  booking_id uuid REFERENCES public.service_bookings(id) ON DELETE SET NULL,
  user_id uuid REFERENCES auth.users(id),
  customer_email text,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all payments" ON public.payments
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR user_id = auth.uid());

CREATE TRIGGER payments_updated_at BEFORE UPDATE ON public.payments
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.get_booking_public(p_ref text)
RETURNS TABLE(public_ref text, service_title text, customer_name text, scheduled_date date, scheduled_slot text, status public.booking_status, engineer_name text, payment_status text, amount_inr integer, created_at timestamptz, updated_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT public_ref, service_title, customer_name, scheduled_date, scheduled_slot, status, engineer_name, payment_status, amount_inr, created_at, updated_at
  FROM public.service_bookings WHERE public_ref = p_ref LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_booking_timeline_public(p_ref text)
RETURNS TABLE(to_status public.booking_status, note text, author_name text, created_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT u.to_status, u.note, u.author_name, u.created_at
  FROM public.booking_updates u
  JOIN public.service_bookings b ON b.id = u.booking_id
  WHERE b.public_ref = p_ref
  ORDER BY u.created_at ASC;
$$;