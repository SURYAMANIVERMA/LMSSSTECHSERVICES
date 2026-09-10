-- Backfill admin role for the two designated admin emails
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'admin'::app_role
FROM auth.users u
WHERE lower(u.email) IN ('srmnverma8@gmail.com', 'surya@sstechservices.org')
ON CONFLICT (user_id, role) DO NOTHING;

-- Keep granting admin to those addresses on signup / email confirmation
CREATE OR REPLACE FUNCTION public.grant_admin_for_designated_emails()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email_confirmed_at IS NOT NULL
     AND lower(NEW.email) IN ('srmnverma8@gmail.com', 'surya@sstechservices.org') THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_grant_designated_admin ON auth.users;
CREATE TRIGGER on_auth_user_created_grant_designated_admin
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.grant_admin_for_designated_emails();

DROP TRIGGER IF EXISTS on_auth_user_confirmed_grant_designated_admin ON auth.users;
CREATE TRIGGER on_auth_user_confirmed_grant_designated_admin
AFTER UPDATE OF email_confirmed_at ON auth.users
FOR EACH ROW
WHEN (OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL)
EXECUTE FUNCTION public.grant_admin_for_designated_emails();