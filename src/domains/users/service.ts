import "server-only";
import type { AccountResponse } from "@/contracts/account";
import type { UserRow, UserUpdate } from "@/contracts/users";
import { logActivity } from "@/domains/activity/service";
import { INVITE_TTL_MS } from "@/domains/auth/codes";
import { ServiceError } from "@/domains/auth/errors";
import { hashPassword, verifyPassword } from "@/domains/auth/password";
import {
  changePasswordAndRevoke,
  findUserByEmail,
} from "@/domains/auth/repository";
import {
  revokeAllSessions,
  revokeOtherSessions,
  type AuthSession,
} from "@/domains/auth/sessions";
import { deliverCode } from "@/domains/auth/verification";
import { getStore } from "@/domains/store/service";
import { uniqueViolation } from "@/infrastructure/db/errors";
import { inviteMail } from "@/infrastructure/mail/templates";
import {
  deleteUser,
  findUserById,
  insertUser,
  listUsers as selectUsers,
  updateUserChecked,
} from "./repository";

type Actor = { id: string; name: string };
type Session = Pick<AuthSession, "id" | "user">;
type StoredUser = Awaited<ReturnType<typeof selectUsers>>[number];

const LAST_ADMIN = "Mantenha ao menos um administrador ativo.";
const SELF_DEACTIVATION = "Você não pode desativar o próprio acesso.";
const WRONG_PASSWORD = "Senha atual incorreta.";

const toRow = (user: StoredUser): UserRow => ({
  ...user,
  lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
});

const emailTaken = () =>
  new ServiceError(409, "Este e-mail já tem conta.", {
    fields: { email: "Este e-mail já tem conta." },
  });

export async function listUsers() {
  return (await selectUsers()).map(toRow);
}

export async function getAccount(session: Session): Promise<AccountResponse> {
  const store = await getStore();
  return { user: session.user, store: { name: store?.name ?? "" } };
}

/** Creates the user without a password and mails a 48 h code that sets it on the reset screen. */
export async function inviteUser(
  actor: Actor,
  input: { name: string; email: string; role: "ADMIN" | "CASHIER" },
) {
  if (await findUserByEmail(input.email)) throw emailTaken();
  const store = await getStore();
  let user;
  try {
    user = await insertUser(input);
  } catch (error) {
    // The unique index settles a race the check above cannot.
    if (uniqueViolation(error) === "users_email_unique") throw emailTaken();
    throw error;
  }
  try {
    await deliverCode("password_reset", input.email, undefined, {
      ttlMs: INVITE_TTL_MS,
      mail: (code) =>
        inviteMail({
          name: input.name,
          email: input.email,
          storeName: store?.name ?? "Mkt Control",
          code,
        }),
    });
  } catch (error) {
    // Without the mail the person could never sign in; leave no half-invited account behind.
    await deleteUser(user.id);
    throw error;
  }
  await logActivity({
    user: actor,
    action: "Usuário adicionado",
    detail: input.email,
  });
  return toRow(user);
}

/**
 * Edits a user. Refused (409) when it would leave no active ADMIN or when an ADMIN deactivates
 * oneself; the rule runs under row locks, so concurrent changes cannot both pass it.
 * Deactivating ends every session of the user.
 */
export async function updateUser(actor: Actor, id: string, patch: UserUpdate) {
  const updated = await updateUserChecked(
    id,
    patch,
    ({ target, activeAdmins }) => {
      if (patch.active === false && target.id === actor.id)
        throw new ServiceError(409, SELF_DEACTIVATION);
      const staysActiveAdmin =
        (patch.role ?? target.role) === "ADMIN" &&
        (patch.active ?? target.active);
      if (
        target.role === "ADMIN" &&
        target.active &&
        !target.pending &&
        !staysActiveAdmin &&
        activeAdmins <= 1
      )
        throw new ServiceError(409, LAST_ADMIN);
    },
  );
  if (!updated) throw new ServiceError(404, "Usuário não encontrado.");
  if (patch.active === false) await revokeAllSessions(id);
  await logActivity({
    user: actor,
    action: patch.active === false ? "Usuário desativado" : "Usuário alterado",
    detail: updated.email,
  });
  return toRow(updated);
}

/** Checks the current password, sets the new one and ends the user's other sessions. */
export async function changePassword(
  session: Session,
  current: string,
  next: string,
) {
  const user = await findUserById(session.user.id);
  const valid =
    user?.passwordHash && (await verifyPassword(current, user.passwordHash));
  if (!user || !valid)
    throw new ServiceError(422, WRONG_PASSWORD, {
      fields: { current: WRONG_PASSWORD },
    });
  await changePasswordAndRevoke({
    userId: user.id,
    email: session.user.email,
    keepSessionId: session.id,
    passwordHash: await hashPassword(next),
  });
  await logActivity({
    user: session.user,
    action: "Senha alterada",
    detail: `Conta ${session.user.email}`,
  });
}

/** Ends every session of the user except this one; returns how many ended. */
export async function endOtherSessions(session: Session) {
  const revoked = await revokeOtherSessions(session.user.id, session.id);
  await logActivity({
    user: session.user,
    action: "Sessões encerradas",
    detail: `${revoked} ${revoked === 1 ? "sessão" : "sessões"}`,
  });
  return revoked;
}
