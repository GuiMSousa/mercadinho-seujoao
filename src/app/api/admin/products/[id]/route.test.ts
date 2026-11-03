import { expect, it, vi } from "vitest";
import { receiveBatch, updateProduct } from "@/domains/inventory/service";
import { callRoute, SESSION_USER } from "../../../_lib/route-test-kit";
import { POST } from "./batches/route";
import { PATCH } from "./route";

vi.mock("server-only", () => ({}));
vi.mock("@/domains/inventory/service", () => ({
  updateProduct: vi.fn(),
  receiveBatch: vi.fn(),
}));
vi.mock("@/domains/auth/sessions", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/domains/auth/sessions")>()),
  readSession: vi.fn(),
}));

const id = SESSION_USER.id;
const url = `/api/admin/products/${id}`;
const context = (value = id) => ({ params: Promise.resolve({ id: value }) });
const patch = (
  body: unknown,
  value = id,
  role: "ADMIN" | "CASHIER" = "ADMIN",
) => callRoute(PATCH, { url, method: "PATCH", role, body }, context(value));
const receive = (body: unknown, value = id) =>
  callRoute(
    POST,
    { url: `${url}/batches`, method: "POST", role: "ADMIN", body },
    context(value),
  );

const product = {
  id,
  barcode: "789",
  name: "Café",
  categoryId: id,
  costPrice: 1290,
  sellPrice: 1999,
  minStock: 6,
  unit: "UN",
  active: true,
  stock: 3,
  hasBatches: true,
};

it("changes only the fields sent, and never resets the defaults", async () => {
  vi.mocked(updateProduct).mockResolvedValue(product as never);
  const response = await patch({ sellPrice: 1999 });
  expect(response.status).toBe(200);
  expect(vi.mocked(updateProduct).mock.calls[0][2]).toEqual({
    sellPrice: 1999,
  });
});

it("refuses an empty change, a malformed id and a CASHIER", async () => {
  expect((await patch({})).status).toBe(422);
  expect((await patch({ name: "Novo" }, "nope")).status).toBe(404);
  expect((await patch({ name: "Novo" }, id, "CASHIER")).status).toBe(403);
  expect(updateProduct).not.toHaveBeenCalled();
});

it("receives a batch in the name of the session user", async () => {
  const batch = {
    id,
    batchCode: "L-1",
    expirationDate: "2026-12-01",
    quantity: 8,
  };
  vi.mocked(receiveBatch).mockResolvedValue({
    ...batch,
    id,
    productId: id,
  });
  const response = await receive(batch);
  expect(response.status).toBe(201);
  expect(receiveBatch).toHaveBeenCalledWith(SESSION_USER.id, id, batch);
});

it("refuses a bad batch before reaching the service", async () => {
  const good = {
    id,
    batchCode: "L-1",
    expirationDate: "2026-12-01",
    quantity: 8,
  };
  for (const change of [
    { expirationDate: "01/12/2026" },
    { expirationDate: "2026-02-30" },
    // Typing 03/11/26 in a date input sends the year 0026.
    { expirationDate: "0026-11-03" },
    { expirationDate: "0000-01-01" },
    { batchCode: "L\u00001" },
    { quantity: 0 },
    { quantity: 1.5 },
    { quantity: 2_147_483_648 },
    { id: "nope" },
    { batchCode: "  " },
  ]) {
    expect((await receive({ ...good, ...change })).status).toBe(422);
  }
  // Undefined is dropped from the JSON body, as if the client had left the date out.
  expect((await receive({ ...good, expirationDate: undefined })).status).toBe(
    422,
  );
  expect((await receive(good, "nope")).status).toBe(404);
  expect(receiveBatch).not.toHaveBeenCalled();
});

it("accepts a batch of an item that does not expire", async () => {
  const batch = { id, batchCode: "L-2", expirationDate: null, quantity: 3 };
  vi.mocked(receiveBatch).mockResolvedValue({ ...batch, id, productId: id });
  expect((await receive(batch)).status).toBe(201);
});

it("accepts a batch without a client id", async () => {
  const batch = {
    batchCode: "L-3",
    expirationDate: "2026-12-01",
    quantity: 3,
  };
  vi.mocked(receiveBatch).mockResolvedValue({ ...batch, id, productId: id });
  expect((await receive(batch)).status).toBe(201);
});
