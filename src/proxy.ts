import { NextResponse, type NextRequest } from "next/server";
import { errorResponse, guard, setSessionCookies } from "@/app/api/_lib/guard";
import { CSRF_COOKIE, SESSION_COOKIE } from "@/contracts/auth";
import {
  REMEMBER_MAX_AGE_SECONDS,
  type AuthSession,
} from "@/domains/auth/sessions";

const redirectTo = (path: string, request: NextRequest) =>
  NextResponse.redirect(new URL(path, request.url));

function respond(
  request: NextRequest,
  session: AuthSession | null,
  denial: 401 | 403 | null,
) {
  if (denial === null) {
    if (request.nextUrl.pathname !== "/") return NextResponse.next();
    // The home path is the public landing page; the owner lands on the panel.
    if (session?.user.role === "ADMIN") return redirectTo("/painel", request);
    return NextResponse.next();
  }
  // The route answers 401 itself and clears the stale cookies, which the proxy cannot do for it.
  if (
    denial === 401 &&
    request.method === "POST" &&
    request.nextUrl.pathname === "/api/auth/logout"
  )
    return NextResponse.next();
  if (request.nextUrl.pathname.startsWith("/api/"))
    return errorResponse(denial);
  if (denial === 401) return redirectTo("/login", request);
  return new NextResponse("Acesso negado.", { status: 403 });
}

// Optimistic gate before rendering. Next.js proxy is not a complete auth layer,
// so every route handler applies the same guard again.
export async function proxy(request: NextRequest) {
  const { session, denial } = await guard(request);
  const response = respond(request, session, denial);
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
