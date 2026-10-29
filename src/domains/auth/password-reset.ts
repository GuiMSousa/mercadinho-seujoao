import "server-only";
import { logActivity } from "@/domains/activity/service";
import { logger } from "@/lib/logger";
import { ServiceError } from "./errors";
import { hashPassword } from "./password";
import { findUserByEmail, resetPassword } from "./repository";
import { assertCooldown, claimCode, deliverCode } from "./verification";

// One message for every failure: different ones would tell whether the e-mail has an account.
const INVALID_CODE = "Código inválido ou expirado. Peça um novo código.";

/**
 * Mails a reset code to an active account and says nothing otherwise. Delivery runs detached,
 * so the response time is the same whether or not the account exists.
 */
export async function requestPasswordReset(email: string) {
  const user = await findUserByEmail(email);
  if (!user?.active) return;
  void (async () => {
    try {
      await assertCooldown("password_reset", email);
      await deliverCode("password_reset", email);
    } catch (error) {
      // A cooldown is a silent no-op. Log the pg/mail cause, not Drizzle's message, which lists query parameters.
      if (error instanceof ServiceError) return;
      logger.error(
        { err: (error as Error).cause ?? error },
        "Failed to send the password reset code",
      );
    }
  })();
}

/** Sets the new password, consumes the code and ends every session of the user. */
export async function confirmPasswordReset(
  email: string,
  code: string,
  password: string,
) {
  const claim = await claimCode("password_reset", email, code);
  const user = claim.ok ? await findUserByEmail(email) : undefined;
  const done =
    claim.ok &&
    user?.active &&
    (await resetPassword({
      codeId: claim.id,
      userId: user.id,
      passwordHash: await hashPassword(password),
    }));
  if (!user || !done)
    throw new ServiceError(422, INVALID_CODE, {
      fields: { code: INVALID_CODE },
    });
  await logActivity({ user, action: "Senha redefinida" });
}
