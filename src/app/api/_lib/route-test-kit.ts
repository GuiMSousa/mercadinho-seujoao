import { NextRequest } from "next/server";
import { vi } from "vitest";
import { CSRF_HEADER, SESSION_COOKIE } from "@/contracts/auth";
import { hashToken, readSession } from "@/domains/auth/sessions";

export const CSRF_TOKEN = "csrf-token";
export const SESSION_USER = {
  id: "7f1d8c1e-0d2b-4a8e-9c3f-2b6a1e5d4c3b",
  name: "Ana Souza",
  email: "ana@loja.com",
};
export const SESSION_ID = "hashed-session-id";

type Options = {
  url: string;
  method?: string;
  /** Omit for an anonymous request. */
  role?: "ADMIN" | "CASHIER";
  body?: unknown;
  /** Send the anti-CSRF header (default true). */
  csrf?: boolean;
};

/**
 * Calls a route handler as `role` (readSession is mocked by the test file with vi.mock).
 * Mutations carry the matching CSRF header unless `csrf` is false.
 */
export async function callRoute<A extends unknown[]>(
  handler: (request: NextRequest, ...rest: A) => Response | Promise<Response>,
  { url, method = "GET", role, body, csrf = true }: Options,
  ...rest: A
) {
  const headers = new Headers();
  if (role) {
    vi.mocked(readSession).mockResolvedValue({
      id: SESSION_ID,
      user: { ...SESSION_USER, role },
      csrfHash: hashToken(CSRF_TOKEN),
      remember: false,
    });
    headers.set("cookie", `${SESSION_COOKIE}=token`);
    if (csrf) headers.set(CSRF_HEADER, CSRF_TOKEN);
  } else {
    vi.mocked(readSession).mockResolvedValue(null);
  }
  if (body !== undefined) headers.set("content-type", "application/json");
  return handler(
    new NextRequest(`http://localhost:3000${url}`, {
      method,
      headers,
      ...(body !== undefined && { body: JSON.stringify(body) }),
    }),
    ...rest,
  );
}
