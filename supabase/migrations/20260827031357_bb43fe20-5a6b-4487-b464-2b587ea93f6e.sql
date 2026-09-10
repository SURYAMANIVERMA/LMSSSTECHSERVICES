-- ===== COURSES: status, instructor, ordering, short description =====
ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'published',
  ADD COLUMN IF NOT EXISTS instructor text,
  ADD COLUMN IF NOT EXISTS short_description text,
  ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;

UPDATE public.courses SET status = CASE WHEN is_published THEN 'published' ELSE 'draft' END;
UPDATE public.courses SET short_description = summary WHERE short_description IS NULL;

ALTER TABLE public.courses
  ADD CONSTRAINT courses_status_check CHECK (status IN ('draft','published','unpublished'));

-- keep the existing is_published flag (used by RLS + existing queries) in sync with status
CREATE OR REPLACE FUNCTION public.sync_course_status()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.is_published := (NEW.status = 'published');
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.sync_course_status() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER courses_sync_status
BEFORE INSERT OR UPDATE OF status ON public.courses
FOR EACH ROW EXECUTE FUNCTION public.sync_course_status();

-- ===== COURSE MODULES / CHAPTERS =====
CREATE TABLE public.course_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.course_modules TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.course_modules TO authenticated;
GRANT ALL ON public.course_modules TO service_role;

ALTER TABLE public.course_modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Modules of published courses are viewable"
ON public.course_modules FOR SELECT
USING (EXISTS (SELECT 1 FROM public.courses c WHERE c.id = course_id AND c.is_published));

CREATE POLICY "Managers can view all modules"
ON public.course_modules FOR SELECT TO authenticated
USING (public.can_manage_course(course_id));

CREATE POLICY "Managers can insert modules"
ON public.course_modules FOR INSERT TO authenticated
WITH CHECK (public.can_manage_course(course_id));

CREATE POLICY "Managers can update modules"
ON public.course_modules FOR UPDATE TO authenticated
USING (public.can_manage_course(course_id))
WITH CHECK (public.can_manage_course(course_id));

CREATE POLICY "Managers can delete modules"
ON public.course_modules FOR DELETE TO authenticated
USING (public.can_manage_course(course_id));

CREATE TRIGGER course_modules_updated_at
BEFORE UPDATE ON public.course_modules
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER log_course_modules
AFTER INSERT OR UPDATE OR DELETE ON public.course_modules
FOR EACH ROW EXECUTE FUNCTION public.log_activity('module');

CREATE INDEX idx_course_modules_course ON public.course_modules(course_id, sort_order);

-- ===== LESSONS: module link + lesson types =====
ALTER TABLE public.lessons
  ADD COLUMN IF NOT EXISTS module_id uuid REFERENCES public.course_modules(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS lesson_type text NOT NULL DEFAULT 'video',
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS pdf_url text,
  ADD COLUMN IF NOT EXISTS thumbnail_url text,
  ADD COLUMN IF NOT EXISTS is_free boolean NOT NULL DEFAULT false;

ALTER TABLE public.lessons
  ADD CONSTRAINT lessons_type_check CHECK (lesson_type IN ('video','pdf','text','quiz'));

CREATE INDEX idx_lessons_module ON public.lessons(module_id, position);
CREATE INDEX idx_lessons_course ON public.lessons(course_id, position);

-- ===== QUIZZES: optional lesson link, richer questions =====
ALTER TABLE public.quizzes
  ADD COLUMN IF NOT EXISTS lesson_id uuid REFERENCES public.lessons(id) ON DELETE CASCADE;

ALTER TABLE public.quiz_questions
  ADD COLUMN IF NOT EXISTS explanation text,
  ADD COLUMN IF NOT EXISTS marks integer NOT NULL DEFAULT 1;

CREATE INDEX idx_quizzes_course ON public.quizzes(course_id);
CREATE INDEX idx_quiz_questions_quiz ON public.quiz_questions(quiz_id, position);

-- ===== PROGRESS: last accessed =====
ALTER TABLE public.lesson_progress
  ADD COLUMN IF NOT EXISTS last_accessed_at timestamptz;

CREATE INDEX idx_lesson_progress_student_course ON public.lesson_progress(student_id, course_id);
CREATE INDEX idx_enrollments_student ON public.enrollments(student_id, course_id);