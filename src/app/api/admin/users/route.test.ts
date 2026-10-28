import { NextRequest } from "next/server";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { SESSION_COOKIE, usersListResponseSchema } from "@/contracts/auth";
import { listUsers } from "@/domains/auth/service";
import { createSessionToken } from "@/domains/auth/session";
import { GET } from "./route";

vi.mock("server-only", () => ({}));
vi.mock("@/domains/auth/service", () => ({ listUsers: vi.fn() }));

const ID = "7f1d8c1e-0d2b-4a8e-9c3f-2b6a1e5d4c3b";

beforeEach(() =>
  vi.stubEnv("SESSION_SECRET", "test-secret-with-at-least-32-characters"),
);
afterEach(() => vi.unstubAllEnvs());

async function get(role?: "ADMIN" | "CASHIER") {
  const headers = new Headers();
  if (role) {
    const token = await createSessionToken({
      id: ID,
      username: "u",
      role,
      csrf: "t",
    });
    headers.set("cookie", `${SESSION_COOKIE}=${token}`);
  }
  return GET(
    new NextRequest("http://localhost:3000/api/admin/users", { headers }),
  );
}

it("refuses a CASHIER with 403 even if the proxy is bypassed", async () => {
  expect((await get("CASHIER")).status).toBe(403);
  expect((await get()).status).toBe(401);
  expect(listUsers).not.toHaveBeenCalled();
});

it("returns the contract-valid user list to an ADMIN", async () => {
  vi.mocked(listUsers).mockResolvedValue([
    { id: ID, username: "dono", role: "ADMIN" },
  ]);
  const response = await get("ADMIN");
  expect(response.status).toBe(200);
  expect(
    usersListResponseSchema.parse(await response.json()).users,
  ).toHaveLength(1);
});
