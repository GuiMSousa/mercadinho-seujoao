import "server-only";
import { randomUUID } from "node:crypto";
import type { AuthUser } from "@/contracts/auth";
import { hashPassword, verifyPassword } from "./password";
import { findUserByEmail, touchLastLogin } from "./repository";

export { touchLastLogin as recordLogin };

export type AuthResult =
  // `passwordHash` is the verified hash; createSession checks that it is still current.
  | { ok: true; user: AuthUser; passwordHash: string }
  | { ok: false; reason: "invalid" | "inactive" | "no_password" };

let unknownUserHash: Promise<string> | undefined;

/**
 * Checks e-mail, password and active flag; the role only decides where the person lands. The
 * password is verified first, so an inactive account is never revealed without it.
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
  return {
    ok: true,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
    passwordHash: user.passwordHash,
  };
}
