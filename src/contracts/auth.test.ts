import { expect, it } from "vitest";
import {
  emailSchema,
  loginRequestSchema,
  passwordResetConfirmSchema,
  signupRequestSchema,
  signupVerifySchema,
} from "./auth";

const signup = {
  name: "Ana Souza",
  email: " Ana@Loja.com ",
  password: "senha1234",
  storeName: "Mercadinho da Ana",
  document: "12.345.678/0001-90",
  kind: "Mercadinho",
  terms: true,
};

const messages = (
  schema: { safeParse(v: unknown): unknown },
  value: unknown,
) => {
  const result = schema.safeParse(value) as {
    success: boolean;
    error?: { issues: { path: PropertyKey[]; message: string }[] };
  };
  return Object.fromEntries(
    (result.error?.issues ?? []).map((i) => [String(i.path[0]), i.message]),
  );
};

it("normalizes e-mail with trim and lowercase and rejects invalid ones", () => {
  expect(emailSchema.parse(" Ana@Loja.com ")).toBe("ana@loja.com");
  expect(messages(emailSchema, "nope")).toEqual({
    undefined: "Informe um e-mail válido.",
  });
  expect(emailSchema.safeParse(`${"a".repeat(250)}@x.com`).success).toBe(false);
});

it("defaults remember to false and accepts true", () => {
  const base = { email: "a@b.co", password: "x" };
  expect(loginRequestSchema.parse(base).remember).toBe(false);
  expect(loginRequestSchema.parse({ ...base, remember: true }).remember).toBe(
    true,
  );
});

it("accepts a complete signup and cleans the document to digits", () => {
  expect(signupRequestSchema.parse(signup)).toMatchObject({
    email: "ana@loja.com",
    document: "12345678000190",
  });
  expect(
    signupRequestSchema.safeParse({ ...signup, document: "123.456.789-01" })
      .success,
  ).toBe(true);
});

it("reports each invalid signup field with the exact pt-BR message", () => {
  expect(
    messages(signupRequestSchema, {
      ...signup,
      name: "Ana",
      password: "curta",
      storeName: "  ",
      document: "123",
      kind: "Outra",
      terms: false,
    }),
  ).toEqual({
    name: "Informe nome e sobrenome.",
    password: "Use 8 caracteres ou mais, com letras e números.",
    storeName: "Informe o nome da loja.",
    document: "CNPJ ou CPF incompleto.",
    kind: expect.any(String),
    terms: "Aceite os termos para continuar.",
  });
  expect(
    signupRequestSchema.safeParse({ ...signup, phone: "1".repeat(21) }).success,
  ).toBe(false);
  expect(
    signupRequestSchema.parse({ ...signup, phone: "(11) 99999-0000" }).phone,
  ).toBe("(11) 99999-0000");
});

it("requires exactly six digits in the code", () => {
  const email = "a@b.co";
  expect(signupVerifySchema.safeParse({ email, code: "123456" }).success).toBe(
    true,
  );
  for (const code of ["12345", "1234567", "12345a", " 12345"])
    expect(messages(signupVerifySchema, { email, code })).toEqual({
      code: "Digite os 6 números do código.",
    });
  expect(
    passwordResetConfirmSchema.safeParse({
      email,
      code: "123456",
      password: "senha1234",
    }).success,
  ).toBe(true);
});
