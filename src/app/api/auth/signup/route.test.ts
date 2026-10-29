import { NextRequest } from "next/server";
import { beforeEach, expect, it, vi } from "vitest";
import { SIGNUP_COOKIE, formErrorSchema } from "@/contracts/auth";
import { ServiceError } from "@/domains/auth/errors";
import { startSignup } from "@/domains/auth/signup";
import { POST } from "./route";

vi.mock("server-only", () => ({}));
vi.mock("@/domains/auth/signup", () => ({ startSignup: vi.fn() }));
vi.mock("@/domains/auth/sessions", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/domains/auth/sessions")>()),
  readSession: vi.fn().mockResolvedValue(null),
}));

const valid = {
  name: "Ana Souza",
  email: " Ana@Loja.com ",
  password: "senha1234",
  storeName: "Mercadinho da Ana",
  document: "12.345.678/0001-90",
  kind: "Mercadinho",
  terms: true,
};

beforeEach(() => {
  vi.mocked(startSignup).mockResolvedValue("nonce-1");
});

// Each test uses its own IP because the limiter keeps state for the whole process.
const post = (ip: string, body: unknown = valid, origin?: string) =>
  POST(
    new NextRequest("http://localhost:3000/api/auth/signup", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-forwarded-for": ip,
        ...(origin && { origin }),
      },
      body: JSON.stringify(body),
    }),
  );

it("accepts a valid request with 202 and hands the normalized input to the service", async () => {
  const response = await post("198.51.100.1");
  expect(response.status).toBe(202);
  expect(startSignup).toHaveBeenCalledWith(
    expect.objectContaining({
      email: "ana@loja.com",
      document: "12345678000190",
      terms: true,
    }),
  );
});

it("binds the pending signup to this browser with an HTTP-only cookie scoped to the signup routes", async () => {
  const response = await post("198.51.100.8");
  expect(response.cookies.get(SIGNUP_COOKIE)).toMatchObject({
    value: "nonce-1",
    httpOnly: true,
    sameSite: "lax",
    path: "/api/auth/signup",
    maxAge: 600,
    secure: false,
  });
  const tunnel = await POST(
    new NextRequest("http://localhost:3000/api/auth/signup", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-forwarded-for": "198.51.100.9",
        "x-forwarded-proto": "https",
      },
      body: JSON.stringify(valid),
    }),
  );
  expect(tunnel.cookies.get(SIGNUP_COOKIE)?.secure).toBe(true);
});

it("sets no cookie when the signup is refused", async () => {
  vi.mocked(startSignup).mockImplementationOnce(async () => {
    throw new ServiceError(409, "A loja já foi criada. Entre com sua conta.");
  });
  expect(
    (await post("198.51.100.10")).cookies.get(SIGNUP_COOKIE),
  ).toBeUndefined();
});

it("answers 422 with a message per invalid field", async () => {
  const response = await post("198.51.100.2", {
    ...valid,
    name: "Ana",
    document: "123",
    terms: false,
  });
  expect(response.status).toBe(422);
  const body = formErrorSchema.parse(await response.json());
  expect(body.fields).toEqual({
    name: "Informe nome e sobrenome.",
    document: "CNPJ ou CPF incompleto.",
    terms: "Aceite os termos para continuar.",
  });
  expect(startSignup).not.toHaveBeenCalled();
});

it("answers 400 to a body that is not JSON", async () => {
  const response = await POST(
    new NextRequest("http://localhost:3000/api/auth/signup", {
      method: "POST",
      headers: { "x-forwarded-for": "198.51.100.3" },
      body: "nope",
    }),
  );
  expect(response.status).toBe(400);
});

it("answers 409 when a store already exists, with the exact message", async () => {
  vi.mocked(startSignup).mockImplementation(async () => {
    throw new ServiceError(409, "A loja já foi criada. Entre com sua conta.");
  });
  const response = await post("198.51.100.4");
  expect(response.status).toBe(409);
  await expect(response.json()).resolves.toEqual({
    error: "A loja já foi criada. Entre com sua conta.",
  });
});

it("passes the field of an e-mail conflict and the Retry-After of a cooldown through", async () => {
  vi.mocked(startSignup).mockRejectedValueOnce(
    new ServiceError(409, "Este e-mail já tem conta.", {
      fields: { email: "Este e-mail já tem conta." },
    }),
  );
  const conflict = await post("198.51.100.5");
  expect(formErrorSchema.parse(await conflict.json()).fields).toEqual({
    email: "Este e-mail já tem conta.",
  });
  vi.mocked(startSignup).mockRejectedValueOnce(
    new ServiceError(429, "Aguarde.", { retryAfterSeconds: 42 }),
  );
  const cooldown = await post("198.51.100.5");
  expect(cooldown.status).toBe(429);
  expect(cooldown.headers.get("retry-after")).toBe("42");
});

it("lets unexpected errors surface instead of hiding them", async () => {
  vi.mocked(startSignup).mockImplementation(async () => {
    throw new Error("db down");
  });
  await expect(post("198.51.100.6")).rejects.toThrow("db down");
});

it("refuses the 11th request from one IP and cross-origin posts", async () => {
  for (let i = 0; i < 10; i++)
    expect((await post("203.0.113.9")).status).toBe(202);
  const blocked = await post("203.0.113.9");
  expect(blocked.status).toBe(429);
  expect(Number(blocked.headers.get("retry-after"))).toBeGreaterThan(0);
  expect(
    (await post("198.51.100.7", valid, "https://evil.example")).status,
  ).toBe(403);
});
