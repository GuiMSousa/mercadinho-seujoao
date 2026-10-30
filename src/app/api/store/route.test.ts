import { expect, it, vi } from "vitest";
import { storeResponseSchema } from "@/contracts/store";
import { ServiceError } from "@/domains/auth/errors";
import { getStore, updateStore } from "@/domains/store/service";
import { callRoute, SESSION_USER } from "../_lib/route-test-kit";
import { GET, PATCH } from "./route";

vi.mock("server-only", () => ({}));
vi.mock("@/domains/store/service", () => ({
  getStore: vi.fn(),
  updateStore: vi.fn(),
}));
vi.mock("@/domains/auth/sessions", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/domains/auth/sessions")>()),
  readSession: vi.fn(),
}));

const store = {
  name: "Mercado Novo",
  document: "12345678000195",
  phone: "",
  address: "",
  sessionIdle: "8h" as const,
};
const valid = { ...store, document: "12.345.678/0001-95" };
const get = (role?: "ADMIN" | "CASHIER") =>
  callRoute(GET, { url: "/api/store", role });
const patch = (
  role?: "ADMIN" | "CASHIER",
  body: unknown = valid,
  csrf = true,
) => callRoute(PATCH, { url: "/api/store", method: "PATCH", role, body, csrf });

it("refuses anonymous with 401 and CASHIER with 403 on GET and PATCH", async () => {
  expect((await get()).status).toBe(401);
  expect((await get("CASHIER")).status).toBe(403);
  expect((await patch()).status).toBe(401);
  expect((await patch("CASHIER")).status).toBe(403);
  expect(getStore).not.toHaveBeenCalled();
  expect(updateStore).not.toHaveBeenCalled();
});

it("rejects PATCH without the CSRF token", async () => {
  expect((await patch("ADMIN", valid, false)).status).toBe(403);
  expect(updateStore).not.toHaveBeenCalled();
});

it("returns the store to an ADMIN", async () => {
  vi.mocked(getStore).mockResolvedValue(store);
  const response = await get("ADMIN");
  expect(response.status).toBe(200);
  expect(storeResponseSchema.parse(await response.json()).name).toBe(
    "Mercado Novo",
  );
});

it("answers 404 when there is no store yet", async () => {
  vi.mocked(getStore).mockResolvedValue(undefined);
  expect((await get("ADMIN")).status).toBe(404);
});

it("updates the store with the document reduced to digits", async () => {
  vi.mocked(updateStore).mockResolvedValue(store);
  const response = await patch("ADMIN");
  expect(response.status).toBe(200);
  expect(updateStore).toHaveBeenCalledWith(
    expect.objectContaining({ id: SESSION_USER.id }),
    store,
  );
});

it("accepts a partial update with only sessionIdle", async () => {
  vi.mocked(updateStore).mockResolvedValue({ ...store, sessionIdle: "never" });
  const response = await patch("ADMIN", { sessionIdle: "never" });
  expect(response.status).toBe(200);
  expect(updateStore).toHaveBeenCalledWith(expect.anything(), {
    sessionIdle: "never",
  });
});

it("rejects an empty update", async () => {
  expect((await patch("ADMIN", {})).status).toBe(422);
  expect(updateStore).not.toHaveBeenCalled();
});

it("answers 422 with field messages for invalid data", async () => {
  const response = await patch("ADMIN", {
    ...valid,
    name: " ",
    document: "123",
    sessionIdle: "2h",
  });
  expect(response.status).toBe(422);
  await expect(response.json()).resolves.toMatchObject({
    fields: {
      name: "Informe o nome da loja.",
      document: "CNPJ ou CPF incompleto.",
      sessionIdle: expect.any(String),
    },
  });
  expect(updateStore).not.toHaveBeenCalled();
});

it("maps a service refusal to its status", async () => {
  vi.mocked(updateStore).mockRejectedValueOnce(
    new ServiceError(404, "Loja não encontrada."),
  );
  expect((await patch("ADMIN")).status).toBe(404);
});
