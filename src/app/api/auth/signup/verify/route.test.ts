import { NextRequest } from "next/server";
import { beforeEach, expect, it, vi } from "vitest";
import {
  CSRF_COOKIE,
  SESSION_COOKIE,
  SIGNUP_COOKIE,
  loginResponseSchema,
} from "@/contracts/auth";
import { ServiceError } from "@/domains/auth/errors";
import {
  createSession,
  readSession,
  revokeSession,
} from "@/domains/auth/sessions";
import { completeSignup } from "@/domains/auth/signup";
import { POST } from "./route";

vi.mock("server-only", () => ({}));
vi.mock("@/domains/auth/signup", () => ({ completeSignup: vi.fn() }));
vi.mock("@/domains/auth/sessions", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/domains/auth/sessions")>()),
  createSession: vi.fn(),
  readSession: vi.fn(),
  revokeSession: vi.fn(),
}));

const USER = {
  id: "7f1d8c1e-0d2b-4a8e-9c3f-2b6a1e5d4c3b",
  name: "Ana Souza",
  email: "ana@loja.com",
  role: "ADMIN",
} as const;

beforeEach(() => {
  vi.mocked(readSession).mockResolvedValue(null);
  vi.mocked(completeSignup).mockResolvedValue(USER);
  vi.mocked(createSession).mockResolvedValue({
    token: "opaque",
    csrfToken: "csrf",
    maxAgeSeconds: null,
  });
});

const post = (
  ip: string,
  body: unknown = { email: " Ana@Loja.com ", code: "123456" },
) =>
  POST(
    new NextRequest("http://localhost:3000/api/auth/signup/verify", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-forwarded-for": ip,
        "user-agent": "UA",
        cookie: `${SIGNUP_COOKIE}=nonce-1`,
      },
      body: JSON.stringify(body),
    }),
  );

it("creates the account, opens a session and returns the user with the CSRF token", async () => {
  const response = await post("198.51.100.1");
  expect(response.status).toBe(200);
  expect(completeSignup).toHaveBeenCalledWith(
    "ana@loja.com",
    "123456",
    "nonce-1",
  );
  expect(createSession).toHaveBeenCalledWith({
    userId: USER.id,
    remember: false,
    userAgent: "UA",
    ip: "198.51.100.1",
  });
  expect(loginResponseSchema.parse(await response.json())).toEqual({
    user: USER,
    csrfToken: "csrf",
  });
  expect(response.cookies.get(SESSION_COOKIE)).toMatchObject({
    value: "opaque",
    httpOnly: true,
  });
  expect(response.cookies.get(CSRF_COOKIE)?.value).toBe("csrf");
  // The signup is done: the browser drops its proof.
  expect(response.cookies.get(SIGNUP_COOKIE)).toMatchObject({
    value: "",
    maxAge: 0,
    path: "/api/auth/signup",
  });
});

it("replaces a session the request already carries", async () => {
  vi.mocked(readSession).mockResolvedValue({
    id: "old",
    user: USER,
    csrfHash: "h",
    remember: false,
  });
  await post("198.51.100.2");
  expect(revokeSession).toHaveBeenCalledWith("old");
});

it("validates the code format and reports wrong codes and an existing store", async () => {
  const malformed = await post("198.51.100.3", {
    email: "ana@loja.com",
    code: "12",
  });
  expect(malformed.status).toBe(422);
  await expect(malformed.json()).resolves.toMatchObject({
    fields: { code: "Digite os 6 números do código." },
  });
  expect(completeSignup).not.toHaveBeenCalled();

  vi.mocked(completeSignup).mockRejectedValueOnce(
    new ServiceError(422, "Código incorreto.", {
      fields: { code: "Código incorreto." },
    }),
  );
  expect((await post("198.51.100.3")).status).toBe(422);
  vi.mocked(completeSignup).mockRejectedValueOnce(
    new ServiceError(409, "A loja já foi criada. Entre com sua conta."),
  );
  expect((await post("198.51.100.3")).status).toBe(409);
  expect(createSession).not.toHaveBeenCalled();
});

it("refuses the 11th attempt from one IP", async () => {
  for (let i = 0; i < 10; i++)
    expect((await post("203.0.113.9")).status).toBe(200);
  expect((await post("203.0.113.9")).status).toBe(429);
});
