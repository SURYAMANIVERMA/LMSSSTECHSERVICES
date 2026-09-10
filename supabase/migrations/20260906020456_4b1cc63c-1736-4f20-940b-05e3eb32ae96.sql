-- Internal helpers: not callable from the API
REVOKE EXECUTE ON FUNCTION public.can_manage_course(uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_enrolled(uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_assigned_trainer(uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.shares_managed_course(uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.normalize_mobile(text) FROM anon, authenticated;

-- Trigger functions are never called directly
REVOKE EXECUTE ON FUNCTION public.guard_submission_grading() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.guard_submission_insert() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.profiles_guard_status() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.profiles_normalize() FROM anon, authenticated, PUBLIC;

-- Signed-in only RPCs
REVOKE EXECUTE ON FUNCTION public.submit_quiz_attempt(uuid, jsonb) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_quiz_questions_for_attempt(uuid) FROM anon;