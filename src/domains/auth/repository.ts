import "server-only";
import { asc, eq } from "drizzle-orm";
import { getDb } from "@/infrastructure/db";
import { users, type Role } from "@/infrastructure/db/schema";

const summary = { id: users.id, username: users.username, role: users.role };

export async function findUserByUsername(username: string) {
  const [user] = await getDb()
    .select({ ...summary, passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.username, username))
    .limit(1);
  return user;
}

export function listUsers() {
  return getDb()
    .select(summary)
    .from(users)
    .orderBy(asc(users.username))
    .limit(500);
}

export async function insertUser(values: {
  username: string;
  passwordHash: string;
  role: Role;
}) {
  const [user] = await getDb().insert(users).values(values).returning(summary);
  return user;
}
