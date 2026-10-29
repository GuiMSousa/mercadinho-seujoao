import { expect, it, vi } from "vitest";
import { userRowSchema } from "@/contracts/users";
import { ServiceError } from "@/domains/auth/errors";
import { updateUser } from "@/domains/users/service";
import { callRoute, SESSION_USER } from "../../../_lib/route-test-kit";
import { PATCH } from "./route";

vi.mock("server-only", () => ({}));
vi.mock("@/domains/users/service", () => ({ updateUser: vi.fn() }));
vi.mock("@/domains/auth/sessions", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/domains/auth/sessions")>()),
  readSession: vi.fn(),
}));

const ID = "0b7e1c52-6d5a-4f43-8a0e-3c1d9b2f7a10";
const row = {
  id: ID,
  name: "Caio Caixa",
  email: "caio@loja.com",
  role: "CASHIER" as const,
  active: false,
  lastLoginAt: "2026-01-01T00:00:00.000Z",
  pending: false,
};
const patch = (
  role?: "ADMIN" | "CASHIER",
  body: unknown = { active: false },
  csrf = true,
  id = ID,
) =>
  callRoute(
    PATCH,
    { url: `/api/admin/users/${id}`, method: "PATCH", role, body, csrf },
    { params: Promise.resolve({ id }) },
  );

it("refuses anonymous, CASHIER and a missing CSRF token", async () => {
  expect((await patch()).status).toBe(401);
  expect((await patch("CASHIER")).status).toBe(403);
  expect((await patch("ADMIN", undefined, false)).status).toBe(403);
  expect(updateUser).not.toHaveBeenCalled();
});

it("updates the user and returns the row", async () => {
  vi.mocked(updateUser).mockResolvedValue(row);
  const response = await patch("ADMIN");
  expect(response.status).toBe(200);
  expect(userRowSchema.parse(await response.json()).active).toBe(false);
  expect(updateUser).toHaveBeenCalledWith(
    expect.objectContaining({ id: SESSION_USER.id }),
    ID,
    { active: false },
  );
});

it("answers 422 for an empty change or an invalid role", async () => {
  expect((await patch("ADMIN", {})).status).toBe(422);
  const response = await patch("ADMIN", { role: "BOSS" });
  expect(response.status).toBe(422);
  await expect(response.json()).resolves.toMatchObject({
    fields: { role: expect.any(String) },
  });
  expect(updateUser).not.toHaveBeenCalled();
});

it("answers 404 for an id that is not a UUID, without touching the service", async () => {
  expect((await patch("ADMIN", { active: false }, true, "abc")).status).toBe(
    404,
  );
  expect(updateUser).not.toHaveBeenCalled();
});

it("maps the last-admin refusal to 409 with its message", async () => {
  vi.mocked(updateUser).mockRejectedValueOnce(
    new ServiceError(409, "Mantenha ao menos um administrador ativo."),
  );
  const response = await patch("ADMIN", { role: "CASHIER" });
  expect(response.status).toBe(409);
  await expect(response.json()).resolves.toEqual({
    error: "Mantenha ao menos um administrador ativo.",
  });
});
