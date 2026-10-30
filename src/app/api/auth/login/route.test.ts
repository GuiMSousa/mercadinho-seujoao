import { NextRequest } from "next/server";
import { beforeEach, expect, it, vi } from "vitest";
import {
  CSRF_COOKIE,
  SESSION_COOKIE,
  errorResponseSchema,
  loginResponseSchema,
} from "@/contracts/auth";
import { logActivity } from "@/domains/activity/service";
import { ServiceError } from "@/domains/auth/errors";
import { authenticate, recordLogin } from "@/domains/auth/service";
import {
  createSession,
  readSession,
  revokeSession,
} from "@/domains/auth/sessions";
import { POST } from "./route";

vi.mock("server-only", () => ({}));
vi.mock("@/domains/activity/service", () => ({ logActivity: vi.fn() }));
vi.mock("@/domains/auth/service", () => ({
  authenticate: vi.fn(),
  recordLogin: vi.fn(),
}));
vi.mock("@/domains/auth/sessions", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/domains/auth/sessions")>()),
  createSession: vi.fn(),
  readSession: vi.fn(),
  revokeSession: vi.fn(),
}));

const USER = {
  id: "7f1d8c1e-0d2b-4a8e-9c3f-2b6a1e5d4c3b",
  name: "Maria",
  email: "maria@example.com",
  role: "ADMIN",
} as const;
const granted = {
  ok: true,
  user: USER,
  passwordHash: "verified-hash",
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

// The account limiter is keyed by e-mail, so tests that count attempts use their own address.
const bodyFor = (email: string) => ({ email, password: "senha" });

it("refuses the 11th login attempt from the same IP within 15 minutes with 429", async () => {
  vi.mocked(authenticate).mockResolvedValue({ ok: false, reason: "invalid" });
  const body = bodyFor("per-ip@example.com");
  for (let attempt = 1; attempt <= 10; attempt++) {
    expect((await login("203.0.113.10", body)).status).toBe(401);
  }
  const blocked = await login("203.0.113.10", body);
  expect(blocked.status).toBe(429);
  expect(Number(blocked.headers.get("retry-after"))).toBeGreaterThan(0);
  errorResponseSchema.parse(await blocked.json());
  expect(authenticate).toHaveBeenCalledTimes(10);
  expect(createSession).not.toHaveBeenCalled();
  expect((await login("203.0.113.11", body)).status).toBe(401);
});

it("refuses the 21st attempt on one account even when every request comes from another IP", async () => {
  vi.mocked(authenticate).mockResolvedValue({ ok: false, reason: "invalid" });
  const body = bodyFor(" Victim@Example.com ");
  for (let attempt = 1; attempt <= 20; attempt++) {
    expect((await login(`198.51.100.${attempt}`, body)).status).toBe(401);
  }
  const blocked = await login("198.51.100.99", bodyFor("victim@example.com"));
  expect(blocked.status).toBe(429);
  expect(Number(blocked.headers.get("retry-after"))).toBeGreaterThan(0);
  await expect(blocked.json()).resolves.toEqual({
    error: "Muitas tentativas de login. Tente novamente mais tarde.",
  });
  expect(authenticate).toHaveBeenCalledTimes(20);
  expect(
    (await login("198.51.100.98", bodyFor("other@example.com"))).status,
  ).toBe(401);
});

it("normalizes the e-mail and opens a database session with an HTTP-only opaque cookie", async () => {
  vi.mocked(authenticate).mockResolvedValue(granted);
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
    passwordHash: "verified-hash",
  });
  const body = loginResponseSchema.parse(await response.json());
  expect(body).toEqual({ user: USER, csrfToken: "csrf-token" });
  const session = response.cookies.get(SESSION_COOKIE);
  expect(session?.value).toBe("opaque-session-token");
  expect(session?.httpOnly).toBe(true);
  expect(session?.sameSite).toBe("lax");
  // No Max-Age: the cookie ends with the browser session unless "remember" is set.
  expect(response.headers.get("set-cookie")).not.toMatch(/max-age/i);
  expect(response.cookies.get(CSRF_COOKIE)?.value).toBe("csrf-token");
  expect(recordLogin).toHaveBeenCalledWith(USER.id);
  expect(logActivity).toHaveBeenCalledWith({
    user: { id: USER.id, name: "Maria" },
    action: "Login",
  });
});

it("answers 401 and records no login when the credentials changed before the session was created", async () => {
  vi.mocked(authenticate).mockResolvedValue(granted);
  vi.mocked(createSession).mockRejectedValue(
    new ServiceError(401, "E-mail ou senha incorretos."),
  );
  const response = await login("198.51.100.1");
  expect(response.status).toBe(401);
  expect(await response.json()).toEqual({
    error: "E-mail ou senha incorretos.",
  });
  expect(response.cookies.get(SESSION_COOKIE)).toBeUndefined();
  expect(recordLogin).not.toHaveBeenCalled();
});

it("remembers the session for 30 days only when asked", async () => {
  vi.mocked(authenticate).mockResolvedValue(granted);
  vi.mocked(createSession).mockResolvedValue({
    token: "t",
    csrfToken: "c",
    maxAgeSeconds: 30 * 86_400,
  });
  const response = await login("198.51.100.6", {
    email: "maria@example.com",
    password: "senha",
    remember: true,
  });
  expect(createSession).toHaveBeenCalledWith(
    expect.objectContaining({ remember: true }),
  );
  for (const name of [SESSION_COOKIE, CSRF_COOKIE])
    expect(response.cookies.get(name)?.maxAge).toBe(2_592_000);
  expect(response.headers.get("set-cookie")).toContain("Max-Age=2592000");
});

it("replaces a session the request already carries", async () => {
  vi.mocked(authenticate).mockResolvedValue(granted);
  vi.mocked(readSession).mockResolvedValue({
    id: "old-session-id",
    user: USER,
    csrfHash: "hash",
    remember: false,
  });
  const response = await login("198.51.100.7", undefined, undefined, {
    cookie: `${SESSION_COOKIE}=old-token`,
  });
  expect(response.status).toBe(200);
  expect(revokeSession).toHaveBeenCalledWith("old-session-id");
  expect(createSession).toHaveBeenCalledOnce();
});

it("gives wrong credentials and password-less invitees the same 401", async () => {
  const messages: string[] = [];
  for (const [index, reason] of (
    ["invalid", "no_password"] as const
  ).entries()) {
    vi.mocked(authenticate).mockResolvedValue({ ok: false, reason });
    const response = await login(`198.51.100.${20 + index}`);
    expect(response.status).toBe(401);
    messages.push(errorResponseSchema.parse(await response.json()).error);
  }
  expect(messages).toEqual([
    "E-mail ou senha incorretos.",
    "E-mail ou senha incorretos.",
  ]);
  expect(createSession).not.toHaveBeenCalled();
  expect(logActivity).not.toHaveBeenCalled();
});

it("refuses CASHIER and inactive users with 403 and the exact messages", async () => {
  vi.mocked(authenticate).mockResolvedValue({ ok: false, reason: "not_admin" });
  const cashier = await login("198.51.100.30");
  expect(cashier.status).toBe(403);
  await expect(cashier.json()).resolves.toEqual({
    error:
      "Este painel é exclusivo para administradores. Operadores usam o PDV.",
  });

  vi.mocked(authenticate).mockResolvedValue({ ok: false, reason: "inactive" });
  const inactive = await login("198.51.100.31");
  expect(inactive.status).toBe(403);
  await expect(inactive.json()).resolves.toEqual({
    error: "Este acesso está desativado. Fale com o administrador da loja.",
  });
  expect(createSession).not.toHaveBeenCalled();
});

it("sets site-wide Lax cookies that are Secure only over HTTPS", async () => {
  vi.mocked(authenticate).mockResolvedValue(granted);
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
  const malformed = await login("198.51.100.2", {
    email: "not-an-email",
    password: "x",
  });
  expect(malformed.status).toBe(422);
  await expect(malformed.json()).resolves.toMatchObject({
    fields: { email: "Informe um e-mail válido." },
  });
  const noPassword = await login("198.51.100.4", { email: "a@b.com" });
  expect(noPassword.status).toBe(422);
  await expect(noPassword.json()).resolves.toMatchObject({
    fields: { password: "Informe sua senha." },
  });
  expect(
    (await login("198.51.100.3", undefined, "https://evil.example")).status,
  ).toBe(403);
  expect(authenticate).not.toHaveBeenCalled();
  expect(createSession).not.toHaveBeenCalled();
});
