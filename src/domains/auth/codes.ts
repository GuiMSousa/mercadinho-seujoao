import { randomInt } from "node:crypto";
import { hashPassword, verifyPassword } from "./password";

export const CODE_TTL_MS = 10 * 60_000;
export const INVITE_TTL_MS = 48 * 3_600_000;
export const MAX_ATTEMPTS = 5;
export const RESEND_INTERVAL_MS = 60_000;

export function generateCode() {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

// Same scrypt cost as passwords: six digits are trivially brute-forceable if the hash leaks.
export const hashCode = hashPassword;
export const verifyCode = verifyPassword;
