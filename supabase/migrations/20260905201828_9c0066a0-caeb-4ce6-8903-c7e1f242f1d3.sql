-- 1. Profile fields
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS username text,
  ADD COLUMN IF NOT EXISTS mobile_number text,
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active';

CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_lower_key ON public.profiles (lower(username)) WHERE username IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS profiles_mobile_key ON public.profiles (mobile_number) WHERE mobile_number IS NOT NULL;

-- normalize Indian mobile numbers to +91XXXXXXXXXX
CREATE OR REPLACE FUNCTION public.normalize_mobile(_raw text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE d text;
BEGIN
  IF _raw IS NULL OR btrim(_raw) = '' THEN RETURN NULL; END IF;
  d := regexp_replace(_raw, '[^0-9]', '', 'g');
  IF length(d) = 10 THEN RETURN '+91' || d; END IF;
  IF length(d) = 12 AND left(d, 2) = '91' THEN RETURN '+' || d; END IF;
  IF length(d) = 11 AND left(d, 1) = '0' THEN RETURN '+91' || right(d, 10); END IF;
  RETURN '+' || d;
END;
$$;

CREATE OR REPLACE FUNCTION public.profiles_normalize()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.mobile_number := public.normalize_mobile(NEW.mobile_number);
  NEW.username := NULLIF(lower(btrim(NEW.username)), '');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_normalize ON public.profiles;
CREATE TRIGGER profiles_normalize BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.profiles_normalize();

-- users may not change their own status; only admins may
CREATE OR REPLACE FUNCTION public.profiles_guard_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status <> OLD.status AND NOT public.has_role(auth.uid(), 'admin') THEN
    NEW.status := OLD.status;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_guard_status ON public.profiles;
CREATE TRIGGER profiles_guard_status BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.profiles_guard_status();

-- 2. Trainer -> course assignments
CREATE TABLE IF NOT EXISTS public.trainer_course_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  trainer_id uuid NOT NULL,
  can_manage_content boolean NOT NULL DEFAULT true,
  can_grade boolean NOT NULL DEFAULT true,
  can_manage_quizzes boolean NOT NULL DEFAULT true,
  assigned_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (course_id, trainer_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.trainer_course_assignments TO authenticated;
GRANT ALL ON public.trainer_course_assignments TO service_role;
ALTER TABLE public.trainer_course_assignments ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS trainer_course_assignments_updated_at ON public.trainer_course_assignments;
CREATE TRIGGER trainer_course_assignments_updated_at BEFORE UPDATE ON public.trainer_course_assignments
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "Admins manage trainer assignments"
ON public.trainer_course_assignments FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Trainers view own assignments"
ON public.trainer_course_assignments FOR SELECT TO authenticated
USING (trainer_id = auth.uid());

-- 3. Authorisation helpers
CREATE OR REPLACE FUNCTION public.is_assigned_trainer(_course_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.trainer_course_assignments a
    WHERE a.course_id = _course_id AND a.trainer_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.can_manage_course(_course_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'admin')
      OR EXISTS (SELECT 1 FROM public.courses c WHERE c.id = _course_id AND c.trainer_id = auth.uid())
      OR EXISTS (SELECT 1 FROM public.trainer_course_assignments a
                 WHERE a.course_id = _course_id AND a.trainer_id = auth.uid());
$$;

-- 4. Admin visibility of roles / profiles
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins update any profile" ON public.profiles;
CREATE POLICY "Admins update any profile"
ON public.profiles FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins insert profiles" ON public.profiles;
CREATE POLICY "Admins insert profiles"
ON public.profiles FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 5. Enrolment must be granted, not self-claimed
DROP POLICY IF EXISTS "Students enroll themselves" ON public.enrollments;
CREATE POLICY "Managers create enrollments"
ON public.enrollments FOR INSERT TO authenticated
WITH CHECK (public.can_manage_course(course_id));

-- 6. Trainer visibility of enrolled students' profiles (assigned courses only)
CREATE OR REPLACE FUNCTION public.shares_managed_course(_student_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.enrollments e
    WHERE e.student_id = _student_id AND public.can_manage_course(e.course_id)
  );
$$;

DROP POLICY IF EXISTS "Trainers view enrolled students" ON public.profiles;
CREATE POLICY "Trainers view enrolled students"
ON public.profiles FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'trainer') AND public.shares_managed_course(id));

-- 7. Signup profile fields from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_count INT;
BEGIN
  INSERT INTO public.profiles (id, email, display_name, username, mobile_number)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    NULLIF(lower(NEW.raw_user_meta_data->>'username'), ''),
    public.normalize_mobile(NEW.raw_user_meta_data->>'mobile_number')
  );

  SELECT COUNT(*) INTO admin_count FROM public.user_roles WHERE role = 'admin';
  IF admin_count = 0 THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  END IF;
  RETURN NEW;
END;
$$;