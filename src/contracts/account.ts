import { z } from "zod";
import { authUserSchema, passwordRuleSchema } from "./auth";

export const accountResponseSchema = z.object({
  user: authUserSchema,
  store: z.object({ name: z.string() }),
});

export const changePasswordSchema = z.object({
  // Only the upper bound: the stored password may predate the current rule.
  current: z
    .string("Informe a senha atual.")
    .min(1, "Informe a senha atual.")
    .max(256),
  next: passwordRuleSchema,
});

export const revokedSessionsSchema = z.object({
  revoked: z.number().int().nonnegative(),
});

export type AccountResponse = z.infer<typeof accountResponseSchema>;
