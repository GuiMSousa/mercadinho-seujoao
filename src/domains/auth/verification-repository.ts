import "server-only";
import { and, desc, eq, gt, isNull, lt, sql } from "drizzle-orm";
import { getDb } from "@/infrastructure/db";
import {
  verificationCodes,
  type VerificationPurpose,
} from "@/infrastructure/db/schema";

export type CodeRow = typeof verificationCodes.$inferSelect;

export async function latestCode(purpose: VerificationPurpose, email: string) {
  const [row] = await getDb()
    .select()
    .from(verificationCodes)
    .where(
      and(
        eq(verificationCodes.purpose, purpose),
        eq(verificationCodes.email, email),
      ),
    )
    .orderBy(desc(verificationCodes.createdAt))
    .limit(1);
  return row;
}

/** Invalidates the open codes of this e-mail and purpose, then stores the new one. */
export function replaceCode(values: {
  purpose: VerificationPurpose;
  email: string;
  codeHash: string;
  expiresAt: Date;
  payload: unknown;
}) {
  return getDb().transaction(async (tx) => {
    const now = new Date();
    await tx
      .update(verificationCodes)
      .set({ consumedAt: now })
      .where(
        and(
          eq(verificationCodes.purpose, values.purpose),
          eq(verificationCodes.email, values.email),
          isNull(verificationCodes.consumedAt),
        ),
      );
    // Explicit JS time (ms precision): now() is constant inside a transaction, which would tie "latest".
    const [row] = await tx
      .insert(verificationCodes)
      .values({ ...values, createdAt: now })
      .returning({ id: verificationCodes.id });
    return row.id;
  });
}

export function deleteCode(id: string) {
  return getDb().delete(verificationCodes).where(eq(verificationCodes.id, id));
}

/**
 * Spends one attempt atomically: only an open code with attempts left is returned, so parallel
 * guesses cannot exceed `maxAttempts` (a read-then-increment would let them all through).
 */
export async function claimAttempt(id: string, now: Date, maxAttempts: number) {
  const [row] = await getDb()
    .update(verificationCodes)
    .set({ attempts: sql`${verificationCodes.attempts} + 1` })
    .where(
      and(
        eq(verificationCodes.id, id),
        isNull(verificationCodes.consumedAt),
        gt(verificationCodes.expiresAt, now),
        lt(verificationCodes.attempts, maxAttempts),
      ),
    )
    .returning();
  return row;
}
