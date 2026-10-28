import { NextRequest } from "next/server";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import {
  CSRF_COOKIE,
  SESSION_COOKIE,
  errorResponseSchema,
  loginResponseSchema,
} from "@/contracts/auth";
import { authenticate } from "@/domains/auth/service";
import { POST } from "./route";

vi.mock("server-only", () => ({}));
vi.mock("@/domains/auth/service", () => ({ authenticate: vi.fn() }));

beforeEach(() =>
  vi.stubEnv("SESSION_SECRET", "test-secret-with-at-least-32-characters"),
);
afterEach(() => vi.unstubAllEnvs());

// Each test uses its own IP because the limiter keeps state for the whole process.
function login(
  ip: string,
  body: unknown = { username: "Maria", password: "senha" },
  origin?: string,
) {
  const headers = new Headers({
    "content-type": "application/json",
    "x-forwarded-for": ip,
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
  expect((await login("203.0.113.11")).status).toBe(401);
});

it("opens a session with an HTTP-only JWT cookie and a contract-valid body", async () => {
  vi.mocked(authenticate).mockResolvedValue({
    id: "7f1d8c1e-0d2b-4a8e-9c3f-2b6a1e5d4c3b",
    username: "maria",
    role: "CASHIER",
  });
  const response = await login("198.51.100.1");
  expect(response.status).toBe(200);
  expect(authenticate).toHaveBeenCalledWith("maria", "senha");
  const body = loginResponseSchema.parse(await response.json());
  const session = response.cookies.get(SESSION_COOKIE);
  expect(session?.httpOnly).toBe(true);
  expect(session?.sameSite).toBe("lax");
  expect(session?.value.split(".")).toHaveLength(3);
  expect(response.cookies.get(CSRF_COOKIE)?.value).toBe(body.csrfToken);
});

it("rejects malformed bodies and cross-origin logins without checking credentials", async () => {
  expect((await login("198.51.100.2", { username: "" })).status).toBe(400);
  expect(
    (await login("198.51.100.3", undefined, "https://evil.example")).status,
  ).toBe(403);
  expect(authenticate).not.toHaveBeenCalled();
});
