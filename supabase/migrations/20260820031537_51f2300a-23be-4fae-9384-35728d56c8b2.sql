-- helpers
CREATE TABLE public.courses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'General',
  level TEXT NOT NULL DEFAULT 'Beginner',
  summary TEXT,
  description TEXT,
  cover_url TEXT,
  duration_hours INTEGER NOT NULL DEFAULT 0,
  price_inr INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT false,
  trainer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.courses TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.courses TO authenticated;
GRANT ALL ON public.courses TO service_role;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Published courses are public" ON public.courses FOR SELECT TO anon, authenticated USING (is_published = true);
CREATE POLICY "Trainers view own courses" ON public.courses FOR SELECT TO authenticated USING (trainer_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Trainers create courses" ON public.courses FOR INSERT TO authenticated WITH CHECK ((public.has_role(auth.uid(), 'trainer') AND trainer_id = auth.uid()) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Trainers update own courses" ON public.courses FOR UPDATE TO authenticated USING ((public.has_role(auth.uid(), 'trainer') AND trainer_id = auth.uid()) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Trainers delete own courses" ON public.courses FOR DELETE TO authenticated USING ((public.has_role(auth.uid(), 'trainer') AND trainer_id = auth.uid()) OR public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER courses_updated_at BEFORE UPDATE ON public.courses FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.can_manage_course(_course_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(auth.uid(), 'admin')
      OR EXISTS (SELECT 1 FROM public.courses c WHERE c.id = _course_id AND c.trainer_id = auth.uid());
$$;
REVOKE EXECUTE ON FUNCTION public.can_manage_course(UUID) FROM anon;

CREATE TABLE public.lessons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  video_url TEXT,
  content TEXT,
  position INTEGER NOT NULL DEFAULT 1,
  duration_minutes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.lessons TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lessons TO authenticated;
GRANT ALL ON public.lessons TO service_role;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Lessons of published courses readable" ON public.lessons FOR SELECT TO anon, authenticated USING (EXISTS (SELECT 1 FROM public.courses c WHERE c.id = course_id AND c.is_published = true));
CREATE POLICY "Course managers read lessons" ON public.lessons FOR SELECT TO authenticated USING (public.can_manage_course(course_id));
CREATE POLICY "Course managers insert lessons" ON public.lessons FOR INSERT TO authenticated WITH CHECK (public.can_manage_course(course_id));
CREATE POLICY "Course managers update lessons" ON public.lessons FOR UPDATE TO authenticated USING (public.can_manage_course(course_id));
CREATE POLICY "Course managers delete lessons" ON public.lessons FOR DELETE TO authenticated USING (public.can_manage_course(course_id));
CREATE TRIGGER lessons_updated_at BEFORE UPDATE ON public.lessons FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.enrollments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active',
  progress_percent INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (course_id, student_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.enrollments TO authenticated;
GRANT ALL ON public.enrollments TO service_role;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students view own enrollments" ON public.enrollments FOR SELECT TO authenticated USING (student_id = auth.uid() OR public.can_manage_course(course_id));
CREATE POLICY "Students enroll themselves" ON public.enrollments FOR INSERT TO authenticated WITH CHECK (student_id = auth.uid() OR public.can_manage_course(course_id));
CREATE POLICY "Students update own enrollment" ON public.enrollments FOR UPDATE TO authenticated USING (student_id = auth.uid() OR public.can_manage_course(course_id));
CREATE POLICY "Managers delete enrollments" ON public.enrollments FOR DELETE TO authenticated USING (public.can_manage_course(course_id));
CREATE TRIGGER enrollments_updated_at BEFORE UPDATE ON public.enrollments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.is_enrolled(_course_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.enrollments e WHERE e.course_id = _course_id AND e.student_id = auth.uid());
$$;
REVOKE EXECUTE ON FUNCTION public.is_enrolled(UUID) FROM anon;

CREATE TABLE public.lesson_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (lesson_id, student_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lesson_progress TO authenticated;
GRANT ALL ON public.lesson_progress TO service_role;
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students view own progress" ON public.lesson_progress FOR SELECT TO authenticated USING (student_id = auth.uid() OR public.can_manage_course(course_id));
CREATE POLICY "Students write own progress" ON public.lesson_progress FOR INSERT TO authenticated WITH CHECK (student_id = auth.uid());
CREATE POLICY "Students update own progress" ON public.lesson_progress FOR UPDATE TO authenticated USING (student_id = auth.uid());
CREATE POLICY "Managers delete progress" ON public.lesson_progress FOR DELETE TO authenticated USING (public.can_manage_course(course_id));
CREATE TRIGGER lesson_progress_updated_at BEFORE UPDATE ON public.lesson_progress FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  instructions TEXT,
  due_at TIMESTAMPTZ,
  max_score INTEGER NOT NULL DEFAULT 100,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.assignments TO authenticated;
GRANT ALL ON public.assignments TO service_role;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enrolled or managers read assignments" ON public.assignments FOR SELECT TO authenticated USING (public.is_enrolled(course_id) OR public.can_manage_course(course_id));
CREATE POLICY "Managers insert assignments" ON public.assignments FOR INSERT TO authenticated WITH CHECK (public.can_manage_course(course_id));
CREATE POLICY "Managers update assignments" ON public.assignments FOR UPDATE TO authenticated USING (public.can_manage_course(course_id));
CREATE POLICY "Managers delete assignments" ON public.assignments FOR DELETE TO authenticated USING (public.can_manage_course(course_id));
CREATE TRIGGER assignments_updated_at BEFORE UPDATE ON public.assignments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.assignment_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  answer_text TEXT,
  file_url TEXT,
  score INTEGER,
  feedback TEXT,
  graded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  graded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (assignment_id, student_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.assignment_submissions TO authenticated;
GRANT ALL ON public.assignment_submissions TO service_role;
ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own or managed submissions readable" ON public.assignment_submissions FOR SELECT TO authenticated USING (student_id = auth.uid() OR public.can_manage_course(course_id));
CREATE POLICY "Students submit own work" ON public.assignment_submissions FOR INSERT TO authenticated WITH CHECK (student_id = auth.uid() AND public.is_enrolled(course_id));
CREATE POLICY "Students edit own, managers grade" ON public.assignment_submissions FOR UPDATE TO authenticated USING (student_id = auth.uid() OR public.can_manage_course(course_id));
CREATE POLICY "Managers delete submissions" ON public.assignment_submissions FOR DELETE TO authenticated USING (public.can_manage_course(course_id));
CREATE TRIGGER assignment_submissions_updated_at BEFORE UPDATE ON public.assignment_submissions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.quizzes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  pass_percent INTEGER NOT NULL DEFAULT 60,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quizzes TO authenticated;
GRANT ALL ON public.quizzes TO service_role;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enrolled or managers read quizzes" ON public.quizzes FOR SELECT TO authenticated USING (public.is_enrolled(course_id) OR public.can_manage_course(course_id));
CREATE POLICY "Managers insert quizzes" ON public.quizzes FOR INSERT TO authenticated WITH CHECK (public.can_manage_course(course_id));
CREATE POLICY "Managers update quizzes" ON public.quizzes FOR UPDATE TO authenticated USING (public.can_manage_course(course_id));
CREATE POLICY "Managers delete quizzes" ON public.quizzes FOR DELETE TO authenticated USING (public.can_manage_course(course_id));
CREATE TRIGGER quizzes_updated_at BEFORE UPDATE ON public.quizzes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.quiz_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  options JSONB NOT NULL DEFAULT '[]'::jsonb,
  correct_index INTEGER NOT NULL DEFAULT 0,
  position INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quiz_questions TO authenticated;
GRANT ALL ON public.quiz_questions TO service_role;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enrolled or managers read questions" ON public.quiz_questions FOR SELECT TO authenticated USING (public.is_enrolled(course_id) OR public.can_manage_course(course_id));
CREATE POLICY "Managers insert questions" ON public.quiz_questions FOR INSERT TO authenticated WITH CHECK (public.can_manage_course(course_id));
CREATE POLICY "Managers update questions" ON public.quiz_questions FOR UPDATE TO authenticated USING (public.can_manage_course(course_id));
CREATE POLICY "Managers delete questions" ON public.quiz_questions FOR DELETE TO authenticated USING (public.can_manage_course(course_id));
CREATE TRIGGER quiz_questions_updated_at BEFORE UPDATE ON public.quiz_questions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.quiz_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score_percent INTEGER NOT NULL DEFAULT 0,
  passed BOOLEAN NOT NULL DEFAULT false,
  answers JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.quiz_attempts TO authenticated;
GRANT ALL ON public.quiz_attempts TO service_role;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own or managed attempts readable" ON public.quiz_attempts FOR SELECT TO authenticated USING (student_id = auth.uid() OR public.can_manage_course(course_id));
CREATE POLICY "Students record own attempts" ON public.quiz_attempts FOR INSERT TO authenticated WITH CHECK (student_id = auth.uid() AND public.is_enrolled(course_id));

CREATE TABLE public.certificates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  certificate_no TEXT NOT NULL UNIQUE DEFAULT ('SSTS-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10))),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_name TEXT,
  course_title TEXT,
  issued_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (course_id, student_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.certificates TO authenticated;
GRANT ALL ON public.certificates TO service_role;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own or managed certificates readable" ON public.certificates FOR SELECT TO authenticated USING (student_id = auth.uid() OR public.can_manage_course(course_id));
CREATE POLICY "Managers issue certificates" ON public.certificates FOR INSERT TO authenticated WITH CHECK (public.can_manage_course(course_id) AND issued_by = auth.uid());
CREATE POLICY "Managers update certificates" ON public.certificates FOR UPDATE TO authenticated USING (public.can_manage_course(course_id));
CREATE POLICY "Managers delete certificates" ON public.certificates FOR DELETE TO authenticated USING (public.can_manage_course(course_id));