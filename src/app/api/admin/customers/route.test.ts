import { expect, it, vi } from "vitest";
import { createCustomer, listCustomers } from "@/domains/customers/service";
import { callRoute, SESSION_USER } from "../../_lib/route-test-kit";
import { GET, POST } from "./route";

vi.mock("server-only", () => ({}));
vi.mock("@/domains/customers/service", () => ({
  createCustomer: vi.fn(),
  listCustomers: vi.fn(),
}));
vi.mock("@/domains/auth/sessions", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/domains/auth/sessions")>()),
  readSession: vi.fn(),
}));

const row = {
  id: SESSION_USER.id,
  name: "Dona Maria",
  document: "52998224725",
  phone: "11987654321",
  creditLimit: 20000,
  currentDebt: 0,
  active: true,
};
const post = (body: unknown, role: "ADMIN" | "CASHIER" = "ADMIN") =>
  callRoute(POST, { url: "/api/admin/customers", method: "POST", role, body });

it("keeps the customer register from anyone but an ADMIN", async () => {
  const url = "/api/admin/customers";
  expect((await callRoute(GET, { url })).status).toBe(401);
  expect((await callRoute(GET, { url, role: "CASHIER" })).status).toBe(403);
  expect((await post({ name: "X" }, "CASHIER")).status).toBe(403);
  expect(listCustomers).not.toHaveBeenCalled();
  expect(createCustomer).not.toHaveBeenCalled();
});

it("lists a page and creates with digits only and the defaults", async () => {
  vi.mocked(listCustomers).mockResolvedValue({
    customers: [row],
    total: 1,
    page: 1,
    pageSize: 20,
  });
  const list = await callRoute(GET, {
    url: "/api/admin/customers?search=maria&page=2",
    role: "ADMIN",
  });
  expect(list.status).toBe(200);
  expect(listCustomers).toHaveBeenCalledWith({ search: "maria", page: 2 });

  vi.mocked(createCustomer).mockResolvedValue(row);
  const response = await post({
    name: " Dona Maria ",
    document: "529.982.247-25",
    phone: "(11) 98765-4321",
    creditLimit: 20000,
  });
  expect(response.status).toBe(201);
  expect(vi.mocked(createCustomer).mock.calls[0][1]).toEqual({
    name: "Dona Maria",
    document: "52998224725",
    phone: "11987654321",
    creditLimit: 20000,
    active: true,
  });
});

it("refuses a bad document, phone, negative or fractional limit and an empty name", async () => {
  for (const change of [
    { document: "123.456" },
    { phone: "98765-4321" },
    { creditLimit: -1 },
    { creditLimit: 10.5 },
    { name: " " },
  ]) {
    const response = await post({ name: "Maria", ...change });
    expect(response.status, JSON.stringify(change)).toBe(422);
  }
  expect(createCustomer).not.toHaveBeenCalled();
});
