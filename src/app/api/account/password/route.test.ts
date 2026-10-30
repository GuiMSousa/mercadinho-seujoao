import { expect, it, vi } from "vitest";
import { ServiceError } from "@/domains/auth/errors";
import { changePassword } from "@/domains/users/service";
import { callRoute, SESSION_ID } from "../../_lib/route-test-kit";
import { POST } from "./route";

vi.mock("server-only", () => ({}));
vi.mock("@/domains/users/service", () => ({ changePassword: vi.fn() }));
vi.mock("@/domains/auth/sessions", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/domains/auth/sessions")>()),
  readSession: vi.fn(),
}));

const valid = { current: "antiga1234", next: "nova123456" };
const post = (role?: "ADMIN" | "CASHIER", body: unknown = valid, csrf = true) =>
  callRoute(POST, {
    url: "/api/account/password",
    method: "POST",
    role,
    body,
    csrf,
  });

it("refuses anonymous, CASHIER and a missing CSRF token", async () => {
  expect((await post()).status).toBe(401);
  expect((await post("CASHIER")).status).toBe(403);
  expect((await post("ADMIN", valid, false)).status).toBe(403);
  expect(changePassword).not.toHaveBeenCalled();
});

it("changes the password for the current session and answers 204", async () => {
  const response = await post("ADMIN");
  expect(response.status).toBe(204);
  expect(changePassword).toHaveBeenCalledWith(
    expect.objectContaining({ id: SESSION_ID }),
    "antiga1234",
    "nova123456",
  );
});

it("answers 422 with field messages for a weak new password", async () => {
  const response = await post("ADMIN", {
    current: "antiga1234",
    next: "curta",
  });
  expect(response.status).toBe(422);
  await expect(response.json()).resolves.toMatchObject({
    fields: { next: "Use 8 caracteres ou mais, com letras e números." },
  });
  expect(changePassword).not.toHaveBeenCalled();
});

it("reports a wrong current password as 422 on the current field", async () => {
  vi.mocked(changePassword).mockRejectedValueOnce(
    new ServiceError(422, "Senha atual incorreta.", {
      fields: { current: "Senha atual incorreta." },
    }),
  );
  const response = await post("ADMIN");
  expect(response.status).toBe(422);
  await expect(response.json()).resolves.toEqual({
    error: "Senha atual incorreta.",
    fields: { current: "Senha atual incorreta." },
  });
});

it("refuses the 11th attempt of the same user within 15 minutes with 429, without checking the password", async () => {
  // Earlier tests in this file already spent part of this user's budget of 10 (the limiter is per process).
  const responses: Response[] = [];
  for (let i = 0; i < 12; i++) responses.push(await post("ADMIN"));
  const blocked = responses.findIndex((response) => response.status === 429);
  expect(blocked).toBeGreaterThan(0);
  expect(responses.slice(blocked).every((r) => r.status === 429)).toBe(true);
  expect(Number(responses[blocked].headers.get("retry-after"))).toBeGreaterThan(
    0,
  );
  await expect(responses[blocked].json()).resolves.toEqual({
    error: "Muitas tentativas. Tente novamente mais tarde.",
  });
  expect(changePassword).toHaveBeenCalledTimes(blocked);
});
