-- SS TECH SERVICES LMS backend
-- Roles
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'student';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'trainer';

-- Course catalog
CREATE TABLE IF NOT EXISTS public.lms_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  level TEXT NOT NULL DEFAULT 'Beginner' CHECK (level IN ('Beginner','Intermediate','Advanced','All Levels')),
  duration_hours INTEGER NOT NULL DEFAULT 0 CHECK (duration_hours >= 0),
  thumbnail_url TEXT,
  certification_name TEXT,
  published BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.lms_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.lms_courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(course_id, position)
);

CREATE TABLE IF NOT EXISTS public.lms_lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES public.lms_modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  position INTEGER NOT NULL DEFAULT 1,
  content_type TEXT NOT NULL DEFAULT 'video' CHECK (content_type IN ('video','article','lab','assignment')),
  video_url TEXT,
  content TEXT,
  duration_minutes INTEGER NOT NULL DEFAULT 0 CHECK (duration_minutes >= 0),
  is_preview BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(module_id, position)
);

CREATE TABLE IF NOT EXISTS public.lms_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.lms_courses(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed','cancelled')),
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  UNIQUE(student_id, course_id)
);

CREATE TABLE IF NOT EXISTS public.lms_lesson_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES public.lms_lessons(id) ON DELETE CASCADE,
  completed BOOLEAN NOT NULL DEFAULT false,
  progress_percent INTEGER NOT NULL DEFAULT 0 CHECK (progress_percent BETWEEN 0 AND 100),
  last_position_seconds INTEGER NOT NULL DEFAULT 0 CHECK (last_position_seconds >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(student_id, lesson_id)
);

CREATE TABLE IF NOT EXISTS public.lms_quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.lms_courses(id) ON DELETE CASCADE,
  module_id UUID REFERENCES public.lms_modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  passing_score INTEGER NOT NULL DEFAULT 70 CHECK (passing_score BETWEEN 0 AND 100),
  published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.lms_quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES public.lms_quizzes(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  options JSONB NOT NULL DEFAULT '[]'::jsonb,
  correct_answer TEXT NOT NULL,
  points INTEGER NOT NULL DEFAULT 1 CHECK (points > 0),
  position INTEGER NOT NULL DEFAULT 1,
  UNIQUE(quiz_id, position)
);

CREATE TABLE IF NOT EXISTS public.lms_quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES public.lms_quizzes(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score INTEGER NOT NULL DEFAULT 0 CHECK (score BETWEEN 0 AND 100),
  passed BOOLEAN NOT NULL DEFAULT false,
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.lms_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  certificate_no TEXT NOT NULL UNIQUE DEFAULT ('SST-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12))),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.lms_courses(id) ON DELETE CASCADE,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  verification_token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(18), 'hex'),
  UNIQUE(student_id, course_id)
);

CREATE TABLE IF NOT EXISTS public.lms_course_trainers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.lms_courses(id) ON DELETE CASCADE,
  trainer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(course_id, trainer_id)
);

CREATE TABLE IF NOT EXISTS public.lms_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.lms_courses(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES public.lms_lessons(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  file_url TEXT,
  storage_path TEXT,
  file_type TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Updated-at trigger
DROP TRIGGER IF EXISTS lms_courses_updated_at ON public.lms_courses;
CREATE TRIGGER lms_courses_updated_at BEFORE UPDATE ON public.lms_courses
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS lms_progress_updated_at ON public.lms_lesson_progress;
CREATE TRIGGER lms_progress_updated_at BEFORE UPDATE ON public.lms_lesson_progress
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Helper role function already exists; these RPCs keep role assignment server-side.
CREATE OR REPLACE FUNCTION public.ensure_student_role()
RETURNS public.app_role
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE existing_role public.app_role;
BEGIN
  SELECT role INTO existing_role FROM public.user_roles WHERE user_id = auth.uid() ORDER BY CASE role WHEN 'admin' THEN 1 WHEN 'trainer' THEN 2 WHEN 'engineer' THEN 3 ELSE 4 END LIMIT 1;
  IF existing_role IS NOT NULL THEN RETURN existing_role; END IF;
  INSERT INTO public.user_roles(user_id, role) VALUES(auth.uid(), 'student') ON CONFLICT DO NOTHING;
  RETURN 'student';
END;
$$;
GRANT EXECUTE ON FUNCTION public.ensure_student_role() TO authenticated;

CREATE OR REPLACE FUNCTION public.issue_course_certificate(p_course_id UUID)
RETURNS public.lms_certificates
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_completed INTEGER;
  v_total INTEGER;
  v_cert public.lms_certificates;
BEGIN
  IF NOT public.has_role(auth.uid(), 'student') THEN
    RAISE EXCEPTION 'Student role required';
  END IF;
  SELECT COUNT(*) INTO v_total
  FROM public.lms_lessons l JOIN public.lms_modules m ON m.id = l.module_id WHERE m.course_id = p_course_id;
  SELECT COUNT(*) INTO v_completed
  FROM public.lms_lesson_progress p JOIN public.lms_lessons l ON l.id=p.lesson_id JOIN public.lms_modules m ON m.id=l.module_id
  WHERE p.student_id=auth.uid() AND m.course_id=p_course_id AND p.completed=true;
  IF v_total = 0 OR v_completed < v_total THEN RAISE EXCEPTION 'Course is not completed'; END IF;
  INSERT INTO public.lms_certificates(student_id, course_id) VALUES(auth.uid(), p_course_id)
  ON CONFLICT(student_id, course_id) DO NOTHING
  RETURNING * INTO v_cert;
  IF v_cert.id IS NULL THEN
    SELECT * INTO v_cert FROM public.lms_certificates WHERE student_id=auth.uid() AND course_id=p_course_id LIMIT 1;
  END IF;
  UPDATE public.lms_enrollments SET status='completed', completed_at=COALESCE(completed_at, now()) WHERE student_id=auth.uid() AND course_id=p_course_id;
  RETURN v_cert;
END;
$$;
GRANT EXECUTE ON FUNCTION public.issue_course_certificate(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_course_progress(p_course_id UUID, p_student_id UUID DEFAULT auth.uid())
RETURNS INTEGER
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path=public
AS $$
  SELECT COALESCE(ROUND(100.0 * COUNT(*) FILTER (WHERE p.completed) / NULLIF(COUNT(l.id),0)),0)::INTEGER
  FROM public.lms_modules m
  JOIN public.lms_lessons l ON l.module_id=m.id
  LEFT JOIN public.lms_lesson_progress p ON p.lesson_id=l.id AND p.student_id=p_student_id
  WHERE m.course_id=p_course_id;
$$;
GRANT EXECUTE ON FUNCTION public.get_course_progress(UUID, UUID) TO authenticated;

-- RLS
ALTER TABLE public.lms_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lms_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lms_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lms_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lms_lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lms_quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lms_quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lms_quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lms_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lms_course_trainers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lms_materials ENABLE ROW LEVEL SECURITY;

-- Courses/modules/lessons are readable when published; staff can manage.
CREATE POLICY "Published courses readable" ON public.lms_courses FOR SELECT TO anon, authenticated USING (published=true OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'trainer') OR public.has_role(auth.uid(),'engineer'));
CREATE POLICY "Staff manage courses" ON public.lms_courses FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'trainer')) WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'trainer'));
CREATE POLICY "Course modules readable" ON public.lms_modules FOR SELECT TO anon, authenticated USING (EXISTS (SELECT 1 FROM public.lms_courses c WHERE c.id=course_id AND (c.published=true OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'trainer'))));
CREATE POLICY "Staff manage modules" ON public.lms_modules FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'trainer')) WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'trainer'));
CREATE POLICY "Lessons readable" ON public.lms_lessons FOR SELECT TO anon, authenticated USING (EXISTS (SELECT 1 FROM public.lms_modules m JOIN public.lms_courses c ON c.id=m.course_id WHERE m.id=module_id AND (c.published=true OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'trainer'))));
CREATE POLICY "Staff manage lessons" ON public.lms_lessons FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'trainer')) WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'trainer'));

CREATE POLICY "Students view own enrollments" ON public.lms_enrollments FOR SELECT TO authenticated USING (student_id=auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'trainer'));
CREATE POLICY "Students enroll themselves" ON public.lms_enrollments FOR INSERT TO authenticated WITH CHECK (student_id=auth.uid() AND public.has_role(auth.uid(),'student'));
CREATE POLICY "Staff manage enrollments" ON public.lms_enrollments FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'trainer')) WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'trainer'));

CREATE POLICY "Students own progress" ON public.lms_lesson_progress FOR SELECT TO authenticated USING (student_id=auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'trainer'));
CREATE POLICY "Students write own progress" ON public.lms_lesson_progress FOR INSERT TO authenticated WITH CHECK (student_id=auth.uid() AND public.has_role(auth.uid(),'student'));
CREATE POLICY "Students update own progress" ON public.lms_lesson_progress FOR UPDATE TO authenticated USING (student_id=auth.uid() AND public.has_role(auth.uid(),'student')) WITH CHECK (student_id=auth.uid());
CREATE POLICY "Staff manage progress" ON public.lms_lesson_progress FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'trainer')) WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'trainer'));

CREATE POLICY "Published quizzes readable" ON public.lms_quizzes FOR SELECT TO authenticated USING (published=true OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'trainer'));
CREATE POLICY "Quiz questions readable" ON public.lms_quiz_questions FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.lms_quizzes q WHERE q.id=quiz_id AND (q.published=true OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'trainer'))));
CREATE POLICY "Staff manage quizzes" ON public.lms_quizzes FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'trainer')) WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'trainer'));
CREATE POLICY "Staff manage quiz questions" ON public.lms_quiz_questions FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'trainer')) WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'trainer'));
CREATE POLICY "Students view own attempts" ON public.lms_quiz_attempts FOR SELECT TO authenticated USING (student_id=auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'trainer'));
CREATE POLICY "Students submit attempts" ON public.lms_quiz_attempts FOR INSERT TO authenticated WITH CHECK (student_id=auth.uid() AND public.has_role(auth.uid(),'student'));
CREATE POLICY "Staff manage attempts" ON public.lms_quiz_attempts FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'trainer')) WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'trainer'));

CREATE POLICY "Students view own certificates" ON public.lms_certificates FOR SELECT TO authenticated USING (student_id=auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'trainer'));
CREATE POLICY "Staff manage certificates" ON public.lms_certificates FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'trainer')) WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'trainer'));

CREATE POLICY "Course trainers readable" ON public.lms_course_trainers FOR SELECT TO authenticated USING (trainer_id=auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'trainer'));
CREATE POLICY "Admins manage course trainers" ON public.lms_course_trainers FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE POLICY "Materials readable" ON public.lms_materials FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'trainer') OR EXISTS (SELECT 1 FROM public.lms_enrollments e WHERE e.course_id=lms_materials.course_id AND e.student_id=auth.uid() AND e.status='active'));
CREATE POLICY "Staff manage materials" ON public.lms_materials FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'trainer')) WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'trainer'));

-- Seed a starter catalog. Safe to run repeatedly.
INSERT INTO public.lms_courses (slug,title,description,category,level,duration_hours,certification_name,published)
VALUES
('cyber-security-foundations','Cyber Security Foundations','Security fundamentals, networking, threats, controls and defensive operations.','Cyber Security','Beginner',40,'SS TECH SERVICES Cyber Security Foundations',true),
('ethical-hacking','Ethical Hacking & Penetration Testing','Legal and authorized security testing using modern assessment workflows.','Cyber Security','Intermediate',60,'SS TECH SERVICES Ethical Hacking',true),
('soc-analyst','SOC Analyst','Security monitoring, SIEM, incident triage, threat detection and response.','Cyber Security','Intermediate',50,'SS TECH SERVICES SOC Analyst',true),
('hardware-networking','Hardware & Networking','Computer hardware, LAN/WAN, switching, routing and troubleshooting.','Networking','Beginner',45,'SS TECH SERVICES Hardware & Networking',true),
('ccna','CCNA Networking','Enterprise networking fundamentals, VLANs, routing, ACLs and troubleshooting.','Networking','Intermediate',55,'SS TECH SERVICES CCNA Track',true),
('linux-administration','Linux Administration','Linux installation, users, services, storage, security and troubleshooting.','Linux','Beginner',45,'SS TECH SERVICES Linux Administration',true),
('openshift-administration','OpenShift Administration','Containers, operators, cluster administration, storage, networking and operations.','Cloud & DevOps','Advanced',55,'SS TECH SERVICES OpenShift Administration',true),
('devops-engineer','DevOps Engineer','Git, CI/CD, Docker, Kubernetes, automation and observability.','Cloud & DevOps','Intermediate',65,'SS TECH SERVICES DevOps Engineer',true),
('cloud-fundamentals','Cloud Computing Fundamentals','AWS, Azure, GCP concepts, architecture, security and FinOps fundamentals.','Cloud','Beginner',40,'SS TECH SERVICES Cloud Fundamentals',true),
('full-stack-development','Full Stack Web Development','Modern HTML, CSS, JavaScript, React, APIs and databases.','Software Development','Intermediate',70,'SS TECH SERVICES Full Stack Developer',true),
('python-development','Python Development','Python programming, automation, APIs, testing and practical projects.','Programming','Beginner',45,'SS TECH SERVICES Python Developer',true),
('mobile-app-development','Mobile App Development','Android, Flutter, APIs, authentication and mobile deployment fundamentals.','Mobile Development','Intermediate',55,'SS TECH SERVICES Mobile Developer',true),
('ai-machine-learning','AI & Machine Learning','Data preparation, ML fundamentals, model evaluation and practical AI workflows.','Data & AI','Intermediate',60,'SS TECH SERVICES AI & ML',true),
('robotics-iot','Robotics & IoT','Arduino, Raspberry Pi, sensors, automation, IoT and robotics fundamentals.','Robotics & IoT','Beginner',50,'SS TECH SERVICES Robotics & IoT',true),
('career-readiness','IT Career Readiness','Resume, LinkedIn, communication, interview preparation and job readiness.','Career Readiness','All Levels',20,'SS TECH SERVICES Career Readiness',true)
ON CONFLICT (slug) DO NOTHING;

-- Storage bucket for LMS materials; files remain private and are served via authenticated access.
INSERT INTO storage.buckets (id, name, public) VALUES ('lms-materials','lms-materials',false) ON CONFLICT (id) DO NOTHING;
CREATE POLICY "LMS staff upload materials" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id='lms-materials' AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'trainer')));
CREATE POLICY "LMS enrolled students read materials" ON storage.objects FOR SELECT TO authenticated USING (bucket_id='lms-materials' AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'trainer') OR EXISTS (SELECT 1 FROM public.lms_materials m JOIN public.lms_enrollments e ON e.course_id=m.course_id WHERE m.storage_path=name AND e.student_id=auth.uid() AND e.status='active')));
CREATE POLICY "LMS staff update materials" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id='lms-materials' AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'trainer')));
CREATE POLICY "LMS staff delete materials" ON storage.objects FOR DELETE TO authenticated USING (bucket_id='lms-materials' AND public.has_role(auth.uid(),'admin'));

-- Secure quiz submission: client submits answers, server calculates score.
CREATE OR REPLACE FUNCTION public.submit_quiz(p_quiz_id UUID, p_answers JSONB)
RETURNS public.lms_quiz_attempts
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path=public
AS $$
DECLARE
  q RECORD;
  total_points INTEGER := 0;
  earned_points INTEGER := 0;
  v_score INTEGER := 0;
  v_passed BOOLEAN := false;
  v_attempt public.lms_quiz_attempts;
  supplied TEXT;
BEGIN
  IF NOT public.has_role(auth.uid(), 'student') THEN
    RAISE EXCEPTION 'Student role required';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.lms_quizzes WHERE id=p_quiz_id AND published=true) THEN
    RAISE EXCEPTION 'Quiz is not available';
  END IF;
  FOR q IN SELECT id, correct_answer, points FROM public.lms_quiz_questions WHERE quiz_id=p_quiz_id LOOP
    total_points := total_points + q.points;
    supplied := p_answers ->> q.id::text;
    IF supplied IS NOT NULL AND supplied = q.correct_answer THEN earned_points := earned_points + q.points; END IF;
  END LOOP;
  IF total_points > 0 THEN v_score := ROUND((earned_points::numeric / total_points::numeric) * 100); END IF;
  SELECT v_score >= passing_score INTO v_passed FROM public.lms_quizzes WHERE id=p_quiz_id;
  INSERT INTO public.lms_quiz_attempts(quiz_id,student_id,score,passed,answers)
  VALUES(p_quiz_id,auth.uid(),v_score,v_passed,p_answers)
  RETURNING * INTO v_attempt;
  RETURN v_attempt;
END;
$$;
GRANT EXECUTE ON FUNCTION public.submit_quiz(UUID, JSONB) TO authenticated;

-- Public certificate verification with no student PII beyond the certificate holder name.
CREATE OR REPLACE FUNCTION public.verify_certificate(p_token TEXT)
RETURNS TABLE(certificate_no TEXT, course_title TEXT, student_name TEXT, issued_at TIMESTAMPTZ)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path=public
AS $$
  SELECT c.certificate_no, co.title, COALESCE(p.display_name, p.email, 'Student'), c.issued_at
  FROM public.lms_certificates c
  JOIN public.lms_courses co ON co.id=c.course_id
  JOIN public.profiles p ON p.id=c.student_id
  WHERE c.verification_token=p_token
  LIMIT 1;
$$;
GRANT EXECUTE ON FUNCTION public.verify_certificate(TEXT) TO anon, authenticated;

-- Admin-only role management for LMS staff.
CREATE OR REPLACE FUNCTION public.admin_set_lms_role(p_user_id UUID, p_role public.app_role)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path=public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Admin role required'; END IF;
  IF p_role NOT IN ('student','trainer') THEN RAISE EXCEPTION 'Only student or trainer roles can be managed here'; END IF;
  DELETE FROM public.user_roles WHERE user_id=p_user_id AND role IN ('student','trainer','engineer');
  INSERT INTO public.user_roles(user_id,role) VALUES(p_user_id,p_role) ON CONFLICT(user_id,role) DO NOTHING;
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_set_lms_role(UUID, public.app_role) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_assign_course_trainer(p_course_id UUID, p_trainer_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path=public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Admin role required'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id=p_trainer_id AND role IN ('trainer','engineer')) THEN RAISE EXCEPTION 'User is not a trainer'; END IF;
  INSERT INTO public.lms_course_trainers(course_id,trainer_id) VALUES(p_course_id,p_trainer_id) ON CONFLICT DO NOTHING;
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_assign_course_trainer(UUID, UUID) TO authenticated;

CREATE POLICY "Admins view all roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin') OR user_id=auth.uid());
