import type { Role } from "@/infrastructure/db/schema";

// /design-system is a static component gallery with sample data only.
const PUBLIC_PATHS = new Set([
  "/",
  "/login",
  "/cadastro",
  "/recuperar",
  "/design-system",
  "/api/setup",
  "/api/theme",
  "/api/auth/login",
  "/api/auth/signup",
  "/api/auth/signup/verify",
  "/api/auth/signup/resend",
  "/api/auth/password-reset",
  "/api/auth/password-reset/confirm",
]);
const ADMIN_PREFIXES = ["/painel", "/api/admin", "/api/account", "/api/store"];
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
  session: { role: Role } | null;
  // Whether the anti-CSRF header matches the session's token (see guard).
  csrfOk: boolean;
  origin: string | null;
  host: string | null;
};

/**
 * Single access rule shared by the proxy and every route handler.
 * Returns the status that denies the request, or null when it may proceed.
 * Every path not listed as public requires a session (secure by default).
 */
export function accessDenial(request: AccessRequest): 401 | 403 | null {
  const { pathname, method, session, csrfOk, origin, host } = request;
  const unsafe = !SAFE_METHODS.has(method);
  if (unsafe && !isSameOrigin(origin, host)) return 403;
  if (PUBLIC_PATHS.has(pathname)) return null;
  if (!session) return 401;
  if (isAdminPath(pathname) && session.role !== "ADMIN") return 403;
  if (unsafe && !csrfOk) return 403;
  return null;
}
