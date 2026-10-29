import { z } from "zod";
import { SESSION_IDLE_VALUES } from "@/infrastructure/db/schema";
import { documentSchema, phoneSchema, storeNameSchema } from "./auth";

export const updateStoreSchema = z.object({
  name: storeNameSchema,
  document: documentSchema,
  phone: phoneSchema.default(""),
  address: z.string().trim().max(200, "Use até 200 caracteres.").default(""),
  // How long a session may stay idle: 1h, 8h, 24h or never.
  sessionIdle: z.enum(SESSION_IDLE_VALUES, "Escolha um tempo de inatividade."),
});

export const storeResponseSchema = z.object({
  name: z.string(),
  document: z.string(),
  phone: z.string(),
  address: z.string(),
  sessionIdle: z.enum(SESSION_IDLE_VALUES),
});

export type UpdateStore = z.output<typeof updateStoreSchema>;
