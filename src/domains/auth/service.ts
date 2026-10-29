import "server-only";
import { randomUUID } from "node:crypto";
import type { AuthUser } from "@/contracts/auth";
import { hashPassword, verifyPassword } from "./password";
import { findUserByEmail, touchLastLogin } from "./repository";

export { listUsers } from "./repository";
export { touchLastLogin as recordLogin };

export type AuthResult =
  | { ok: true; user: AuthUser }
  | { ok: false; reason: "invalid" | "inactive" | "not_admin" | "no_password" };

let unknownUserHash: Promise<string> | undefined;

/**
 * Checks e-mail, password, active flag and role (the panel is ADMIN-only). The password is
 * verified first, so inactive or non-admin status is never revealed without it.
 */
export async function authenticate(
  email: string,
  password: string,
): Promise<AuthResult> {
  const user = await findUserByEmail(email);
  // Hash for unknown and password-less users too, so response time does not reveal which e-mails exist.
  const stored =
    user?.passwordHash ??
    (await (unknownUserHash ??= hashPassword(randomUUID())));
  const valid = await verifyPassword(password, stored);
  if (!user) return { ok: false, reason: "invalid" };
  if (!user.passwordHash) return { ok: false, reason: "no_password" };
  if (!valid) return { ok: false, reason: "invalid" };
  if (!user.active) return { ok: false, reason: "inactive" };
  if (user.role !== "ADMIN") return { ok: false, reason: "not_admin" };
  return {
    ok: true,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  };
}
