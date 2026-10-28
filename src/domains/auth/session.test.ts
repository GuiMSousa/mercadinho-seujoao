import { SignJWT, UnsecuredJWT } from "jose";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { createSessionToken, readSessionToken, type Session } from "./session";

vi.mock("server-only", () => ({}));

const SECRET = "test-secret-with-at-least-32-characters";
const session: Session = {
  id: "7f1d8c1e-0d2b-4a8e-9c3f-2b6a1e5d4c3b",
  username: "maria",
  role: "CASHIER",
  csrf: "csrf-token",
};

beforeEach(() => vi.stubEnv("SESSION_SECRET", SECRET));
afterEach(() => vi.unstubAllEnvs());

it("round-trips a signed session", async () => {
  await expect(
    readSessionToken(await createSessionToken(session)),
  ).resolves.toEqual(session);
});

it("rejects tampered, unsigned, expired and missing tokens", async () => {
  const token = await createSessionToken(session);
  const [header, , signature] = token.split(".");
  const forgedClaims = Buffer.from(
    JSON.stringify({
      sub: session.id,
      username: "maria",
      role: "ADMIN",
      csrf: "x",
    }),
  ).toString("base64url");
  const unsigned = new UnsecuredJWT({ ...session, role: "ADMIN" })
    .setSubject(session.id)
    .encode();
  const expired = await new SignJWT({
    username: "maria",
    role: "ADMIN",
    csrf: "x",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(session.id)
    .setExpirationTime(Math.floor(Date.now() / 1000) - 60)
    .sign(new TextEncoder().encode(SECRET));

  for (const bad of [
    `${header}.${forgedClaims}.${signature}`,
    unsigned,
    expired,
    undefined,
  ]) {
    await expect(readSessionToken(bad)).resolves.toBeNull();
  }
});

it("fails loudly when SESSION_SECRET is missing", async () => {
  const token = await createSessionToken(session);
  vi.stubEnv("SESSION_SECRET", undefined);
  await expect(readSessionToken(token)).rejects.toThrow("SESSION_SECRET");
});
