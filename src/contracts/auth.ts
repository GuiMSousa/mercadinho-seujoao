import { z } from "zod";
import { onlyDigits } from "@/lib/document";
import { userRole } from "@/infrastructure/db/schema";

export const SESSION_COOKIE = "mkt_session";
// Readable by the page so it can echo the token in CSRF_HEADER on mutations.
export const CSRF_COOKIE = "mkt_csrf";
export const CSRF_HEADER = "x-csrf-token";
// Binds a pending signup to the browser that started it (HTTP-only, only under /api/auth/signup).
export const SIGNUP_COOKIE = "mkt_signup";
export const SIGNUP_COOKIE_PATH = "/api/auth/signup";
export const SIGNUP_COOKIE_MAX_AGE_SECONDS = 600;

const PASSWORD_MESSAGE = "Use 8 caracteres ou mais, com letras e números.";

/** Rule for choosing a new password; login keeps a lenient schema so old passwords still work. */
export const passwordRuleSchema = z
  .string()
  .min(8, PASSWORD_MESSAGE)
  .max(256, PASSWORD_MESSAGE)
  .regex(/\p{L}/u, PASSWORD_MESSAGE)
  .regex(/\d/, PASSWORD_MESSAGE);

const CODE_MESSAGE = "Digite os 6 números do código.";
const EMAIL_MESSAGE = "Informe um e-mail válido.";

/** Trim + lowercase keeps the unique index on users.email case-insensitive in practice. */
export const emailSchema = z
  .string(EMAIL_MESSAGE)
  .trim()
  .toLowerCase()
  .max(254, EMAIL_MESSAGE)
  .pipe(z.email(EMAIL_MESSAGE));

export const loginRequestSchema = z.object({
  email: emailSchema,
  // Upper bound caps the cost of hashing attacker-supplied input.
  password: z.string().min(1).max(256),
  remember: z.boolean().default(false),
});

export const STORE_KINDS = [
  "Mercadinho",
  "Padaria",
  "Açougue",
  "Hortifrúti",
  "Loja de conveniência",
  "Outro",
] as const;

export const signupRequestSchema = z.object({
  name: z
    .string("Informe nome e sobrenome.")
    .trim()
    .max(120, "Informe nome e sobrenome.")
    .refine((v) => v.split(/\s+/).length >= 2, "Informe nome e sobrenome."),
  email: emailSchema,
  password: passwordRuleSchema,
  storeName: z
    .string("Informe o nome da loja.")
    .trim()
    .min(1, "Informe o nome da loja.")
    .max(80, "Informe o nome da loja."),
  document: z
    .string("CNPJ ou CPF incompleto.")
    .refine(
      (v) => [11, 14].includes(onlyDigits(v).length),
      "CNPJ ou CPF incompleto.",
    )
    .transform(onlyDigits),
  phone: z.string().trim().max(20).optional(),
  kind: z.enum(STORE_KINDS, "Escolha o tipo da loja."),
  terms: z.literal(true, "Aceite os termos para continuar."),
});

export const codeSchema = z.string(CODE_MESSAGE).regex(/^\d{6}$/, CODE_MESSAGE);

export const signupVerifySchema = z.object({
  email: emailSchema,
  code: codeSchema,
});

export const signupResendSchema = z.object({ email: emailSchema });

export const passwordResetSchema = z.object({ email: emailSchema });

export const passwordResetConfirmSchema = z.object({
  email: emailSchema,
  code: codeSchema,
  password: passwordRuleSchema,
});

export const authUserSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  email: z.string(),
  role: z.enum(userRole.enumValues),
});

export const loginResponseSchema = z.object({
  user: authUserSchema,
  csrfToken: z.string(),
});

export const setupResponseSchema = z.object({ hasStore: z.boolean() });

export const usersListResponseSchema = z.object({
  users: z.array(authUserSchema),
});

export const errorResponseSchema = z.object({ error: z.string() });

/** Form errors: `fields` maps a field name to its message. */
export const formErrorSchema = errorResponseSchema.extend({
  fields: z.record(z.string(), z.string()).optional(),
});

export type AuthUser = z.infer<typeof authUserSchema>;
export type SignupRequest = z.output<typeof signupRequestSchema>;
