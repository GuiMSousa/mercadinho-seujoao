import type { Session } from "./session";

// /design-system is a static component gallery with sample data only.
const PUBLIC_PATHS = new Set([
  "/",
  "/login",
  "/design-system",
  "/api/auth/login",
]);
const ADMIN_PREFIXES = ["/admin", "/api/admin"];
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export function isAdminPath(pathname: string) {
  return ADMIN_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function isSameOrigin(origin: string | null, host: string | null) {
  // Browsers always send Origin on cross-site POSTs; its absence means a non-browser client.
  if (!origin) return true;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export type AccessRequest = {
  pathname: string;
  method: string;
  session: Session | null;
  csrfHeader: string | null;
  origin: string | null;
  host: string | null;
};

/**
 * Single access rule shared by the proxy and every route handler.
 * Returns the status that denies the request, or null when it may proceed.
 * Every path not listed as public requires a session (secure by default).
 */
export function accessDenial(request: AccessRequest): 401 | 403 | null {
  const { pathname, method, session, csrfHeader, origin, host } = request;
  const unsafe = !SAFE_METHODS.has(method);
  if (unsafe && !isSameOrigin(origin, host)) return 403;
  if (PUBLIC_PATHS.has(pathname)) return null;
  if (!session) return 401;
  if (isAdminPath(pathname) && session.role !== "ADMIN") return 403;
  if (unsafe && csrfHeader !== session.csrf) return 403;
  return null;
}
