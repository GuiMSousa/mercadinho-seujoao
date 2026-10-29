import { z } from "zod";
import { userRole } from "@/infrastructure/db/schema";
import { emailSchema } from "./auth";

const nameSchema = z
  .string("Informe o nome.")
  .trim()
  .min(1, "Informe o nome.")
  .max(120, "Use até 120 caracteres.");
const roleSchema = z.enum(userRole.enumValues, "Escolha o perfil.");

export const userRowSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  email: z.string(),
  role: roleSchema,
  active: z.boolean(),
  lastLoginAt: z.iso.datetime().nullable(),
  // Invited and has not set a password yet.
  pending: z.boolean(),
});

export const usersListResponseSchema = z.object({
  users: z.array(userRowSchema),
});

export const inviteUserSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  role: roleSchema,
});

export const updateUserSchema = z
  .object({
    name: nameSchema.optional(),
    role: roleSchema.optional(),
    active: z.boolean().optional(),
  })
  .refine(
    (v) => Object.values(v).some((x) => x !== undefined),
    "Informe ao menos um campo para alterar.",
  );

export type UserRow = z.infer<typeof userRowSchema>;
export type UserUpdate = z.output<typeof updateUserSchema>;
