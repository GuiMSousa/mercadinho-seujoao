import "server-only";
import { and, asc, desc, eq, gt, isNull, lt, sql } from "drizzle-orm";
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

/** Creation times of the codes issued for this e-mail and purpose since `since`, oldest first. */
export async function codeTimesSince(
  purpose: VerificationPurpose,
  email: string,
  since: Date,
) {
  const rows = await getDb()
    .select({ createdAt: verificationCodes.createdAt })
    .from(verificationCodes)
    .where(
      and(
        eq(verificationCodes.purpose, purpose),
        eq(verificationCodes.email, email),
        gt(verificationCodes.createdAt, since),
      ),
    )
    .orderBy(asc(verificationCodes.createdAt));
  return rows.map((row) => row.createdAt);
}

/** Stores a new code; older open ones stay valid until `supersedeCodes` runs, after the mail is out. */
export async function insertCode(values: {
  purpose: VerificationPurpose;
  email: string;
  codeHash: string;
  expiresAt: Date;
  payload: unknown;
}) {
  // Rows older than the 24 h cap window (plus 1 h of slack) can no longer matter; drop them here.
  await getDb()
    .delete(verificationCodes)
    .where(
      and(
        eq(verificationCodes.purpose, values.purpose),
        eq(verificationCodes.email, values.email),
        lt(verificationCodes.createdAt, new Date(Date.now() - 25 * 3_600_000)),
      ),
    );
  // Explicit JS time (ms precision): now() is constant inside a transaction, which would tie "latest".
  const [row] = await getDb()
    .insert(verificationCodes)
    .values({ ...values, createdAt: new Date() })
    .returning({ id: verificationCodes.id });
  return row.id;
}

/**
 * Invalidates (keeps, as consumed) the open codes of this e-mail and purpose created before `keepId`
 * (ties broken by id), and drops their payload. Only older codes, so of two concurrent deliveries
 * the newest always survives. Row comparison against the kept row keeps it one statement.
 */
export function supersedeCodes(
  purpose: VerificationPurpose,
  email: string,
  keepId: string,
) {
  return getDb()
    .update(verificationCodes)
    .set({ consumedAt: new Date(), payload: null })
    .where(
      and(
        eq(verificationCodes.purpose, purpose),
        eq(verificationCodes.email, email),
        isNull(verificationCodes.consumedAt),
        sql`(${verificationCodes.createdAt}, ${verificationCodes.id}) < (select ${verificationCodes.createdAt}, ${verificationCodes.id} from ${verificationCodes} where ${verificationCodes.id} = ${keepId})`,
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
