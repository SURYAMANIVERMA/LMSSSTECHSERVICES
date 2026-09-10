import { Navigate, useLocation } from "react-router-dom";
import { useLmsAuth, type AppRole } from "@/hooks/useLmsAuth";
import { AccessDenied, LmsLoading } from "./AccessState";

/**
 * Route guard. Frontend layer only — every page also relies on database-level
 * row security, so a bypass here still cannot read another user's data.
 */
export default function RequireRole({
  allow,
  children,
}: {
  allow: AppRole[];
  children: React.ReactNode;
}) {
  const { loading, rolesLoaded, session, effectiveRole, disabled } = useLmsAuth();
  const loc = useLocation();

  if (loading || (session && !rolesLoaded)) return <LmsLoading />;

  if (!session) {
    return <Navigate to={`/lms/auth?next=${encodeURIComponent(loc.pathname)}`} replace />;
  }

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
      />
    );
  }

  if (!allow.includes(effectiveRole)) {
    return (
      <AccessDenied message="You do not have permission to access this page." actionTo="/lms" actionLabel="Go to my dashboard" />
    );
  }

  return <>{children}</>;
}
