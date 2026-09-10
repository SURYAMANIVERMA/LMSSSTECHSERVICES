-- These helpers are evaluated inside RLS policies, which run as the querying
-- role, so anon/authenticated must retain EXECUTE.
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.can_manage_course(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_enrolled(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_assigned_trainer(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.shares_managed_course(uuid) TO authenticated;