import { expect, it, vi } from "vitest";
import { ServiceError } from "@/domains/auth/errors";
import { receivePayment } from "@/domains/customers/service";
import { callRoute, SESSION_USER } from "../../../../_lib/route-test-kit";
import { POST } from "./route";

vi.mock("server-only", () => ({}));
vi.mock("@/domains/customers/service", () => ({ receivePayment: vi.fn() }));
vi.mock("@/domains/auth/sessions", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/domains/auth/sessions")>()),
  readSession: vi.fn(),
}));

const customerId = "8c3f1f7a-3c1e-4a3b-9f0e-2f6a1d7c5b30";
const input = {
  id: "8c3f1f7a-3c1e-4a3b-9f0e-2f6a1d7c5b31",
  amount: 2000,
  notes: "Pix",
};
const pay = (body: unknown, role: "ADMIN" | "CASHIER" = "ADMIN") =>
  callRoute(
    POST,
    {
      url: `/api/admin/customers/${customerId}/payments`,
      method: "POST",
      role,
      body,
    },
    { params: Promise.resolve({ id: customerId }) },
  );

it("records an ADMIN's payment and answers the new debt", async () => {
  vi.mocked(receivePayment).mockResolvedValue({
    customer: {
      id: customerId,
      name: "Dona Maria",
      document: "",
      phone: "",
      creditLimit: 20000,
      currentDebt: 1000,
      active: true,
    },
    transaction: {
      ...input,
      type: "PAYMENT",
      saleNumber: null,
      userName: "Ana",
      createdAt: "2026-11-06T13:30:00.000Z",
    },
  });
  const response = await pay(input);
  expect(response.status).toBe(201);
  await expect(response.json()).resolves.toMatchObject({
    customer: { currentDebt: 1000 },
  });
  expect(receivePayment).toHaveBeenCalledWith(
    expect.objectContaining({ id: SESSION_USER.id }),
    customerId,
    input,
  );
});

it("refuses a CASHIER and amounts that are not whole positive cents", async () => {
  vi.mocked(receivePayment).mockReset();
  expect((await pay(input, "CASHIER")).status).toBe(403);
  for (const amount of [0, -100, 10.5])
    expect((await pay({ ...input, amount })).status, String(amount)).toBe(422);
  expect((await pay({ ...input, id: "x" })).status).toBe(422);
  expect(receivePayment).not.toHaveBeenCalled();
});

it("passes the refusal of a payment above the debt on with its field", async () => {
  vi.mocked(receivePayment).mockRejectedValue(
    new ServiceError(422, "O valor passa do saldo devedor de R$ 10,00.", {
      fields: { amount: "O valor passa do saldo devedor de R$ 10,00." },
    }),
  );
  const response = await pay(input);
  expect(response.status).toBe(422);
  await expect(response.json()).resolves.toMatchObject({
    fields: { amount: expect.any(String) },
  });
});
