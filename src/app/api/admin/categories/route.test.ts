import { expect, it, vi } from "vitest";
import { createCategory, listCategories } from "@/domains/inventory/service";
import { callRoute, SESSION_USER } from "../../_lib/route-test-kit";
import { GET, POST } from "./route";

vi.mock("server-only", () => ({}));
vi.mock("@/domains/inventory/service", () => ({
  listCategories: vi.fn(),
  createCategory: vi.fn(),
}));
vi.mock("@/domains/auth/sessions", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/domains/auth/sessions")>()),
  readSession: vi.fn(),
}));

const url = "/api/admin/categories";
const row = { id: SESSION_USER.id, name: "Bebidas" };

it("lists categories to an ADMIN only", async () => {
  vi.mocked(listCategories).mockResolvedValue([row] as never);
  expect((await callRoute(GET, { url, role: "CASHIER" })).status).toBe(403);
  const response = await callRoute(GET, { url, role: "ADMIN" });
  await expect(response.json()).resolves.toEqual({ categories: [row] });
});

it("creates a category and refuses a blank name", async () => {
  vi.mocked(createCategory).mockResolvedValue(row);
  const post = (body: unknown) =>
    callRoute(POST, { url, method: "POST", role: "ADMIN", body });
  expect((await post({ name: "  " })).status).toBe(422);
  expect(createCategory).not.toHaveBeenCalled();
  expect((await post({ name: " Bebidas " })).status).toBe(201);
  expect(vi.mocked(createCategory).mock.calls[0][1]).toEqual({
    name: "Bebidas",
  });
});
