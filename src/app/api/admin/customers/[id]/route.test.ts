import { expect, it, vi } from "vitest";
import { ServiceError } from "@/domains/auth/errors";
import { getStatement, updateCustomer } from "@/domains/customers/service";
import { callRoute, SESSION_USER } from "../../../_lib/route-test-kit";
import { GET, PATCH } from "./route";

vi.mock("server-only", () => ({}));
vi.mock("@/domains/customers/service", () => ({
  getStatement: vi.fn(),
  updateCustomer: vi.fn(),
}));
vi.mock("@/domains/auth/sessions", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/domains/auth/sessions")>()),
  readSession: vi.fn(),
}));

const id = "8c3f1f7a-3c1e-4a3b-9f0e-2f6a1d7c5b30";
const customer = {
  id,
  name: "Dona Maria",
  document: "",
  phone: "",
  creditLimit: 20000,
  currentDebt: 3000,
  active: true,
};
const context = (customerId = id) => ({
  params: Promise.resolve({ id: customerId }),
});
const patch = (
  body: unknown,
  customerId = id,
  role: "ADMIN" | "CASHIER" = "ADMIN",
) =>
  callRoute(
    PATCH,
    { url: `/api/admin/customers/${customerId}`, method: "PATCH", role, body },
    context(customerId),
  );

it("answers the statement page to an ADMIN", async () => {
  vi.mocked(getStatement).mockResolvedValue({
    customer,
    transactions: [
      {
        id: SESSION_USER.id,
        type: "DEBIT",
        amount: 3000,
        saleNumber: 12,
        userName: "Carlos",
        notes: "",
        createdAt: "2026-11-06T13:30:00.000Z",
      },
    ],
    total: 1,
    page: 1,
    pageSize: 20,
  });
  const url = `/api/admin/customers/${id}?page=1`;
  const response = await callRoute(GET, { url, role: "ADMIN" }, context());
  expect(response.status).toBe(200);
  expect(getStatement).toHaveBeenCalledWith(id, 1);
  expect(
    (await callRoute(GET, { url, role: "CASHIER" }, context())).status,
  ).toBe(403);
});

it("changes the limit for an ADMIN, sending only what changed", async () => {
  vi.mocked(updateCustomer).mockResolvedValue({
    ...customer,
    creditLimit: 5000,
  });
  const response = await patch({ creditLimit: 5000 });
  expect(response.status).toBe(200);
  expect(updateCustomer).toHaveBeenCalledWith(
    expect.objectContaining({ id: SESSION_USER.id }),
    id,
    { creditLimit: 5000 },
  );
});

it("refuses a CASHIER, an empty change and a malformed id", async () => {
  vi.mocked(updateCustomer).mockReset();
  expect((await patch({ active: false }, id, "CASHIER")).status).toBe(403);
  expect((await patch({})).status).toBe(422);
  expect((await patch({ name: "Maria" }, "nao-e-uuid")).status).toBe(404);
  expect(updateCustomer).not.toHaveBeenCalled();
  vi.mocked(getStatement).mockRejectedValue(
    new ServiceError(404, "Cliente não encontrado."),
  );
  const missing = await callRoute(
    GET,
    { url: `/api/admin/customers/${id}`, role: "ADMIN" },
    context(),
  );
  expect(missing.status).toBe(404);
});
