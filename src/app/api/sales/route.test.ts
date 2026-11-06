import { expect, it, vi } from "vitest";
import { ServiceError } from "@/domains/auth/errors";
import { registerSale } from "@/domains/sales/service";
import { callRoute, SESSION_USER } from "../_lib/route-test-kit";
import { POST } from "./route";

vi.mock("server-only", () => ({}));
vi.mock("@/domains/sales/service", () => ({ registerSale: vi.fn() }));
vi.mock("@/domains/auth/sessions", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/domains/auth/sessions")>()),
  readSession: vi.fn(),
}));

const productId = "8c3f1f7a-3c1e-4a3b-9f0e-2f6a1d7c5b01";
const input = {
  id: "8c3f1f7a-3c1e-4a3b-9f0e-2f6a1d7c5b09",
  items: [{ productId, quantity: 2, discount: 0 }],
  discount: 0,
  total: 3698,
  payments: [{ method: "CASH", amount: 5000 }],
};
const customerId = "8c3f1f7a-3c1e-4a3b-9f0e-2f6a1d7c5b05";
const receipt = {
  id: input.id,
  number: 7,
  createdAt: "2026-11-05T19:20:00.000Z",
  discount: 0,
  total: 3698,
  amountReceived: 5000,
  change: 1302,
  payments: [{ method: "CASH" as const, amount: 3698 }],
  customerName: null,
  items: [
    {
      productId,
      name: "Café",
      unit: "UN" as const,
      quantity: 2,
      unitPrice: 1849,
      discount: 0,
      total: 3698,
    },
  ],
};
const post = (body: unknown = input, role?: "ADMIN" | "CASHIER", csrf = true) =>
  callRoute(POST, { url: "/api/sales", method: "POST", role, body, csrf });

it("records a CASHIER's sale in their name and never answers with cost", async () => {
  vi.mocked(registerSale).mockResolvedValue({
    ...receipt,
    userId: SESSION_USER.id,
    items: [{ ...receipt.items[0], cost: 2580, unitCost: 1290 }],
  } as never);
  const response = await post(input, "CASHIER");
  expect(response.status).toBe(201);
  await expect(response.json()).resolves.toEqual(receipt);
  expect(registerSale).toHaveBeenCalledWith(
    expect.objectContaining({ id: SESSION_USER.id, role: "CASHIER" }),
    input,
  );
});

it("requires a session and the anti-CSRF header", async () => {
  expect((await post(input)).status).toBe(401);
  expect((await post(input, "CASHIER", false)).status).toBe(403);
  expect(registerSale).not.toHaveBeenCalled();
});

it("refuses a sale the schema does not accept", async () => {
  const invalid = [
    { items: [] },
    { items: [{ productId, quantity: 0 }] },
    { items: [{ productId, quantity: 1.5 }] },
    // The same product twice would be priced and taken twice.
    {
      items: [
        { productId, quantity: 1 },
        { productId, quantity: 1 },
      ],
    },
    { payments: [{ method: "CHEQUE", amount: 3698 }] },
    { payments: [{ method: "PIX", amount: 0 }] },
    // One line per method: the amounts are summed on the screen.
    {
      payments: [
        { method: "PIX", amount: 1000 },
        { method: "PIX", amount: 2698 },
      ],
    },
    // Fiado names its customer, and only fiado does.
    { payments: [{ method: "ON_ACCOUNT", amount: 3698 }] },
    { customerId },
    { discount: -1 },
    { id: "not-a-uuid" },
    { total: -1 },
  ];
  for (const change of invalid) {
    const response = await post({ ...input, ...change }, "CASHIER");
    expect(response.status, JSON.stringify(change)).toBe(422);
  }
  expect(registerSale).not.toHaveBeenCalled();
});

it("takes a sale split among methods, with fiado for a customer", async () => {
  vi.mocked(registerSale).mockResolvedValue({
    ...receipt,
    payments: [
      { method: "CASH", amount: 2000 },
      { method: "ON_ACCOUNT", amount: 1698 },
    ],
    customerName: "Dona Maria",
  } as never);
  const split = {
    ...input,
    payments: [
      { method: "CASH", amount: 2000 },
      { method: "ON_ACCOUNT", amount: 1698 },
    ],
    customerId,
  };
  expect((await post(split, "CASHIER")).status).toBe(201);
  expect(registerSale).toHaveBeenLastCalledWith(expect.anything(), split);
});

it("passes the service's refusal on with its fields", async () => {
  vi.mocked(registerSale).mockRejectedValue(
    new ServiceError(409, "Um preço mudou.", {
      fields: { total: "Um preço mudou." },
    }),
  );
  const response = await post(input, "ADMIN");
  expect(response.status).toBe(409);
  await expect(response.json()).resolves.toEqual({
    error: "Um preço mudou.",
    fields: { total: "Um preço mudou." },
  });
});
