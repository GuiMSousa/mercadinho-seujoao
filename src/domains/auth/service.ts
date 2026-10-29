import "server-only";
import { randomUUID } from "node:crypto";
import type { UserSummary } from "@/contracts/auth";
import { hashPassword, verifyPassword } from "./password";
import { findUserByEmail } from "./repository";

export { listUsers } from "./repository";

let unknownUserHash: Promise<string> | undefined;

/** Returns the user for valid credentials, otherwise null. */
export async function authenticate(
  email: string,
  password: string,
): Promise<UserSummary | null> {
  const user = await findUserByEmail(email);
  // Hash for unknown users too, so response time does not reveal which e-mails exist.
  const stored =
    user?.passwordHash ??
    (await (unknownUserHash ??= hashPassword(randomUUID())));
  const valid = await verifyPassword(password, stored);
  return user && valid
    ? { id: user.id, name: user.name, email: user.email, role: user.role }
    : null;
}
