CREATE TABLE public.activity_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_type text NOT NULL,
  entity_id uuid,
  action text NOT NULL,
  summary text,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_email text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.activity_log TO authenticated;
GRANT ALL ON public.activity_log TO service_role;

ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and trainers can view activity log"
ON public.activity_log FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'trainer'));

CREATE INDEX activity_log_created_at_idx ON public.activity_log (created_at DESC);

CREATE OR REPLACE FUNCTION public.log_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_entity text := TG_ARGV[0];
  v_id uuid;
  v_summary text;
  v_email text;
BEGIN
  SELECT email INTO v_email FROM public.profiles WHERE id = auth.uid();

  IF TG_OP = 'DELETE' THEN
    v_id := OLD.id;
  ELSE
    v_id := NEW.id;
  END IF;

  IF v_entity = 'course' THEN
    v_summary := COALESCE(NEW.title, OLD.title);
  ELSIF v_entity = 'lesson' THEN
    v_summary := COALESCE(NEW.title, OLD.title);
  ELSIF v_entity = 'quiz' THEN
    v_summary := COALESCE(NEW.title, OLD.title);
  ELSIF v_entity = 'quiz_question' THEN
    v_summary := left(COALESCE(NEW.question, OLD.question), 120);
  ELSIF v_entity = 'certificate' THEN
    v_summary := COALESCE(NEW.certificate_no, OLD.certificate_no) || ' — ' || COALESCE(NEW.course_title, OLD.course_title, '');
  ELSIF v_entity = 'assignment' THEN
    v_summary := COALESCE(NEW.title, OLD.title);
  ELSE
    v_summary := NULL;
  END IF;

  INSERT INTO public.activity_log (entity_type, entity_id, action, summary, actor_id, actor_email)
  VALUES (v_entity, v_id, lower(TG_OP), v_summary, auth.uid(), v_email);

  RETURN NULL;
END;
$$;

CREATE TRIGGER log_courses AFTER INSERT OR UPDATE OR DELETE ON public.courses
FOR EACH ROW EXECUTE FUNCTION public.log_activity('course');

CREATE TRIGGER log_lessons AFTER INSERT OR UPDATE OR DELETE ON public.lessons
FOR EACH ROW EXECUTE FUNCTION public.log_activity('lesson');

CREATE TRIGGER log_quizzes AFTER INSERT OR UPDATE OR DELETE ON public.quizzes
FOR EACH ROW EXECUTE FUNCTION public.log_activity('quiz');

CREATE TRIGGER log_quiz_questions AFTER INSERT OR UPDATE OR DELETE ON public.quiz_questions
FOR EACH ROW EXECUTE FUNCTION public.log_activity('quiz_question');

CREATE TRIGGER log_assignments AFTER INSERT OR UPDATE OR DELETE ON public.assignments
FOR EACH ROW EXECUTE FUNCTION public.log_activity('assignment');

CREATE TRIGGER log_certificates AFTER INSERT OR UPDATE OR DELETE ON public.certificates
FOR EACH ROW EXECUTE FUNCTION public.log_activity('certificate');