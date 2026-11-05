import { expect, it, vi } from "vitest";
import { searchProductsForSale } from "@/domains/inventory/service";
import { callRoute, SESSION_USER } from "../../_lib/route-test-kit";
import { GET } from "./route";

vi.mock("server-only", () => ({}));
vi.mock("@/domains/inventory/service", () => ({
  searchProductsForSale: vi.fn(),
}));
vi.mock("@/domains/auth/sessions", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/domains/auth/sessions")>()),
  readSession: vi.fn(),
}));

const found = {
  id: SESSION_USER.id,
  barcode: "789",
  name: "Café",
  sellPrice: 1849,
  unit: "UN" as const,
  stock: 3,
  expired: false,
};

it("requires a session", async () => {
  const response = await callRoute(GET, { url: "/api/products/search?q=caf" });
  expect(response.status).toBe(401);
  expect(searchProductsForSale).not.toHaveBeenCalled();
});

it("answers a CASHIER without cost, even if the service returned it", async () => {
  vi.mocked(searchProductsForSale).mockResolvedValue([
    { ...found, costPrice: 1290 } as never,
  ]);
  const response = await callRoute(GET, {
    url: "/api/products/search?q=%20caf%20",
    role: "CASHIER",
  });
  expect(response.status).toBe(200);
  await expect(response.json()).resolves.toEqual({ products: [found] });
  expect(searchProductsForSale).toHaveBeenCalledWith("caf");
});

it("refuses a missing, one-letter or NUL search", async () => {
  for (const query of ["", "?q=c", "?q=%00%00"]) {
    const response = await callRoute(GET, {
      url: `/api/products/search${query}`,
      role: "CASHIER",
    });
    expect(response.status).toBe(400);
  }
  expect(searchProductsForSale).not.toHaveBeenCalled();
});
