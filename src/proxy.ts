import { NextResponse, type NextRequest } from "next/server";
import { errorResponse, guard, setSessionCookies } from "@/app/api/_lib/guard";
import { CSRF_COOKIE, SESSION_COOKIE, homePath } from "@/contracts/auth";
import {
  REMEMBER_MAX_AGE_SECONDS,
  type AuthSession,
} from "@/domains/auth/sessions";
import { contentSecurityPolicy, newNonce } from "@/lib/csp";

const redirectTo = (path: string, request: NextRequest) =>
  NextResponse.redirect(new URL(path, request.url));

function respond(
  request: NextRequest,
  session: AuthSession | null,
  denial: 401 | 403 | null,
  next: () => NextResponse,
) {
  if (denial === null) {
    if (request.nextUrl.pathname !== "/") return next();
    // The home path is the public landing page; a signed-in person lands on their screen.
    if (session) return redirectTo(homePath(session.user.role), request);
    return next();
  }
  // The route answers 401 itself and clears the stale cookies, which the proxy cannot do for it.
  if (
    denial === 401 &&
    request.method === "POST" &&
    request.nextUrl.pathname === "/api/auth/logout"
  )
    return next();
  if (request.nextUrl.pathname.startsWith("/api/"))
    return errorResponse(denial);
  if (denial === 401) return redirectTo("/login", request);
  // An operator who opens a panel link belongs at the sale screen, not on an error page.
  // Only page reads: a refused POST must stay refused, never bounce.
  if (session?.user.role === "CASHIER" && request.method === "GET")
    return redirectTo(homePath("CASHIER"), request);
  return new NextResponse("Acesso negado.", { status: 403 });
}

// Optimistic gate before rendering. Next.js proxy is not a complete auth layer,
// so every route handler applies the same guard again.
export async function proxy(request: NextRequest) {
  const { session, denial } = await guard(request);
  // Pages get a CSP with a fresh nonce; the request carries it too, so Next.js signs its scripts.
  const csp = request.nextUrl.pathname.startsWith("/api/")
    ? null
    : contentSecurityPolicy(newNonce(), process.env.NODE_ENV === "development");
  const next = () => {
    if (!csp) return NextResponse.next();
    const headers = new Headers(request.headers);
    headers.set("Content-Security-Policy", csp);
    return NextResponse.next({ request: { headers } });
  };
  const response = respond(request, session, denial, next);
  if (csp) response.headers.set("Content-Security-Policy", csp);
  // Sliding "Manter conectado": the database expiry moved, so the cookies move with it.
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const csrfToken = request.cookies.get(CSRF_COOKIE)?.value;
  if (session?.renewed && token && csrfToken)
    setSessionCookies(request, response, {
      token,
      csrfToken,
      maxAgeSeconds: REMEMBER_MAX_AGE_SECONDS,
    });
  return response;
}

export const config = {
  // Skip build assets and any path with a file extension (favicon, images, fonts).
  matcher: ["/((?!_next/static|_next/image|.*\\.[^/]+$).*)"],
};
