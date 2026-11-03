import { z } from "zod";
import { SESSION_IDLE_VALUES } from "./enums";
import { documentSchema, phoneSchema, storeNameSchema } from "./auth";

// Partial update: only the fields sent change, so two editors cannot overwrite each other's other fields.
export const updateStoreSchema = z
  .object({
    name: storeNameSchema,
    document: documentSchema,
    phone: phoneSchema,
    address: z.string().trim().max(200, "Use até 200 caracteres."),
    // How long a session may stay idle: 1h, 8h, 24h or never.
    sessionIdle: z.enum(
      SESSION_IDLE_VALUES,
      "Escolha um tempo de inatividade.",
    ),
  })
  .partial()
  .refine(
    (v) => Object.values(v).some((x) => x !== undefined),
    "Informe ao menos um campo para alterar.",
  );

export const storeResponseSchema = z.object({
  name: z.string(),
  document: z.string(),
  phone: z.string(),
  address: z.string(),
  sessionIdle: z.enum(SESSION_IDLE_VALUES),
});

export type UpdateStore = z.output<typeof updateStoreSchema>;
