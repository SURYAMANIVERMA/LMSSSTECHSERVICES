REVOKE ALL ON FUNCTION public.can_manage_course(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.can_manage_course(UUID) FROM anon;
REVOKE ALL ON FUNCTION public.is_enrolled(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_enrolled(UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.can_manage_course(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_enrolled(UUID) TO authenticated, service_role;