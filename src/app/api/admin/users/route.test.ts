import { NextRequest } from "next/server";
import { expect, it, vi } from "vitest";
import { SESSION_COOKIE, usersListResponseSchema } from "@/contracts/auth";
import { listUsers } from "@/domains/auth/service";
import { readSession } from "@/domains/auth/sessions";
import { GET } from "./route";

vi.mock("server-only", () => ({}));
vi.mock("@/domains/auth/service", () => ({ listUsers: vi.fn() }));
vi.mock("@/domains/auth/sessions", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/domains/auth/sessions")>()),
  readSession: vi.fn(),
}));

const ID = "7f1d8c1e-0d2b-4a8e-9c3f-2b6a1e5d4c3b";

async function get(role?: "ADMIN" | "CASHIER") {
  const headers = new Headers();
  if (role) {
    vi.mocked(readSession).mockResolvedValue({
      id: "hashed-id",
      user: { id: ID, name: "U", email: "u@example.com", role },
      csrfHash: "hash",
      remember: false,
    });
    headers.set("cookie", `${SESSION_COOKIE}=token`);
  } else {
    vi.mocked(readSession).mockResolvedValue(null);
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
    { id: ID, name: "Dono", email: "dono@example.com", role: "ADMIN" },
  ]);
  const response = await get("ADMIN");
  expect(response.status).toBe(200);
  expect(
    usersListResponseSchema.parse(await response.json()).users,
  ).toHaveLength(1);
});
