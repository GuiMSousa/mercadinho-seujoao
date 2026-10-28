import { NextResponse, type NextRequest } from "next/server";
import { CSRF_COOKIE, CSRF_HEADER, SESSION_COOKIE } from "@/contracts/auth";
import { accessDenial } from "@/domains/auth/access";
import {
  readSessionToken,
  SESSION_MAX_AGE_SECONDS,
} from "@/domains/auth/session";

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
  const session = await readSessionToken(
    request.cookies.get(SESSION_COOKIE)?.value,
  );
  const denial = accessDenial({
    pathname: request.nextUrl.pathname,
    method: request.method,
    session,
    csrfHeader: request.headers.get(CSRF_HEADER),
    origin: request.headers.get("origin"),
    host:
      request.headers.get("x-forwarded-host") ?? request.headers.get("host"),
  });
  return { session, denial };
}

export function setSessionCookies(
  request: NextRequest,
  response: NextResponse,
  token: string,
  csrf: string,
) {
  // Secure only over HTTPS: on plain-HTTP LAN access the browser would drop a Secure cookie.
  const secure =
    request.nextUrl.protocol === "https:" ||
    request.headers.get("x-forwarded-proto") === "https";
  const options = {
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  } as const;
  response.cookies.set(SESSION_COOKIE, token, { ...options, httpOnly: true });
  response.cookies.set(CSRF_COOKIE, csrf, { ...options, httpOnly: false });
}

export function clearSessionCookies(response: NextResponse) {
  response.cookies.delete(SESSION_COOKIE);
  response.cookies.delete(CSRF_COOKIE);
}
