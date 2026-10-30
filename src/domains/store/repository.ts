import "server-only";
import { and, eq, isNull } from "drizzle-orm";
import { getDb } from "@/infrastructure/db";
import {
  stores,
  users,
  verificationCodes,
  type SessionIdle,
} from "@/infrastructure/db/schema";

const settings = {
  name: stores.name,
  document: stores.document,
  phone: stores.phone,
  address: stores.address,
  sessionIdle: stores.sessionIdle,
};

export async function findStore() {
  const [row] = await getDb().select(settings).from(stores).limit(1);
  return row as typeof row | undefined;
}

export async function updateStoreRow(values: {
  name?: string;
  document?: string;
  phone?: string;
  address?: string;
  sessionIdle?: SessionIdle;
}) {
  // One row per installation (stores.singleton), so no WHERE is needed.
  const [row] = await getDb()
    .update(stores)
    .set({ ...values, updatedAt: new Date() })
    .returning(settings);
  return row;
}

/** Used by the dev seed only. Returns false when the installation already has its store. */
export async function insertStoreIfMissing(values: {
  name: string;
  document: string;
  phone: string;
  kind: string;
}) {
  const rows = await getDb()
    .insert(stores)
    .values(values)
    .onConflictDoNothing({ target: stores.singleton })
    .returning({ id: stores.id });
  return rows.length > 0;
}

export async function storeExists() {
  const [row] = await getDb().select({ id: stores.id }).from(stores).limit(1);
  return row !== undefined;
}

/**
 * Consumes the signup code, creates the store and its first ADMIN in one transaction.
 * Returns null when the code was already consumed. A second store fails on stores.singleton.
 */
export function createStoreWithAdmin(input: {
  codeId: string;
  store: {
    name: string;
    document: string;
    phone: string;
    kind: string;
  };
  admin: { name: string; email: string; passwordHash: string };
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
    if (consumed.length === 0) return null;
    await tx.insert(stores).values(input.store);
    const [user] = await tx
      .insert(users)
      .values({
        ...input.admin,
        role: "ADMIN",
        lastLoginAt: now,
        passwordChangedAt: now,
      })
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
      });
    return user;
  });
}
