import { NextRequest } from "next/server";
import { expect, it, vi } from "vitest";
import { ServiceError } from "@/domains/auth/errors";
import { confirmPasswordReset } from "@/domains/auth/password-reset";
import { POST } from "./route";

vi.mock("server-only", () => ({}));
vi.mock("@/domains/auth/password-reset", () => ({
  confirmPasswordReset: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("@/domains/auth/sessions", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/domains/auth/sessions")>()),
  readSession: vi.fn().mockResolvedValue(null),
}));

const valid = {
  email: " Ana@Loja.com ",
  code: "123456",
  password: "nova12345",
};
const post = (ip: string, body: unknown = valid) =>
  POST(
    new NextRequest("http://localhost:3000/api/auth/password-reset/confirm", {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": ip },
      body: JSON.stringify(body),
    }),
  );

it("changes the password and answers 204", async () => {
  const response = await post("198.51.100.1");
  expect(response.status).toBe(204);
  expect(confirmPasswordReset).toHaveBeenCalledWith(
    "ana@loja.com",
    "123456",
    "nova12345",
  );
});

it("answers 422 for a weak password or a malformed code, without calling the service", async () => {
  const response = await post("198.51.100.2", {
    ...valid,
    code: "1",
    password: "curta",
  });
  expect(response.status).toBe(422);
  await expect(response.json()).resolves.toMatchObject({
    fields: {
      code: "Digite os 6 números do código.",
      password: "Use 8 caracteres ou mais, com letras e números.",
    },
  });
  expect(confirmPasswordReset).not.toHaveBeenCalled();
});

it("reports an invalid code as 422 on the code field", async () => {
  vi.mocked(confirmPasswordReset).mockRejectedValueOnce(
    new ServiceError(422, "Código inválido ou expirado. Peça um novo código.", {
      fields: { code: "Código inválido ou expirado. Peça um novo código." },
    }),
  );
  const response = await post("198.51.100.3");
  expect(response.status).toBe(422);
  await expect(response.json()).resolves.toMatchObject({
    fields: { code: "Código inválido ou expirado. Peça um novo código." },
  });
});

it("refuses the 11th attempt from one IP", async () => {
  for (let i = 0; i < 10; i++)
    expect((await post("203.0.113.9")).status).toBe(204);
  expect((await post("203.0.113.9")).status).toBe(429);
});
