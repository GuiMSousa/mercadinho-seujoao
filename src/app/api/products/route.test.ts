import { expect, it, vi } from "vitest";
import { findProductForSale } from "@/domains/inventory/service";
import { callRoute, SESSION_USER } from "../_lib/route-test-kit";
import { GET } from "./route";

vi.mock("server-only", () => ({}));
vi.mock("@/domains/inventory/service", () => ({ findProductForSale: vi.fn() }));
vi.mock("@/domains/auth/sessions", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/domains/auth/sessions")>()),
  readSession: vi.fn(),
}));

const url = "/api/products?barcode=789";
const forSale = {
  id: SESSION_USER.id,
  barcode: "789",
  name: "Café",
  sellPrice: 1849,
  unit: "UN" as const,
  stock: 3,
  expired: false,
};

it("requires a session", async () => {
  expect((await callRoute(GET, { url })).status).toBe(401);
  expect(findProductForSale).not.toHaveBeenCalled();
});

it("never answers a CASHIER with cost, even if the service returned it", async () => {
  vi.mocked(findProductForSale).mockResolvedValue({
    ...forSale,
    costPrice: 1290,
  } as never);
  const response = await callRoute(GET, { url, role: "CASHIER" });
  expect(response.status).toBe(200);
  await expect(response.json()).resolves.toEqual(forSale);
  expect(findProductForSale).toHaveBeenCalledWith("789");
});

it("refuses a request without a barcode", async () => {
  const response = await callRoute(GET, {
    url: "/api/products",
    role: "CASHIER",
  });
  expect(response.status).toBe(400);
});

it("refuses a NUL byte, which PostgreSQL could not compare", async () => {
  const response = await callRoute(GET, {
    url: "/api/products?barcode=%00",
    role: "CASHIER",
  });
  expect(response.status).toBe(400);
  expect(findProductForSale).not.toHaveBeenCalled();
});
