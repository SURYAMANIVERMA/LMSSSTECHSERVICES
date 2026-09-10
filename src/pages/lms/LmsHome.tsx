import { Navigate } from "react-router-dom";
import { dashboardPathFor, useLmsAuth } from "@/hooks/useLmsAuth";
import { AccessDenied, LmsLoading } from "@/components/lms/AccessState";

/** /lms — sends every signed-in user to the dashboard that matches their role. */
export default function LmsHome() {
  const { loading, rolesLoaded, session, effectiveRole, disabled } = useLmsAuth();

  if (loading || (session && !rolesLoaded)) return <LmsLoading />;
  if (!session) return <Navigate to="/lms/auth?next=/lms" replace />;
  if (disabled) {
    return (
      <AccessDenied
        title="Account disabled"
        message="Your account has been disabled. Please contact the administrator."
      />
    );
  }
  if (!effectiveRole) {
    return (
      <AccessDenied
        title="No role assigned"
        message="Your account is waiting for approval. An administrator must assign your role before you can use the LMS."
        actionTo="/lms/courses"
        actionLabel="Browse courses"
      />
    );
  }
  return <Navigate to={dashboardPathFor(effectiveRole)} replace />;
}
