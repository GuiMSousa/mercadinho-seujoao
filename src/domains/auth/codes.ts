import { randomInt } from "node:crypto";
import { hashPassword, verifyPassword } from "./password";

export const CODE_TTL_MS = 10 * 60_000;
export const INVITE_TTL_MS = 48 * 3_600_000;
export const MAX_ATTEMPTS = 5;
export const RESEND_INTERVAL_MS = 60_000;

export type CodeCheck = "ok" | "expired" | "consumed" | "too_many" | "wrong";

type CodeRecord = {
  codeHash: string;
  expiresAt: Date;
  attempts: number;
  consumedAt: Date | null;
};

export function generateCode() {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

// Same scrypt cost as passwords: six digits are trivially brute-forceable if the hash leaks.
export const hashCode = hashPassword;
export const verifyCode = verifyPassword;

/** Pure check; callers persist the attempt increment or consumption. */
export async function checkCode(
  record: CodeRecord,
  code: string,
  now: Date,
): Promise<CodeCheck> {
  if (record.consumedAt) return "consumed";
  if (record.expiresAt <= now) return "expired";
  if (record.attempts >= MAX_ATTEMPTS) return "too_many";
  return (await verifyCode(code, record.codeHash)) ? "ok" : "wrong";
}
