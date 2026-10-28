import { NextRequest } from "next/server";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { CSRF_HEADER, SESSION_COOKIE } from "@/contracts/auth";
import { createSessionToken } from "@/domains/auth/session";
import { POST } from "./route";

vi.mock("server-only", () => ({}));

beforeEach(() =>
  vi.stubEnv("SESSION_SECRET", "test-secret-with-at-least-32-characters"),
);
afterEach(() => vi.unstubAllEnvs());

async function logout(csrfHeader?: string) {
  const token = await createSessionToken({
    id: "7f1d8c1e-0d2b-4a8e-9c3f-2b6a1e5d4c3b",
    username: "maria",
    role: "CASHIER",
    csrf: "expected-token",
  });
  const headers = new Headers({ cookie: `${SESSION_COOKIE}=${token}` });
  if (csrfHeader) headers.set(CSRF_HEADER, csrfHeader);
  return POST(
    new NextRequest("http://localhost:3000/api/auth/logout", {
      method: "POST",
      headers,
    }),
  );
}

it("refuses logout without the matching anti-CSRF header", async () => {
  expect((await logout()).status).toBe(403);
  expect((await logout("forged")).status).toBe(403);
});

it("clears the session cookies with the matching header", async () => {
  const response = await logout("expected-token");
  expect(response.status).toBe(204);
  expect(response.cookies.get(SESSION_COOKIE)?.value).toBe("");
});
