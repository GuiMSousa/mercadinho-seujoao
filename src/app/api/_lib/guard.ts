import { NextResponse, type NextRequest } from "next/server";
import { CSRF_COOKIE, CSRF_HEADER, SESSION_COOKIE } from "@/contracts/auth";
import { accessDenial } from "@/domains/auth/access";
import { hashToken, readSession } from "@/domains/auth/sessions";

const MESSAGES = {
  400: "Requisição inválida.",
  401: "Faça login para continuar.",
  403: "Acesso negado.",
} as const;

export function errorResponse(
  status: keyof typeof MESSAGES,
  message: string = MESSAGES[status],
) {
  return NextResponse.json({ error: message }, { status });
}

/** Reads the session and applies the shared access rule; used by the proxy and by every route. */
export async function guard(request: NextRequest) {
  const session = await readSession(request.cookies.get(SESSION_COOKIE)?.value);
  // Both sides are hashes, so the comparison reveals nothing about the token itself.
  const csrfOk =
    session !== null &&
    hashToken(request.headers.get(CSRF_HEADER) ?? "") === session.csrfHash;
  const denial = accessDenial({
    pathname: request.nextUrl.pathname,
    method: request.method,
    session: session && { role: session.user.role },
    csrfOk,
    origin: request.headers.get("origin"),
    host:
      request.headers.get("x-forwarded-host") ?? request.headers.get("host"),
  });
  return { session, denial };
}

export function setSessionCookies(
  request: NextRequest,
  response: NextResponse,
  {
    token,
    csrfToken,
    maxAgeSeconds,
  }: { token: string; csrfToken: string; maxAgeSeconds: number | null },
) {
  // Secure only over HTTPS: on plain-HTTP LAN access the browser would drop a Secure cookie.
  const secure =
    request.nextUrl.protocol === "https:" ||
    request.headers.get("x-forwarded-proto") === "https";
  const options = {
    sameSite: "lax",
    secure,
    path: "/",
    // No maxAge: a browser-session cookie that ends when the browser closes.
    ...(maxAgeSeconds === null ? {} : { maxAge: maxAgeSeconds }),
  } as const;
  response.cookies.set(SESSION_COOKIE, token, { ...options, httpOnly: true });
  response.cookies.set(CSRF_COOKIE, csrfToken, { ...options, httpOnly: false });
}

export function clearSessionCookies(response: NextResponse) {
  response.cookies.delete(SESSION_COOKIE);
  response.cookies.delete(CSRF_COOKIE);
}
