import { expect, it, vi } from "vitest";
import { userRowSchema, usersListResponseSchema } from "@/contracts/users";
import { ServiceError } from "@/domains/auth/errors";
import { inviteUser, listUsers } from "@/domains/users/service";
import { callRoute, SESSION_USER } from "../../_lib/route-test-kit";
import { GET, POST } from "./route";

vi.mock("server-only", () => ({}));
vi.mock("@/domains/users/service", () => ({
  listUsers: vi.fn(),
  inviteUser: vi.fn(),
}));
vi.mock("@/domains/auth/sessions", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/domains/auth/sessions")>()),
  readSession: vi.fn(),
}));

const row = {
  id: SESSION_USER.id,
  name: "Caio Caixa",
  email: "caio@loja.com",
  role: "CASHIER" as const,
  active: true,
  lastLoginAt: null,
  pending: true,
};
const invite = {
  name: "Caio Caixa",
  email: " Caio@Loja.com ",
  role: "CASHIER",
};
const get = (role?: "ADMIN" | "CASHIER") =>
  callRoute(GET, { url: "/api/admin/users", role });
const post = (
  role?: "ADMIN" | "CASHIER",
  body: unknown = invite,
  csrf = true,
) =>
  callRoute(POST, {
    url: "/api/admin/users",
    method: "POST",
    role,
    body,
    csrf,
  });

it("refuses anonymous with 401, CASHIER with 403 and POST without CSRF", async () => {
  expect((await get()).status).toBe(401);
  expect((await get("CASHIER")).status).toBe(403);
  expect((await post()).status).toBe(401);
  expect((await post("CASHIER")).status).toBe(403);
  expect((await post("ADMIN", invite, false)).status).toBe(403);
  expect(listUsers).not.toHaveBeenCalled();
  expect(inviteUser).not.toHaveBeenCalled();
});

it("returns the contract-valid user list to an ADMIN", async () => {
  vi.mocked(listUsers).mockResolvedValue([row]);
  const response = await get("ADMIN");
  expect(response.status).toBe(200);
  expect(
    usersListResponseSchema.parse(await response.json()).users[0]?.pending,
  ).toBe(true);
});

it("invites a user with the e-mail normalized and answers 201", async () => {
  vi.mocked(inviteUser).mockResolvedValue(row);
  const response = await post("ADMIN");
  expect(response.status).toBe(201);
  expect(userRowSchema.parse(await response.json()).email).toBe(
    "caio@loja.com",
  );
  expect(inviteUser).toHaveBeenCalledWith(
    expect.objectContaining({ id: SESSION_USER.id }),
    { name: "Caio Caixa", email: "caio@loja.com", role: "CASHIER" },
  );
});

it("answers 422 with field messages for an invalid invite", async () => {
  const response = await post("ADMIN", { name: "", email: "x", role: "BOSS" });
  expect(response.status).toBe(422);
  await expect(response.json()).resolves.toMatchObject({
    fields: {
      name: "Informe o nome.",
      email: "Informe um e-mail válido.",
      role: expect.any(String),
    },
  });
  expect(inviteUser).not.toHaveBeenCalled();
});

it("answers 409 on the e-mail field when the e-mail is taken", async () => {
  vi.mocked(inviteUser).mockRejectedValueOnce(
    new ServiceError(409, "Este e-mail já tem conta.", {
      fields: { email: "Este e-mail já tem conta." },
    }),
  );
  const response = await post("ADMIN");
  expect(response.status).toBe(409);
  await expect(response.json()).resolves.toMatchObject({
    fields: { email: "Este e-mail já tem conta." },
  });
});
