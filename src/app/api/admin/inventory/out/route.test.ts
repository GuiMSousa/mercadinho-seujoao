import { expect, it, vi } from "vitest";
import { ServiceError } from "@/domains/auth/errors";
import { consumeStock } from "@/domains/inventory/service";
import { callRoute, SESSION_USER } from "../../../_lib/route-test-kit";
import { POST } from "./route";

vi.mock("server-only", () => ({}));
vi.mock("@/domains/inventory/service", () => ({ consumeStock: vi.fn() }));
vi.mock("@/domains/auth/sessions", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/domains/auth/sessions")>()),
  readSession: vi.fn(),
}));

const input = { productId: SESSION_USER.id, quantity: 3, reason: "Avaria" };
const post = (
  body: unknown = input,
  role: "ADMIN" | "CASHIER" = "ADMIN",
  csrf = true,
) =>
  callRoute(POST, {
    url: "/api/admin/inventory/out",
    method: "POST",
    role,
    body,
    csrf,
  });

it("takes stock out in the name of the session user", async () => {
  const allocations = [{ batchId: SESSION_USER.id, quantity: 3 }];
  vi.mocked(consumeStock).mockResolvedValue(allocations);
  const response = await post();
  expect(response.status).toBe(200);
  await expect(response.json()).resolves.toEqual({ allocations });
  expect(consumeStock).toHaveBeenCalledWith({
    ...input,
    userId: SESSION_USER.id,
  });
});

it("refuses a CASHIER, a missing CSRF token and invalid input", async () => {
  expect((await post(input, "CASHIER")).status).toBe(403);
  expect((await post(input, "ADMIN", false)).status).toBe(403);
  for (const change of [{ quantity: 0 }, { quantity: 1.5 }, { reason: " " }]) {
    expect((await post({ ...input, ...change })).status).toBe(422);
  }
  expect(consumeStock).not.toHaveBeenCalled();
});

it("answers insufficient stock with 409", async () => {
  vi.mocked(consumeStock).mockRejectedValue(
    new ServiceError(409, "Estoque insuficiente."),
  );
  const response = await post();
  expect(response.status).toBe(409);
  await expect(response.json()).resolves.toEqual({
    error: "Estoque insuficiente.",
  });
});
