import { NextRequest } from "next/server";
import { expect, it, vi } from "vitest";
import { SIGNUP_COOKIE } from "@/contracts/auth";
import { ServiceError } from "@/domains/auth/errors";
import { resendSignupCode } from "@/domains/auth/signup";
import { POST } from "./route";

vi.mock("server-only", () => ({}));
vi.mock("@/domains/auth/signup", () => ({ resendSignupCode: vi.fn() }));
vi.mock("@/domains/auth/sessions", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/domains/auth/sessions")>()),
  readSession: vi.fn().mockResolvedValue(null),
}));

const post = (
  ip: string,
  body: unknown = { email: " Ana@Loja.com " },
  cookie = `${SIGNUP_COOKIE}=nonce-1`,
) =>
  POST(
    new NextRequest("http://localhost:3000/api/auth/signup/resend", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-forwarded-for": ip,
        cookie,
      },
      body: JSON.stringify(body),
    }),
  );

it("resends to the normalized e-mail with 202", async () => {
  vi.mocked(resendSignupCode).mockResolvedValue(undefined);
  expect((await post("198.51.100.1")).status).toBe(202);
  expect(resendSignupCode).toHaveBeenCalledWith("ana@loja.com", "nonce-1");
  await post("198.51.100.11", undefined, "");
  expect(resendSignupCode).toHaveBeenLastCalledWith("ana@loja.com", undefined);
});

it("validates the e-mail and reports the cooldown with Retry-After", async () => {
  expect((await post("198.51.100.2", { email: "x" })).status).toBe(422);
  vi.mocked(resendSignupCode).mockRejectedValue(
    new ServiceError(429, "Aguarde um minuto para pedir outro código.", {
      retryAfterSeconds: 30,
    }),
  );
  const response = await post("198.51.100.3");
  expect(response.status).toBe(429);
  expect(response.headers.get("retry-after")).toBe("30");
});

it("has its own rate limit of 10 per IP", async () => {
  vi.mocked(resendSignupCode).mockResolvedValue(undefined);
  for (let i = 0; i < 10; i++)
    expect((await post("203.0.113.9")).status).toBe(202);
  expect((await post("203.0.113.9")).status).toBe(429);
});
