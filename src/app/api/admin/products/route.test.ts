import { expect, it, vi } from "vitest";
import { ServiceError } from "@/domains/auth/errors";
import { createProduct, listProducts } from "@/domains/inventory/service";
import { callRoute, SESSION_USER } from "../../_lib/route-test-kit";
import { GET, POST } from "./route";

vi.mock("server-only", () => ({}));
vi.mock("@/domains/inventory/service", () => ({
  listProducts: vi.fn(),
  createProduct: vi.fn(),
}));
vi.mock("@/domains/auth/sessions", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/domains/auth/sessions")>()),
  readSession: vi.fn(),
}));

const url = "/api/admin/products";
const input = {
  barcode: " 7890000123457 ",
  name: "Café torrado 500 g",
  categoryId: SESSION_USER.id,
  costPrice: 1290,
  sellPrice: 1849,
  unit: "UN",
};
const row = {
  ...input,
  id: SESSION_USER.id,
  barcode: "7890000123457",
  minStock: 0,
  active: true,
  stock: 0,
  hasBatches: false,
};
const post = (role: "ADMIN" | "CASHIER" = "ADMIN", body: unknown = input) =>
  callRoute(POST, { url, method: "POST", role, body });

it("refuses without a session and for a CASHIER", async () => {
  expect((await callRoute(GET, { url })).status).toBe(401);
  expect((await callRoute(GET, { url, role: "CASHIER" })).status).toBe(403);
  expect((await post("CASHIER")).status).toBe(403);
  expect(listProducts).not.toHaveBeenCalled();
});

it("lists a page of products to an ADMIN, cost included", async () => {
  const page = { products: [row], total: 21, page: 2, pageSize: 20 };
  vi.mocked(listProducts).mockResolvedValue(page as never);
  const response = await callRoute(GET, {
    url: `${url}?search=caf%C3%A9&page=2`,
    role: "ADMIN",
  });
  expect(response.status).toBe(200);
  await expect(response.json()).resolves.toEqual(page);
  expect(listProducts).toHaveBeenCalledWith({ search: "café", page: 2 });
});

it("refuses a bad page", async () => {
  const response = await callRoute(GET, {
    url: `${url}?page=abc`,
    role: "ADMIN",
  });
  expect(response.status).toBe(400);
  expect(listProducts).not.toHaveBeenCalled();
});

it("creates a product with the defaults and trimmed values", async () => {
  vi.mocked(createProduct).mockResolvedValue(row as never);
  const response = await post();
  expect(response.status).toBe(201);
  expect(vi.mocked(createProduct).mock.calls[0][1]).toEqual({
    ...input,
    barcode: "7890000123457",
    minStock: 0,
    active: true,
  });
});

it("refuses prices that are not integer cents, and an unknown unit", async () => {
  for (const change of [
    { costPrice: 12.9 },
    { sellPrice: -1 },
    { sellPrice: 2_147_483_648 },
    { unit: "CX" },
  ]) {
    expect((await post("ADMIN", { ...input, ...change })).status).toBe(422);
  }
  expect(createProduct).not.toHaveBeenCalled();
});

it("answers a repeated barcode with the field error", async () => {
  vi.mocked(createProduct).mockRejectedValue(
    new ServiceError(409, "Repetido.", { fields: { barcode: "Repetido." } }),
  );
  const response = await post();
  expect(response.status).toBe(409);
  await expect(response.json()).resolves.toMatchObject({
    fields: { barcode: "Repetido." },
  });
});
