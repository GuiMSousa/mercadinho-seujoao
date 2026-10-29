import { NextRequest } from "next/server";
import { beforeEach, expect, it, vi } from "vitest";
import {
  CSRF_COOKIE,
  SESSION_COOKIE,
  errorResponseSchema,
  loginResponseSchema,
} from "@/contracts/auth";
import { authenticate } from "@/domains/auth/service";
import { createSession, readSession } from "@/domains/auth/sessions";
import { POST } from "./route";

vi.mock("server-only", () => ({}));
vi.mock("@/domains/auth/service", () => ({ authenticate: vi.fn() }));
vi.mock("@/domains/auth/sessions", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/domains/auth/sessions")>()),
  createSession: vi.fn(),
  readSession: vi.fn(),
}));

const USER = {
  id: "7f1d8c1e-0d2b-4a8e-9c3f-2b6a1e5d4c3b",
  name: "Maria",
  email: "maria@example.com",
  role: "CASHIER",
} as const;

beforeEach(() => {
  vi.mocked(readSession).mockResolvedValue(null);
  vi.mocked(createSession).mockResolvedValue({
    token: "opaque-session-token",
    csrfToken: "csrf-token",
    maxAgeSeconds: null,
  });
});

// Each test uses its own IP because the limiter keeps state for the whole process.
function login(
  ip: string,
  body: unknown = { email: " Maria@Example.com ", password: "senha" },
  origin?: string,
  extraHeaders: Record<string, string> = {},
) {
  const headers = new Headers({
    "content-type": "application/json",
    "x-forwarded-for": ip,
    ...extraHeaders,
  });
  if (origin) headers.set("origin", origin);
  return POST(
    new NextRequest("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    }),
  );
}

it("refuses the 11th login attempt from the same IP within 15 minutes with 429", async () => {
  vi.mocked(authenticate).mockResolvedValue(null);
  for (let attempt = 1; attempt <= 10; attempt++) {
    expect((await login("203.0.113.10")).status).toBe(401);
  }
  const blocked = await login("203.0.113.10");
  expect(blocked.status).toBe(429);
  expect(Number(blocked.headers.get("retry-after"))).toBeGreaterThan(0);
  errorResponseSchema.parse(await blocked.json());
  expect(authenticate).toHaveBeenCalledTimes(10);
  expect(createSession).not.toHaveBeenCalled();
  expect((await login("203.0.113.11")).status).toBe(401);
});

it("opens a database session with an HTTP-only opaque cookie and a contract-valid body", async () => {
  vi.mocked(authenticate).mockResolvedValue(USER);
  const response = await login("198.51.100.1", undefined, undefined, {
    "user-agent": "TestBrowser/1.0",
  });
  expect(response.status).toBe(200);
  expect(authenticate).toHaveBeenCalledWith("maria@example.com", "senha");
  expect(createSession).toHaveBeenCalledWith({
    userId: USER.id,
    remember: false,
    userAgent: "TestBrowser/1.0",
    ip: "198.51.100.1",
  });
  const body = loginResponseSchema.parse(await response.json());
  expect(body.csrfToken).toBe("csrf-token");
  const session = response.cookies.get(SESSION_COOKIE);
  expect(session?.value).toBe("opaque-session-token");
  expect(session?.httpOnly).toBe(true);
  expect(session?.sameSite).toBe("lax");
  // No maxAge: the cookie ends with the browser session unless "remember" is set.
  expect(session?.maxAge).toBeUndefined();
  expect(response.cookies.get(CSRF_COOKIE)?.value).toBe("csrf-token");
});

it("gives the cookies a max age when the session is remembered", async () => {
  vi.mocked(authenticate).mockResolvedValue(USER);
  vi.mocked(createSession).mockResolvedValue({
    token: "t",
    csrfToken: "c",
    maxAgeSeconds: 30 * 86_400,
  });
  const response = await login("198.51.100.6");
  for (const name of [SESSION_COOKIE, CSRF_COOKIE])
    expect(response.cookies.get(name)?.maxAge).toBe(30 * 86_400);
});

it("sets site-wide Lax cookies that are Secure only over HTTPS", async () => {
  vi.mocked(authenticate).mockResolvedValue(USER);
  // Plain HTTP (dev, LAN): a Secure cookie would be dropped and the next request would look anonymous.
  const http = await login("198.51.100.4");
  for (const name of [SESSION_COOKIE, CSRF_COOKIE]) {
    expect(http.cookies.get(name)).toMatchObject({
      path: "/",
      sameSite: "lax",
      secure: false,
    });
  }
  // Behind Cloudflare Tunnel the original scheme arrives in x-forwarded-proto.
  const tunnel = await login("198.51.100.5", undefined, undefined, {
    "x-forwarded-proto": "https",
  });
  expect(tunnel.cookies.get(SESSION_COOKIE)?.secure).toBe(true);
});

it("rejects malformed bodies and cross-origin logins without checking credentials", async () => {
  expect(
    (await login("198.51.100.2", { email: "not-an-email", password: "x" }))
      .status,
  ).toBe(400);
  expect(
    (await login("198.51.100.3", undefined, "https://evil.example")).status,
  ).toBe(403);
  expect(authenticate).not.toHaveBeenCalled();
  expect(createSession).not.toHaveBeenCalled();
});
