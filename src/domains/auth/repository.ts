import "server-only";
import { asc, eq } from "drizzle-orm";
import { getDb } from "@/infrastructure/db";
import { users, type Role } from "@/infrastructure/db/schema";

const summary = {
  id: users.id,
  name: users.name,
  email: users.email,
  role: users.role,
};

export async function findUserByEmail(email: string) {
  const [user] = await getDb()
    .select({ ...summary, passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  return user;
}

export function listUsers() {
  return getDb()
    .select(summary)
    .from(users)
    .orderBy(asc(users.name))
    .limit(500);
}

export async function insertUser(values: {
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
}) {
  const [user] = await getDb().insert(users).values(values).returning(summary);
  return user;
}
