REVOKE ALL ON FUNCTION public.set_quiz_attempt_number() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.log_activity() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;