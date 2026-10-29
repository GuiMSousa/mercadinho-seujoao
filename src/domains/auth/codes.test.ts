import { beforeAll, describe, expect, it } from "vitest";
import {
  CODE_TTL_MS,
  INVITE_TTL_MS,
  MAX_ATTEMPTS,
  RESEND_INTERVAL_MS,
  checkCode,
  generateCode,
  hashCode,
  verifyCode,
} from "./codes";

const now = new Date("2026-10-29T12:00:00Z");
const future = new Date(now.getTime() + CODE_TTL_MS);

it("exposes the agreed limits", () => {
  expect(CODE_TTL_MS).toBe(600_000);
  expect(INVITE_TTL_MS).toBe(172_800_000);
  expect(MAX_ATTEMPTS).toBe(5);
  expect(RESEND_INTERVAL_MS).toBe(60_000);
});

it("generates six-digit codes", () => {
  for (let i = 0; i < 100; i++) expect(generateCode()).toMatch(/^\d{6}$/);
});

describe("hash and check", () => {
  let codeHash: string;
  beforeAll(async () => {
    codeHash = await hashCode("012345");
  });
  const record = (over: Partial<Parameters<typeof checkCode>[0]> = {}) => ({
    codeHash,
    expiresAt: future,
    attempts: 0,
    consumedAt: null,
    ...over,
  });

  it("hashes without leaking the code and verifies it", async () => {
    expect(codeHash).not.toContain("012345");
    await expect(verifyCode("012345", codeHash)).resolves.toBe(true);
    await expect(verifyCode("543210", codeHash)).resolves.toBe(false);
  });

  it("returns ok for the right code", async () => {
    await expect(checkCode(record(), "012345", now)).resolves.toBe("ok");
  });

  it("returns wrong for a wrong code", async () => {
    await expect(checkCode(record(), "000000", now)).resolves.toBe("wrong");
  });

  it("returns too_many at the attempt limit even with the right code", async () => {
    await expect(
      checkCode(record({ attempts: MAX_ATTEMPTS }), "012345", now),
    ).resolves.toBe("too_many");
    await expect(
      checkCode(record({ attempts: MAX_ATTEMPTS - 1 }), "012345", now),
    ).resolves.toBe("ok");
  });

  it("returns expired after expiresAt", async () => {
    await expect(
      checkCode(record({ expiresAt: now }), "012345", now),
    ).resolves.toBe("expired");
  });

  it("returns consumed when already used", async () => {
    await expect(
      checkCode(record({ consumedAt: now }), "012345", now),
    ).resolves.toBe("consumed");
  });
});
