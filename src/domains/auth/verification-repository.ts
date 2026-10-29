import "server-only";
import { and, desc, eq, gt, isNull, lt, ne, sql } from "drizzle-orm";
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

/** Stores a new code; older open ones stay valid until `supersedeCodes` runs, after the mail is out. */
export async function insertCode(values: {
  purpose: VerificationPurpose;
  email: string;
  codeHash: string;
  expiresAt: Date;
  payload: unknown;
}) {
  // Explicit JS time (ms precision): now() is constant inside a transaction, which would tie "latest".
  const [row] = await getDb()
    .insert(verificationCodes)
    .values({ ...values, createdAt: new Date() })
    .returning({ id: verificationCodes.id });
  return row.id;
}

/** Invalidates (keeps, as consumed) the other open codes of this e-mail and purpose. */
export function supersedeCodes(
  purpose: VerificationPurpose,
  email: string,
  keepId: string,
) {
  return getDb()
    .update(verificationCodes)
    .set({ consumedAt: new Date() })
    .where(
      and(
        eq(verificationCodes.purpose, purpose),
        eq(verificationCodes.email, email),
        isNull(verificationCodes.consumedAt),
        ne(verificationCodes.id, keepId),
      ),
    );
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
