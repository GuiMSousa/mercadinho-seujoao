import { expect, it, vi } from "vitest";
import { ServiceError } from "@/domains/auth/errors";
import { openCashSession } from "@/domains/cash/service";
import { callRoute, SESSION_USER } from "../../_lib/route-test-kit";
import { POST } from "./route";

vi.mock("server-only", () => ({}));
vi.mock("@/domains/cash/service", () => ({ openCashSession: vi.fn() }));
vi.mock("@/domains/auth/sessions", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/domains/auth/sessions")>()),
  readSession: vi.fn(),
}));

const post = (body: unknown, role?: "ADMIN" | "CASHIER", csrf = true) =>
  callRoute(POST, { url: "/api/cash/open", method: "POST", role, body, csrf });
const opened = {
  id: SESSION_USER.id,
  openedAt: "2026-11-05T11:00:00.000Z",
  openedBy: "Ana Souza",
  initialAmount: 10000,
};

it("opens the drawer for a CASHIER in their name", async () => {
  vi.mocked(openCashSession).mockResolvedValue(opened);
  const response = await post({ initialAmount: 10000 }, "CASHIER");
  expect(response.status).toBe(201);
  await expect(response.json()).resolves.toEqual(opened);
  expect(openCashSession).toHaveBeenCalledWith(
    expect.objectContaining({ id: SESSION_USER.id }),
    { initialAmount: 10000 },
  );
});

it("requires a session, the anti-CSRF header and whole non-negative cents", async () => {
  expect((await post({ initialAmount: 1 })).status).toBe(401);
  expect((await post({ initialAmount: 1 }, "CASHIER", false)).status).toBe(403);
  for (const initialAmount of [-1, 1.5, "100", undefined])
    expect((await post({ initialAmount }, "CASHIER")).status).toBe(422);
  expect(openCashSession).not.toHaveBeenCalled();
});

it("answers a second open drawer with 409", async () => {
  vi.mocked(openCashSession).mockRejectedValue(
    new ServiceError(409, "Já existe um caixa aberto."),
  );
  expect((await post({ initialAmount: 0 }, "ADMIN")).status).toBe(409);
});
