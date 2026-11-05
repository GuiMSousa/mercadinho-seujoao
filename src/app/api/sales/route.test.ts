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
  items: [{ productId, quantity: 2 }],
  paymentMethod: "CASH",
  total: 3698,
  amountReceived: 5000,
};
const receipt = {
  id: input.id,
  number: 7,
  createdAt: "2026-11-05T19:20:00.000Z",
  paymentMethod: "CASH" as const,
  total: 3698,
  amountReceived: 5000,
  change: 1302,
  items: [
    {
      productId,
      name: "Café",
      unit: "UN" as const,
      quantity: 2,
      unitPrice: 1849,
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
    { paymentMethod: "CHEQUE" },
    { amountReceived: undefined },
    { id: "not-a-uuid" },
    { total: -1 },
  ];
  for (const change of invalid) {
    const response = await post({ ...input, ...change }, "CASHIER");
    expect(response.status, JSON.stringify(change)).toBe(422);
  }
  expect(registerSale).not.toHaveBeenCalled();
});

it("asks for the amount received only in cash", async () => {
  vi.mocked(registerSale).mockResolvedValue({
    ...receipt,
    paymentMethod: "PIX",
    amountReceived: 3698,
    change: 0,
  } as never);
  const pix = { ...input, paymentMethod: "PIX", amountReceived: undefined };
  expect((await post(pix, "CASHIER")).status).toBe(201);
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
