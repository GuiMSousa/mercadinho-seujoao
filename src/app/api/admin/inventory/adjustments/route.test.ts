import { expect, it, vi } from "vitest";
import { ServiceError } from "@/domains/auth/errors";
import { adjustStock } from "@/domains/inventory/service";
import { callRoute, SESSION_USER } from "../../../_lib/route-test-kit";
import { POST } from "./route";

vi.mock("server-only", () => ({}));
vi.mock("@/domains/inventory/service", () => ({ adjustStock: vi.fn() }));
vi.mock("@/domains/auth/sessions", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/domains/auth/sessions")>()),
  readSession: vi.fn(),
}));

const loss = {
  kind: "LOSS",
  productId: SESSION_USER.id,
  quantity: 2,
  reason: "Caiu da prateleira",
};
const gain = {
  kind: "GAIN",
  productId: SESSION_USER.id,
  quantity: 4,
  reason: "Contagem de sexta",
  batchCode: "INV-1",
  expirationDate: null,
};
const post = (
  body: unknown,
  role: "ADMIN" | "CASHIER" = "ADMIN",
  csrf = true,
) =>
  callRoute(POST, {
    url: "/api/admin/inventory/adjustments",
    method: "POST",
    role,
    body,
    csrf,
  });

it("adjusts in the name of the session user, for each kind", async () => {
  const allocations = [{ batchId: SESSION_USER.id, quantity: 2 }];
  vi.mocked(adjustStock).mockResolvedValue(allocations);
  for (const body of [loss, { ...loss, kind: "EXPIRED" }, gain]) {
    const response = await post(body);
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ allocations });
    expect(adjustStock).toHaveBeenLastCalledWith({
      ...body,
      userId: SESSION_USER.id,
    });
  }
});

it("refuses a CASHIER, a missing CSRF token and invalid input", async () => {
  expect((await post(loss, "CASHIER")).status).toBe(403);
  expect((await post(loss, "ADMIN", false)).status).toBe(403);
  for (const body of [
    { ...loss, kind: "THEFT" },
    { ...loss, reason: " " },
    { ...loss, quantity: 0 },
    { ...loss, quantity: 1.5 },
    { ...loss, id: "x" },
    // A count that found more needs its batch: code and date (or null).
    { ...gain, batchCode: "" },
    { ...gain, expirationDate: undefined },
    { ...gain, expirationDate: "0026-01-01" },
  ])
    expect((await post(body)).status).toBe(422);
  expect(adjustStock).not.toHaveBeenCalled();
});

it("answers a quantity above the balance with 409 on the field", async () => {
  const message = "Maior que o saldo vencido deste produto.";
  vi.mocked(adjustStock).mockRejectedValue(
    new ServiceError(409, message, { fields: { quantity: message } }),
  );
  const response = await post({ ...loss, kind: "EXPIRED" });
  expect(response.status).toBe(409);
  await expect(response.json()).resolves.toMatchObject({
    fields: { quantity: message },
  });
});
