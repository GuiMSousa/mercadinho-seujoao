import { expect, it, vi } from "vitest";
import { ServiceError } from "@/domains/auth/errors";
import { recordCashMovement } from "@/domains/cash/service";
import { callRoute, SESSION_USER } from "../../_lib/route-test-kit";
import { POST } from "./route";

vi.mock("server-only", () => ({}));
vi.mock("@/domains/cash/service", () => ({ recordCashMovement: vi.fn() }));
vi.mock("@/domains/auth/sessions", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/domains/auth/sessions")>()),
  readSession: vi.fn(),
}));

const input = {
  id: "8c3f1f7a-3c1e-4a3b-9f0e-2f6a1d7c5b10",
  type: "BLEED",
  amount: 2000,
  reason: "Depósito no banco",
};
const post = (body: unknown, role?: "ADMIN" | "CASHIER", csrf = true) =>
  callRoute(POST, {
    url: "/api/cash/movements",
    method: "POST",
    role,
    body,
    csrf,
  });

it("records a CASHIER's sangria with its reason", async () => {
  const row = { ...input, createdAt: "2026-11-05T15:00:00.000Z" };
  vi.mocked(recordCashMovement).mockResolvedValue(row as never);
  const response = await post(input, "CASHIER");
  expect(response.status).toBe(201);
  await expect(response.json()).resolves.toEqual(row);
  expect(recordCashMovement).toHaveBeenCalledWith(
    expect.objectContaining({ id: SESSION_USER.id }),
    input,
  );
});

it("requires a session, the anti-CSRF header, a reason and a positive amount", async () => {
  expect((await post(input)).status).toBe(401);
  expect((await post(input, "CASHIER", false)).status).toBe(403);
  for (const change of [
    { reason: "   " },
    { reason: undefined },
    { amount: 0 },
    { type: "WITHDRAW" },
    { id: "x" },
  ])
    expect((await post({ ...input, ...change }, "CASHIER")).status).toBe(422);
  expect(recordCashMovement).not.toHaveBeenCalled();
});

it("tells the screen when the cash is closed", async () => {
  vi.mocked(recordCashMovement).mockRejectedValue(
    new ServiceError(422, "Abra o caixa.", {
      fields: { cash: "Abra o caixa." },
    }),
  );
  const response = await post(input, "CASHIER");
  expect(response.status).toBe(422);
  await expect(response.json()).resolves.toMatchObject({
    fields: { cash: "Abra o caixa." },
  });
});
