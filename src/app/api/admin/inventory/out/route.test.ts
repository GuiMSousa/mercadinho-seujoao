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

it("passes the client id on, so a retry takes the stock once", async () => {
  vi.mocked(consumeStock).mockResolvedValue([]);
  const id = "8c3f1f7a-3c1e-4a3b-9f0e-2f6a1d7c5b40";
  expect((await post({ ...input, id })).status).toBe(200);
  expect(consumeStock).toHaveBeenCalledWith({
    ...input,
    id,
    userId: SESSION_USER.id,
  });
  expect((await post({ ...input, id: "x" })).status).toBe(422);
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
