import { expect, it, vi } from "vitest";
import { listInventory } from "@/domains/inventory/service";
import { callRoute, SESSION_USER } from "../../_lib/route-test-kit";
import { GET } from "./route";

vi.mock("server-only", () => ({}));
vi.mock("@/domains/inventory/service", () => ({ listInventory: vi.fn() }));
vi.mock("@/domains/auth/sessions", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/domains/auth/sessions")>()),
  readSession: vi.fn(),
}));

const page = {
  products: [
    {
      id: SESSION_USER.id,
      barcode: "789",
      name: "Iogurte",
      unit: "UN" as const,
      minStock: 2,
      active: true,
      costPrice: 1290,
      stock: 5,
      signal: "red" as const,
      batches: [
        {
          id: SESSION_USER.id,
          batchCode: "L-1",
          expirationDate: "2026-11-05",
          quantity: 5,
          daysLeft: 2,
          signal: "red" as const,
        },
      ],
    },
  ],
  total: 1,
  page: 1,
  pageSize: 10,
};

it("refuses without a session and for a CASHIER", async () => {
  const url = "/api/admin/inventory";
  expect((await callRoute(GET, { url })).status).toBe(401);
  expect((await callRoute(GET, { url, role: "CASHIER" })).status).toBe(403);
  expect(listInventory).not.toHaveBeenCalled();
});

it("passes the search and page, and answers the page", async () => {
  vi.mocked(listInventory).mockResolvedValue(page as never);
  const response = await callRoute(GET, {
    url: "/api/admin/inventory?search=%20iog%20&page=2",
    role: "ADMIN",
  });
  expect(response.status).toBe(200);
  const body = (await response.json()) as typeof page;
  // The service row carries cost; this screen's contract leaves it out.
  expect(body.products[0]).not.toHaveProperty("costPrice");
  expect(body.products[0].batches).toEqual(page.products[0].batches);
  expect(listInventory).toHaveBeenCalledWith({ search: "iog", page: 2 });
});

it("defaults to the first page and refuses a bad one", async () => {
  vi.mocked(listInventory).mockResolvedValue(page as never);
  const url = "/api/admin/inventory";
  await callRoute(GET, { url, role: "ADMIN" });
  expect(listInventory).toHaveBeenCalledWith({ search: "", page: 1 });
  for (const bad of ["0", "-1", "1.5", "abc", "1&search=%00"]) {
    const response = await callRoute(GET, {
      url: `${url}?page=${bad}`,
      role: "ADMIN",
    });
    expect(response.status).toBe(400);
  }
});
