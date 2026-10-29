import "server-only";
import { and, eq, isNull } from "drizzle-orm";
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
