import "server-only";
import { randomUUID } from "node:crypto";
import type { VerificationPurpose } from "@/infrastructure/db/schema";
import {
  resetCodeMail,
  signupCodeMail,
  type MailContent,
} from "@/infrastructure/mail/templates";
import { getMailer } from "@/infrastructure/mail";
import {
  CODE_TTL_MS,
  MAX_ATTEMPTS,
  RESEND_INTERVAL_MS,
  generateCode,
  hashCode,
  verifyCode,
} from "./codes";
import { ServiceError } from "./errors";
import {
  claimAttempt,
  deleteCode,
  latestCode,
  insertCode,
  supersedeCodes,
} from "./verification-repository";

export type CodeFailure =
  "invalid" | "expired" | "consumed" | "too_many" | "wrong";
export type CodeClaim =
  | { ok: true; id: string; payload: unknown }
  | { ok: false; reason: CodeFailure };

let unknownCodeHash: Promise<string> | undefined;

/**
 * Stores a new code and returns it in clear for the mail. The previous code stays valid until the
 * caller delivers this one and calls `supersedeCodes`, so a failed delivery loses nothing.
 */
export async function issueCode(
  purpose: VerificationPurpose,
  email: string,
  options: { payload?: unknown; ttlMs?: number } = {},
) {
  const code = generateCode();
  const id = await insertCode({
    purpose,
    email,
    codeHash: await hashCode(code),
    expiresAt: new Date(Date.now() + (options.ttlMs ?? CODE_TTL_MS)),
    payload: options.payload ?? null,
  });
  return { id, code };
}

/**
 * Issues a code and mails it, then invalidates the previous ones; a failed delivery drops the new code
 * and keeps the old. `options` overrides the lifetime and the mail (the invite uses both).
 */
export async function deliverCode(
  purpose: VerificationPurpose,
  email: string,
  payload?: unknown,
  options: { ttlMs?: number; mail?: (code: string) => MailContent } = {},
) {
  const { id, code } = await issueCode(purpose, email, {
    payload,
    ttlMs: options.ttlMs,
  });
  const mail =
    options.mail?.(code) ??
    (purpose === "signup" ? signupCodeMail(code) : resetCodeMail(code));
  try {
    await getMailer().send({ to: email, ...mail });
  } catch (error) {
    await deleteCode(id);
    throw error;
  }
  await supersedeCodes(purpose, email, id);
}

/** Refuses with 429 when the last code for this e-mail and purpose is under a minute old. */
export async function assertCooldown(
  purpose: VerificationPurpose,
  email: string,
  now = new Date(),
) {
  const last = await latestCode(purpose, email);
  const waitMs = last
    ? last.createdAt.getTime() + RESEND_INTERVAL_MS - now.getTime()
    : 0;
  if (waitMs > 0)
    throw new ServiceError(429, "Aguarde um minuto para pedir outro código.", {
      retryAfterSeconds: Math.ceil(waitMs / 1000),
    });
}

/**
 * Checks `code` against the latest code of this e-mail and purpose. The attempt is spent in SQL
 * before the hash is compared, so five wrong guesses lock the code even when sent in parallel.
 * The caller consumes the code (`claim.id`) when it applies the result.
 */
export async function claimCode(
  purpose: VerificationPurpose,
  email: string,
  code: string,
  now = new Date(),
): Promise<CodeClaim> {
  const row = await latestCode(purpose, email);
  const claimed = row && (await claimAttempt(row.id, now, MAX_ATTEMPTS));
  if (!row || !claimed) {
    // Every path costs one scrypt, so response time reveals neither which e-mails have a code nor its state.
    await verifyCode(code, await (unknownCodeHash ??= hashCode(randomUUID())));
    if (!row) return { ok: false, reason: "invalid" };
    return {
      ok: false,
      reason: row.consumedAt
        ? "consumed"
        : row.expiresAt <= now
          ? "expired"
          : "too_many",
    };
  }
  return (await verifyCode(code, claimed.codeHash))
    ? { ok: true, id: claimed.id, payload: claimed.payload }
    : { ok: false, reason: "wrong" };
}
