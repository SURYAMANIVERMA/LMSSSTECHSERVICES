-- 1. Certificates approval workflow
ALTER TABLE public.certificates
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS student_email text,
  ADD COLUMN IF NOT EXISTS student_phone text;

ALTER TABLE public.certificates
  DROP CONSTRAINT IF EXISTS certificates_status_check;
ALTER TABLE public.certificates
  ADD CONSTRAINT certificates_status_check CHECK (status IN ('pending','approved','rejected'));

-- existing certificates are treated as already approved
UPDATE public.certificates SET status = 'approved', approved_at = COALESCE(approved_at, issued_at) WHERE status = 'pending';

-- Students may only read APPROVED certificates
DROP POLICY IF EXISTS "Students read own certificates" ON public.certificates;
DROP POLICY IF EXISTS "Students can view their certificates" ON public.certificates;
CREATE POLICY "Students read own approved certificates"
ON public.certificates FOR SELECT TO authenticated
USING (student_id = auth.uid() AND status = 'approved');

-- 2. Profile phone for WhatsApp notifications
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone text;

-- 3. Notification log
CREATE TABLE IF NOT EXISTS public.notification_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  certificate_id uuid REFERENCES public.certificates(id) ON DELETE CASCADE,
  channel text NOT NULL CHECK (channel IN ('email','whatsapp')),
  recipient text,
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','sent','failed','skipped')),
  subject text,
  body text,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.notification_log TO authenticated;
GRANT ALL ON public.notification_log TO service_role;
ALTER TABLE public.notification_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff read notification log"
ON public.notification_log FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'trainer'));

-- 4. Quiz retake limits + attempt history
ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS retake_limit integer NOT NULL DEFAULT 3;
ALTER TABLE public.quiz_attempts ADD COLUMN IF NOT EXISTS attempt_number integer NOT NULL DEFAULT 1;

CREATE OR REPLACE FUNCTION public.set_quiz_attempt_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  n integer;
  lim integer;
BEGIN
  SELECT COUNT(*) INTO n FROM public.quiz_attempts
   WHERE quiz_id = NEW.quiz_id AND student_id = NEW.student_id;
  SELECT retake_limit INTO lim FROM public.quizzes WHERE id = NEW.quiz_id;
  IF lim IS NOT NULL AND lim > 0 AND n >= lim THEN
    RAISE EXCEPTION 'Retake limit of % attempts reached for this quiz', lim;
  END IF;
  NEW.attempt_number := n + 1;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS quiz_attempts_number ON public.quiz_attempts;
CREATE TRIGGER quiz_attempts_number
BEFORE INSERT ON public.quiz_attempts
FOR EACH ROW EXECUTE FUNCTION public.set_quiz_attempt_number();