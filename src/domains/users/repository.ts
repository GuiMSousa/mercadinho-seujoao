import "server-only";
import { and, asc, eq, or, sql } from "drizzle-orm";
import { getDb } from "@/infrastructure/db";
import { users, type Role } from "@/infrastructure/db/schema";

const row = {
  id: users.id,
  name: users.name,
  email: users.email,
  role: users.role,
  active: users.active,
  lastLoginAt: users.lastLoginAt,
  pending: sql<boolean>`${users.passwordHash} is null`,
};

export function listUsers() {
  return getDb().select(row).from(users).orderBy(asc(users.name)).limit(500);
}

export async function findUserById(id: string) {
  const [user] = await getDb()
    .select({ ...row, passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);
  return user;
}

/** Without `passwordHash` the user is an invite: the invite code sets the password. */
export async function insertUser(values: {
  name: string;
  email: string;
  role: Role;
  passwordHash?: string;
}) {
  const [user] = await getDb().insert(users).values(values).returning(row);
  return user!;
}

export function deleteUser(id: string) {
  return getDb().delete(users).where(eq(users.id, id));
}

export function setPassword(id: string, passwordHash: string) {
  return getDb()
    .update(users)
    .set({ passwordHash, passwordChangedAt: new Date() })
    .where(eq(users.id, id));
}

/**
 * Applies `patch` after `check` accepts it, in one transaction. The target and every active ADMIN
 * are locked first (FOR UPDATE, in id order), so two requests that would each leave the other
 * as the last ADMIN run one after the other and the second one is refused. `check` throws to refuse.
 * Returns undefined when the user does not exist.
 */
export function updateUserChecked(
  id: string,
  patch: { name?: string; role?: Role; active?: boolean },
  check: (context: {
    target: { id: string; role: Role; active: boolean };
    activeAdmins: number;
  }) => void | Promise<void>,
) {
  return getDb().transaction(async (tx) => {
    const locked = await tx
      .select({ id: users.id, role: users.role, active: users.active })
      .from(users)
      .where(
        or(
          eq(users.id, id),
          and(eq(users.role, "ADMIN"), eq(users.active, true)),
        ),
      )
      .orderBy(users.id)
      .for("update");
    const target = locked.find((user) => user.id === id);
    if (!target) return undefined;
    await check({
      target,
      activeAdmins: locked.filter((u) => u.role === "ADMIN" && u.active).length,
    });
    const [updated] = await tx
      .update(users)
      .set(patch)
      .where(eq(users.id, id))
      .returning(row);
    return updated;
  });
}
