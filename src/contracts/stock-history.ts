import { z } from "zod";
import { INVENTORY_MOVEMENT_TYPES } from "./enums";
import { listQuerySchema, unitSchema } from "./inventory";

// An empty select or date field arrives as "": it means no filter.
const optional = <T extends z.ZodType>(schema: T) =>
  z.union([z.literal("").transform(() => undefined), schema]).optional();

/** Filters of the stock history: product (name or barcode), type and store-calendar days. */
export const movementsQuerySchema = listQuerySchema
  .extend({
    type: optional(z.enum(INVENTORY_MOVEMENT_TYPES)),
    from: optional(z.iso.date()),
    to: optional(z.iso.date()),
  })
  .refine((query) => !query.from || !query.to || query.from <= query.to, {
    path: ["to"],
    message: "O fim do período não pode vir antes do início.",
  });

export const movementRowSchema = z.object({
  id: z.uuid(),
  createdAt: z.iso.datetime(),
  productId: z.uuid(),
  productName: z.string(),
  barcode: z.string(),
  unit: unitSchema,
  type: z.enum(INVENTORY_MOVEMENT_TYPES),
  // In the unit's base (units, grams, milliliters); always positive, the type says which way.
  quantity: z.int(),
  reason: z.string(),
  batchCode: z.string().nullable(),
  userName: z.string(),
});

export const movementsPageSchema = z.object({
  movements: z.array(movementRowSchema),
  total: z.int(),
  page: z.int(),
  pageSize: z.int(),
});

export type MovementsQuery = z.output<typeof movementsQuerySchema>;
export type MovementRow = z.infer<typeof movementRowSchema>;
export type MovementsPage = z.infer<typeof movementsPageSchema>;
