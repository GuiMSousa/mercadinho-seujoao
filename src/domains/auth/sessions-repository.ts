import "server-only";
import { and, eq, ne } from "drizzle-orm";
import { getDb } from "@/infrastructure/db";
import { sessions, stores, users } from "@/infrastructure/db/schema";

export type SessionRow = {
  userId: string;
  csrfHash: string | null;
  remember: boolean;
  expiresAt: Date;
  lastUsedAt: Date;
  userName: string;
  userEmail: string;
  userRole: "ADMIN" | "CASHIER";
  userActive: boolean;
  // Null when no store row exists yet (before the first signup).
  sessionIdle: "1h" | "8h" | "24h" | "never" | null;
};

export function insertSession(values: typeof sessions.$inferInsert) {
  return getDb().insert(sessions).values(values);
}

export async function findSessionRow(
  id: string,
): Promise<SessionRow | undefined> {
  const [row] = await getDb()
    .select({
      userId: sessions.userId,
      csrfHash: sessions.csrfHash,
      remember: sessions.remember,
      expiresAt: sessions.expiresAt,
      lastUsedAt: sessions.lastUsedAt,
      userName: users.name,
      userEmail: users.email,
      userRole: users.role,
      userActive: users.active,
      sessionIdle: stores.sessionIdle,
    })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .leftJoin(stores, eq(stores.singleton, true))
    .where(eq(sessions.id, id))
    .limit(1);
  return row;
}

export function updateSession(
  id: string,
  values: { lastUsedAt: Date; expiresAt?: Date },
) {
  return getDb().update(sessions).set(values).where(eq(sessions.id, id));
}

export function deleteSession(id: string) {
  return getDb().delete(sessions).where(eq(sessions.id, id));
}

export async function deleteOtherSessions(userId: string, keepId: string) {
  const removed = await getDb()
    .delete(sessions)
    .where(and(eq(sessions.userId, userId), ne(sessions.id, keepId)))
    .returning({ id: sessions.id });
  return removed.length;
}

export function deleteAllSessions(userId: string) {
  return getDb().delete(sessions).where(eq(sessions.userId, userId));
}
