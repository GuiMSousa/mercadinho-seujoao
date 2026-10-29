import { expect, it, vi } from "vitest";
import { accountResponseSchema } from "@/contracts/account";
import { getAccount } from "@/domains/users/service";
import { callRoute, SESSION_USER } from "../_lib/route-test-kit";
import { GET } from "./route";

vi.mock("server-only", () => ({}));
vi.mock("@/domains/users/service", () => ({ getAccount: vi.fn() }));
vi.mock("@/domains/auth/sessions", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/domains/auth/sessions")>()),
  readSession: vi.fn(),
}));

const get = (role?: "ADMIN" | "CASHIER") =>
  callRoute(GET, { url: "/api/account", role });

it("refuses anonymous with 401 and CASHIER with 403", async () => {
  expect((await get()).status).toBe(401);
  expect((await get("CASHIER")).status).toBe(403);
  expect(getAccount).not.toHaveBeenCalled();
});

it("returns the current user and the store name to an ADMIN", async () => {
  vi.mocked(getAccount).mockResolvedValue({
    user: { ...SESSION_USER, role: "ADMIN" },
    store: { name: "Mercadinho do João" },
  });
  const response = await get("ADMIN");
  expect(response.status).toBe(200);
  expect(accountResponseSchema.parse(await response.json()).store.name).toBe(
    "Mercadinho do João",
  );
});
