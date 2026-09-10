-- 1. Hide quiz answer keys from students
DROP POLICY IF EXISTS "Enrolled or managers read questions" ON public.quiz_questions;
DROP POLICY IF EXISTS "Managers read questions" ON public.quiz_questions;
CREATE POLICY "Managers read questions" ON public.quiz_questions
  FOR SELECT TO authenticated USING (public.can_manage_course(course_id));

CREATE OR REPLACE FUNCTION public.get_quiz_questions_for_attempt(p_quiz_id uuid)
RETURNS TABLE(id uuid, question text, options jsonb, "position" integer, marks integer, explanation text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  v_course uuid;
  v_passed boolean;
BEGIN
  SELECT q.course_id INTO v_course FROM public.quizzes q WHERE q.id = p_quiz_id;
  IF v_course IS NULL THEN RETURN; END IF;
  IF NOT (public.is_enrolled(v_course) OR public.can_manage_course(v_course)) THEN
    RAISE EXCEPTION 'Not authorised for this quiz';
  END IF;
  SELECT EXISTS (SELECT 1 FROM public.quiz_attempts a
                 WHERE a.quiz_id = p_quiz_id AND a.student_id = auth.uid() AND a.passed)
    INTO v_passed;

  RETURN QUERY
  SELECT qq.id, qq.question, qq.options, qq."position", qq.marks,
         CASE WHEN v_passed OR public.can_manage_course(v_course) THEN qq.explanation ELSE NULL END
  FROM public.quiz_questions qq
  WHERE qq.quiz_id = p_quiz_id
  ORDER BY qq."position";
END;
$$;
REVOKE ALL ON FUNCTION public.get_quiz_questions_for_attempt(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.get_quiz_questions_for_attempt(uuid) TO authenticated;

-- 2. Server-side quiz grading; students may no longer insert attempts directly
DROP POLICY IF EXISTS "Students record own attempts" ON public.quiz_attempts;

CREATE OR REPLACE FUNCTION public.submit_quiz_attempt(p_quiz_id uuid, p_answers jsonb)
RETURNS TABLE(attempt_number integer, score_percent integer, passed boolean)
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  v_course uuid;
  v_pass integer;
  v_total integer := 0;
  v_gained integer := 0;
  v_score integer := 0;
  v_passed boolean;
  v_num integer;
  v_clean jsonb := '[]'::jsonb;
  r record;
  v_sel integer;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  IF p_answers IS NULL OR jsonb_typeof(p_answers) <> 'array' THEN
    RAISE EXCEPTION 'Answers must be an array';
  END IF;

  SELECT q.course_id, q.pass_percent INTO v_course, v_pass FROM public.quizzes q WHERE q.id = p_quiz_id;
  IF v_course IS NULL THEN RAISE EXCEPTION 'Quiz not found'; END IF;
  IF NOT public.is_enrolled(v_course) THEN RAISE EXCEPTION 'You are not enrolled in this course'; END IF;

  FOR r IN SELECT qq.id, qq.correct_index, COALESCE(qq.marks, 1) AS marks
           FROM public.quiz_questions qq WHERE qq.quiz_id = p_quiz_id LOOP
    v_total := v_total + r.marks;
    SELECT NULLIF(a->>'selected', '')::integer INTO v_sel
    FROM jsonb_array_elements(p_answers) a
    WHERE a->>'question_id' = r.id::text
    LIMIT 1;
    IF v_sel IS NOT NULL AND v_sel = r.correct_index THEN
      v_gained := v_gained + r.marks;
    END IF;
    v_clean := v_clean || jsonb_build_object('question_id', r.id, 'selected', v_sel);
    v_sel := NULL;
  END LOOP;

  IF v_total > 0 THEN v_score := round((v_gained::numeric / v_total) * 100); END IF;
  v_passed := v_score >= COALESCE(v_pass, 100);

  INSERT INTO public.quiz_attempts (quiz_id, course_id, student_id, score_percent, passed, answers)
  VALUES (p_quiz_id, v_course, auth.uid(), v_score, v_passed, v_clean)
  RETURNING public.quiz_attempts.attempt_number INTO v_num;

  RETURN QUERY SELECT v_num, v_score, v_passed;
END;
$$;
REVOKE ALL ON FUNCTION public.submit_quiz_attempt(uuid, jsonb) FROM public;
GRANT EXECUTE ON FUNCTION public.submit_quiz_attempt(uuid, jsonb) TO authenticated;

-- 3. Students cannot write their own grades
CREATE OR REPLACE FUNCTION public.guard_submission_grading()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  IF public.can_manage_course(NEW.course_id) THEN
    RETURN NEW;
  END IF;
  NEW.score := OLD.score;
  NEW.feedback := OLD.feedback;
  NEW.graded_by := OLD.graded_by;
  NEW.graded_at := OLD.graded_at;
  NEW.student_id := OLD.student_id;
  NEW.course_id := OLD.course_id;
  NEW.assignment_id := OLD.assignment_id;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS guard_submission_grading ON public.assignment_submissions;
CREATE TRIGGER guard_submission_grading BEFORE UPDATE ON public.assignment_submissions
FOR EACH ROW EXECUTE FUNCTION public.guard_submission_grading();

CREATE OR REPLACE FUNCTION public.guard_submission_insert()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.can_manage_course(NEW.course_id) THEN
    NEW.score := NULL; NEW.feedback := NULL; NEW.graded_by := NULL; NEW.graded_at := NULL;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS guard_submission_insert ON public.assignment_submissions;
CREATE TRIGGER guard_submission_insert BEFORE INSERT ON public.assignment_submissions
FOR EACH ROW EXECUTE FUNCTION public.guard_submission_insert();

-- 4. Paid lesson content requires enrollment
DROP POLICY IF EXISTS "Lessons of published courses readable" ON public.lessons;
DROP POLICY IF EXISTS "Free lessons of published courses readable" ON public.lessons;
DROP POLICY IF EXISTS "Enrolled students read course lessons" ON public.lessons;
CREATE POLICY "Free lessons of published courses readable" ON public.lessons
  FOR SELECT TO anon, authenticated
  USING (is_free = true AND EXISTS (SELECT 1 FROM public.courses c WHERE c.id = lessons.course_id AND c.is_published = true));
CREATE POLICY "Enrolled students read course lessons" ON public.lessons
  FOR SELECT TO authenticated USING (public.is_enrolled(course_id));

-- Public curriculum outline (titles only, no content)
CREATE OR REPLACE FUNCTION public.get_course_outline(p_course_id uuid)
RETURNS TABLE(id uuid, module_id uuid, title text, description text, lesson_type text, "position" integer, duration_minutes integer, is_free boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT l.id, l.module_id, l.title, l.description, l.lesson_type, l."position", l.duration_minutes, l.is_free
  FROM public.lessons l
  JOIN public.courses c ON c.id = l.course_id
  WHERE l.course_id = p_course_id AND c.is_published = true
  ORDER BY l."position";
$$;
REVOKE ALL ON FUNCTION public.get_course_outline(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.get_course_outline(uuid) TO anon, authenticated;