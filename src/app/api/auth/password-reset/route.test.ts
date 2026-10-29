import { NextRequest } from "next/server";
import { expect, it, vi } from "vitest";
import { requestPasswordReset } from "@/domains/auth/password-reset";
import { POST } from "./route";

vi.mock("server-only", () => ({}));
vi.mock("@/domains/auth/password-reset", () => ({
  requestPasswordReset: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("@/domains/auth/sessions", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/domains/auth/sessions")>()),
  readSession: vi.fn().mockResolvedValue(null),
}));

const post = (ip: string, body: unknown = { email: " Ana@Loja.com " }) =>
  POST(
    new NextRequest("http://localhost:3000/api/auth/password-reset", {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": ip },
      body: JSON.stringify(body),
    }),
  );

it("answers every well-formed e-mail alike, whether or not there is an account", async () => {
  const known = await post("198.51.100.1", { email: "ana@loja.com" });
  const unknown = await post("198.51.100.2", { email: "nobody@loja.com" });
  expect(known.status).toBe(202);
  expect(unknown.status).toBe(202);
  expect(await known.text()).toBe(await unknown.text());
  expect(requestPasswordReset).toHaveBeenCalledWith("nobody@loja.com");
});

it("normalizes the e-mail and rejects an invalid one with 422", async () => {
  await post("198.51.100.3");
  expect(requestPasswordReset).toHaveBeenLastCalledWith("ana@loja.com");
  const invalid = await post("198.51.100.4", { email: "x" });
  expect(invalid.status).toBe(422);
  await expect(invalid.json()).resolves.toMatchObject({
    fields: { email: "Informe um e-mail válido." },
  });
});

it("refuses the 11th request from one IP", async () => {
  for (let i = 0; i < 10; i++)
    expect((await post("203.0.113.9")).status).toBe(202);
  expect((await post("203.0.113.9")).status).toBe(429);
});
