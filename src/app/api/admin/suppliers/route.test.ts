import { expect, it, vi } from "vitest";
import { ServiceError } from "@/domains/auth/errors";
import { createSupplier, listSuppliers } from "@/domains/suppliers/service";
import { callRoute, SESSION_USER } from "../../_lib/route-test-kit";
import { GET, POST } from "./route";

vi.mock("server-only", () => ({}));
vi.mock("@/domains/suppliers/service", () => ({
  createSupplier: vi.fn(),
  listSuppliers: vi.fn(),
}));
vi.mock("@/domains/auth/sessions", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/domains/auth/sessions")>()),
  readSession: vi.fn(),
}));

const row = {
  id: SESSION_USER.id,
  name: "Distribuidora Sul",
  document: "11222333000181",
  phone: "11987654321",
  email: "",
  contactPerson: "Marcos",
  active: true,
};
const post = (body: unknown, role: "ADMIN" | "CASHIER" = "ADMIN") =>
  callRoute(POST, { url: "/api/admin/suppliers", method: "POST", role, body });

it("keeps suppliers from anyone but an ADMIN", async () => {
  const url = "/api/admin/suppliers";
  expect((await callRoute(GET, { url })).status).toBe(401);
  expect((await callRoute(GET, { url, role: "CASHIER" })).status).toBe(403);
  expect((await post({ name: "X" }, "CASHIER")).status).toBe(403);
  expect(listSuppliers).not.toHaveBeenCalled();
  expect(createSupplier).not.toHaveBeenCalled();
});

it("lists a page and creates with digits only and the defaults", async () => {
  vi.mocked(listSuppliers).mockResolvedValue({
    suppliers: [row],
    total: 1,
    page: 1,
    pageSize: 20,
  });
  const list = await callRoute(GET, {
    url: "/api/admin/suppliers?search=sul",
    role: "ADMIN",
  });
  expect(list.status).toBe(200);
  expect(listSuppliers).toHaveBeenCalledWith({ search: "sul", page: 1 });

  vi.mocked(createSupplier).mockResolvedValue(row);
  const response = await post({
    name: " Distribuidora Sul ",
    document: "11.222.333/0001-81",
    phone: "(11) 98765-4321",
  });
  expect(response.status).toBe(201);
  expect(vi.mocked(createSupplier).mock.calls[0][1]).toEqual({
    name: "Distribuidora Sul",
    document: "11222333000181",
    phone: "11987654321",
    email: "",
    contactPerson: "",
    active: true,
  });
});

it("refuses an incomplete document, a phone without DDD and a bad e-mail", async () => {
  for (const change of [
    { document: "123.456" },
    { phone: "98765-4321" },
    { email: "sem-arroba" },
    { name: " " },
  ]) {
    const response = await post({ name: "Sul", ...change });
    expect(response.status, JSON.stringify(change)).toBe(422);
  }
  expect(createSupplier).not.toHaveBeenCalled();
});

it("answers a repeated document with the field error", async () => {
  vi.mocked(createSupplier).mockRejectedValue(
    new ServiceError(409, "Já existe um fornecedor com esse CNPJ/CPF.", {
      fields: { document: "Já existe um fornecedor com esse CNPJ/CPF." },
    }),
  );
  const response = await post({ name: "Sul", document: "11222333000181" });
  expect(response.status).toBe(409);
  await expect(response.json()).resolves.toMatchObject({
    fields: { document: expect.any(String) },
  });
});
