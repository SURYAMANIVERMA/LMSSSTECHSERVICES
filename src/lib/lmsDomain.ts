// Official LMS hostname plus the hosts we are allowed to serve from.
export const OFFICIAL_LMS_HOST = "lms.sstechservices.org";

const ALLOWED_PRODUCTION_HOSTS = [
  OFFICIAL_LMS_HOST,
  "sstechservices-org.lovable.app",
];

const DEV_HOSTS = ["localhost", "127.0.0.1", "0.0.0.0", "[::1]"];

export function isAllowedLmsHost(hostname = window.location.hostname): boolean {
  const host = hostname.toLowerCase();
  if (DEV_HOSTS.includes(host) || host.endsWith(".localhost")) return true;
  // Lovable preview / sandbox surfaces stay usable for development & QA.
  if (host.endsWith(".lovableproject.com") || host.endsWith(".lovable.app")) return true;
  return ALLOWED_PRODUCTION_HOSTS.includes(host);
}
