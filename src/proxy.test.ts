import { NextRequest } from "next/server";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { SESSION_COOKIE } from "@/contracts/auth";
import { createSessionToken } from "@/domains/auth/session";
import { proxy } from "./proxy";

vi.mock("server-only", () => ({}));

beforeEach(() =>
  vi.stubEnv("SESSION_SECRET", "test-secret-with-at-least-32-characters"),
);
afterEach(() => vi.unstubAllEnvs());

async function request(pathname: string, role?: "ADMIN" | "CASHIER") {
  const headers = new Headers();
  if (role) {
    const token = await createSessionToken({
      id: "7f1d8c1e-0d2b-4a8e-9c3f-2b6a1e5d4c3b",
      username: role.toLowerCase(),
      role,
      csrf: "t",
    });
    headers.set("cookie", `${SESSION_COOKIE}=${token}`);
  }
  return proxy(
    new NextRequest(`http://localhost:3000${pathname}`, { headers }),
  );
}

it("blocks a CASHIER on ADMIN-only API routes and pages with 403", async () => {
  const api = await request("/api/admin/users", "CASHIER");
  expect(api.status).toBe(403);
  await expect(api.json()).resolves.toEqual({ error: "Acesso negado." });
  expect((await request("/admin", "CASHIER")).status).toBe(403);
});

it("lets an ADMIN through to ADMIN-only routes", async () => {
  const response = await request("/api/admin/users", "ADMIN");
  expect(response.headers.get("x-middleware-next")).toBe("1");
});

it("sends anonymous visitors to the login page and anonymous API calls a 401", async () => {
  const page = await request("/admin");
  expect(page.status).toBe(307);
  expect(page.headers.get("location")).toBe("http://localhost:3000/login");
  expect((await request("/api/admin/users")).status).toBe(401);
  expect((await request("/login")).headers.get("x-middleware-next")).toBe("1");
});
