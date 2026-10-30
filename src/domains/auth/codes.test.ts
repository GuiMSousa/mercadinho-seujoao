import { describe, expect, it } from "vitest";
import {
  CODE_TTL_MS,
  INVITE_TTL_MS,
  MAX_ATTEMPTS,
  RESEND_INTERVAL_MS,
  generateCode,
  hashCode,
  verifyCode,
} from "./codes";

it("exposes the agreed limits", () => {
  expect(CODE_TTL_MS).toBe(600_000);
  expect(INVITE_TTL_MS).toBe(172_800_000);
  expect(MAX_ATTEMPTS).toBe(5);
  expect(RESEND_INTERVAL_MS).toBe(60_000);
});

it("generates six-digit codes", () => {
  for (let i = 0; i < 100; i++) expect(generateCode()).toMatch(/^\d{6}$/);
});

describe("hash", () => {
  it("hashes without leaking the code and verifies it", async () => {
    const codeHash = await hashCode("012345");
    expect(codeHash).not.toContain("012345");
    await expect(verifyCode("012345", codeHash)).resolves.toBe(true);
    await expect(verifyCode("543210", codeHash)).resolves.toBe(false);
  });
});
