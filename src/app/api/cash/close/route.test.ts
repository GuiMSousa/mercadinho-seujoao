import { expect, it, vi } from "vitest";
import { closeCashSession } from "@/domains/cash/service";
import { callRoute, SESSION_USER } from "../../_lib/route-test-kit";
import { POST } from "./route";

vi.mock("server-only", () => ({}));
vi.mock("@/domains/cash/service", () => ({ closeCashSession: vi.fn() }));
vi.mock("@/domains/auth/sessions", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/domains/auth/sessions")>()),
  readSession: vi.fn(),
}));

const input = {
  sessionId: "8c3f1f7a-3c1e-4a3b-9f0e-2f6a1d7c5b11",
  actualAmount: 13000,
};
const post = (body: unknown, role?: "ADMIN" | "CASHIER", csrf = true) =>
  callRoute(POST, { url: "/api/cash/close", method: "POST", role, body, csrf });

it("closes blind: never answers the expected amount or the difference", async () => {
  const closed = {
    id: input.sessionId,
    closedAt: "2026-11-05T22:00:00.000Z",
    actualAmount: 13000,
  };
  vi.mocked(closeCashSession).mockResolvedValue({
    ...closed,
    expectedAmount: 13072,
    difference: -72,
  } as never);
  const response = await post(input, "CASHIER");
  expect(response.status).toBe(200);
  await expect(response.json()).resolves.toEqual(closed);
  expect(closeCashSession).toHaveBeenCalledWith(
    expect.objectContaining({ id: SESSION_USER.id }),
    input,
  );
});

it("requires a session, the anti-CSRF header and a valid count", async () => {
  expect((await post(input)).status).toBe(401);
  expect((await post(input, "CASHIER", false)).status).toBe(403);
  for (const change of [
    { actualAmount: -1 },
    { actualAmount: undefined },
    { sessionId: "x" },
    { notes: "a".repeat(501) },
  ])
    expect((await post({ ...input, ...change }, "CASHIER")).status).toBe(422);
  expect(closeCashSession).not.toHaveBeenCalled();
});
