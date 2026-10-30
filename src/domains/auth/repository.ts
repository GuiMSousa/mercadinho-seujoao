import "server-only";
import { and, eq, isNull, ne } from "drizzle-orm";
import { getDb } from "@/infrastructure/db";
import { sessions, users, verificationCodes } from "@/infrastructure/db/schema";

const summary = {
  id: users.id,
  name: users.name,
  email: users.email,
  role: users.role,
};

export async function findUserByEmail(email: string) {
  const [user] = await getDb()
    .select({
      ...summary,
      passwordHash: users.passwordHash,
      active: users.active,
    })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  return user;
}

export function touchLastLogin(userId: string) {
  return getDb()
    .update(users)
    .set({ lastLoginAt: new Date() })
    .where(eq(users.id, userId));
}

/**
 * Sets the new password, consumes the reset code and ends every session of the user in one
 * transaction. Returns false when the code was already consumed.
 */
export function resetPassword(input: {
  codeId: string;
  userId: string;
  passwordHash: string;
}) {
  return getDb().transaction(async (tx) => {
    const now = new Date();
    const consumed = await tx
      .update(verificationCodes)
      .set({ consumedAt: now })
      .where(
        and(
          eq(verificationCodes.id, input.codeId),
          isNull(verificationCodes.consumedAt),
        ),
      )
      .returning({ id: verificationCodes.id });
    if (consumed.length === 0) return false;
    await tx
      .update(users)
      .set({ passwordHash: input.passwordHash, passwordChangedAt: now })
      .where(eq(users.id, input.userId));
    await tx.delete(sessions).where(eq(sessions.userId, input.userId));
    return true;
  });
}

/**
 * Sets a new password chosen while signed in, ends every other session of the user and consumes
 * the open reset codes of the e-mail (an older code must not reset the new password), all in one
 * transaction: no state where the password changed but the old sessions or codes still work.
 */
export function changePasswordAndRevoke(input: {
  userId: string;
  email: string;
  keepSessionId: string;
  passwordHash: string;
}) {
  return getDb().transaction(async (tx) => {
    const now = new Date();
    await tx
      .update(users)
      .set({ passwordHash: input.passwordHash, passwordChangedAt: now })
      .where(eq(users.id, input.userId));
    await tx
      .delete(sessions)
      .where(
        and(
          eq(sessions.userId, input.userId),
          ne(sessions.id, input.keepSessionId),
        ),
      );
    await tx
      .update(verificationCodes)
      .set({ consumedAt: now, payload: null })
      .where(
        and(
          eq(verificationCodes.purpose, "password_reset"),
          eq(verificationCodes.email, input.email),
          isNull(verificationCodes.consumedAt),
        ),
      );
  });
}
