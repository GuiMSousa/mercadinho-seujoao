import "server-only";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import type { AuthUser, SignupRequest } from "@/contracts/auth";
import { logActivity } from "@/domains/activity/service";
import { createStoreWithAdmin } from "@/domains/store/repository";
import { hasStore } from "@/domains/store/service";
import { uniqueViolation } from "@/infrastructure/db/errors";
import { ServiceError } from "./errors";
import { hashPassword } from "./password";
import { findUserByEmail } from "./repository";
import {
  assertCooldown,
  claimCode,
  deliverCode,
  type CodeFailure,
} from "./verification";
import { latestCode } from "./verification-repository";

const STORE_EXISTS = "A loja já foi criada. Entre com sua conta.";
const EMAIL_TAKEN = "Este e-mail já tem conta. Entre ou recupere a senha.";
const CODE_MESSAGES: Record<CodeFailure, string> = {
  invalid: "Código inválido. Peça um novo código.",
  consumed: "Código inválido. Peça um novo código.",
  expired: "O código expirou. Peça um novo código.",
  too_many: "Muitas tentativas com este código. Peça um novo código.",
  wrong: "Código incorreto. Confira os números e tente novamente.",
};

// What the request keeps in verification_codes.payload until the code is confirmed.
const payloadSchema = z.object({
  name: z.string(),
  passwordHash: z.string(),
  nonceHash: z.string(),
  storeName: z.string(),
  document: z.string(),
  phone: z.string(),
  kind: z.string(),
});

const EXPIRED = "Seu cadastro expirou. Comece de novo.";

const sha256 = (value: string) => createHash("sha256").update(value).digest();

/**
 * The pending signup belongs to the browser that started it: the payload holds the hash of a
 * nonce that only that browser has (cookie). Without it, anyone could replace the pending
 * request (with their own password) and the owner's confirmation would create the attacker's account.
 */
function assertOwner(payload: unknown, nonce: string | undefined) {
  const expected = z.object({ nonceHash: z.string() }).safeParse(payload);
  const stored = expected.success
    ? Buffer.from(expected.data.nonceHash, "hex")
    : Buffer.alloc(0);
  const given = sha256(nonce ?? "");
  if (
    !nonce ||
    stored.length !== given.length ||
    !timingSafeEqual(stored, given)
  )
    throw new ServiceError(409, EXPIRED);
}

const storeExistsError = () => new ServiceError(409, STORE_EXISTS);
const emailTakenError = () =>
  new ServiceError(409, EMAIL_TAKEN, { fields: { email: EMAIL_TAKEN } });
const codeError = (reason: CodeFailure) =>
  new ServiceError(422, CODE_MESSAGES[reason], {
    fields: { code: CODE_MESSAGES[reason] },
  });

async function assertSignupOpen(email: string) {
  if (await hasStore()) throw storeExistsError();
  if (await findUserByEmail(email)) throw emailTakenError();
}

/**
 * Stores the request (with the password already hashed) and mails the code. Returns the nonce
 * the route must hand to the requester's browser; verify and resend need it back.
 */
export async function startSignup(input: SignupRequest) {
  await assertSignupOpen(input.email);
  await assertCooldown("signup", input.email);
  const nonce = randomBytes(32).toString("base64url");
  await deliverCode("signup", input.email, {
    name: input.name,
    passwordHash: await hashPassword(input.password),
    nonceHash: sha256(nonce).toString("hex"),
    storeName: input.storeName,
    document: input.document,
    phone: input.phone ?? "",
    kind: input.kind,
  } satisfies z.infer<typeof payloadSchema>);
  return nonce;
}

export async function resendSignupCode(
  email: string,
  nonce: string | undefined,
) {
  await assertSignupOpen(email);
  const pending = await latestCode("signup", email);
  if (!pending || pending.consumedAt)
    throw new ServiceError(
      404,
      "Não há cadastro em andamento para este e-mail. Comece novamente.",
    );
  assertOwner(pending.payload, nonce);
  await assertCooldown("signup", email);
  await deliverCode("signup", email, pending.payload);
}

/** Confirms the code and creates the store and its ADMIN in one transaction. */
export async function completeSignup(
  email: string,
  code: string,
  nonce: string | undefined,
): Promise<AuthUser> {
  if (await hasStore()) throw storeExistsError();
  // Checked before an attempt is spent, so a stranger cannot burn the owner's five tries.
  const pending = await latestCode("signup", email);
  if (pending && !pending.consumedAt) assertOwner(pending.payload, nonce);
  const claim = await claimCode("signup", email, code);
  if (!claim.ok) throw codeError(claim.reason);
  // Checked again on the claimed row, in case the request was replaced in between.
  assertOwner(claim.payload, nonce);
  const { name, passwordHash, storeName, document, phone, kind } =
    payloadSchema.parse(claim.payload);

  let user;
  try {
    user = await createStoreWithAdmin({
      codeId: claim.id,
      store: { name: storeName, document, phone, kind },
      admin: { name, email, passwordHash },
    });
  } catch (error) {
    // The unique constraints settle races that the checks above cannot.
    const constraint = uniqueViolation(error);
    if (constraint === "stores_singleton") throw storeExistsError();
    if (constraint === "users_email_unique") throw emailTakenError();
    throw error;
  }
  if (!user) throw codeError("consumed");
  await logActivity({ user, action: "Conta criada", detail: storeName });
  return user;
}
