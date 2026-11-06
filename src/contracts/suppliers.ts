import { z } from "zod";
import { onlyDigits } from "@/lib/document";
import { emailSchema } from "./auth";
import { hasNoNul, NUL_MESSAGE, unitSchema } from "./inventory";

const text = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Use até ${max} caracteres.`)
    .refine(hasNoNul, NUL_MESSAGE);

export const partyNameSchema = z
  .string("Informe o nome.")
  .trim()
  .min(1, "Informe o nome.")
  .max(120, "Use até 120 caracteres.")
  .refine(hasNoNul, NUL_MESSAGE);

// Optional, stored as digits; when given, a whole CPF (11) or CNPJ (14).
export const documentSchema = z
  .string()
  .refine(
    (value) => [0, 11, 14].includes(onlyDigits(value).length),
    "CNPJ ou CPF incompleto.",
  )
  .transform(onlyDigits);

// A WhatsApp: DDD and number, with or without the country code 55; optional.
export const whatsappSchema = z
  .string()
  .refine(
    (value) => /^$|^\d{10,13}$/.test(onlyDigits(value)),
    "Informe DDD e número. Ex.: (11) 98765-4321",
  )
  .transform(onlyDigits);

const supplierFields = {
  name: partyNameSchema,
  document: documentSchema,
  // The WhatsApp the order goes to.
  phone: whatsappSchema,
  // Optional; when given, the same rule as the login e-mail (trimmed, lowercase).
  email: z
    .string()
    .trim()
    .toLowerCase()
    .refine(
      (value) => value === "" || emailSchema.safeParse(value).success,
      "Informe um e-mail válido.",
    ),
  contactPerson: text(120),
  active: z.boolean("Informe se o fornecedor está ativo."),
};

export const createSupplierSchema = z.object({
  name: supplierFields.name,
  document: supplierFields.document.default(""),
  phone: supplierFields.phone.default(""),
  email: supplierFields.email.default(""),
  contactPerson: supplierFields.contactPerson.default(""),
  active: supplierFields.active.default(true),
});

// Built from the fields without defaults, or an absent field would reset the stored value.
export const updateSupplierSchema = z
  .object(supplierFields)
  .partial()
  .refine(
    (v) => Object.values(v).some((x) => x !== undefined),
    "Informe ao menos um campo para alterar.",
  );

export const supplierRowSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  document: z.string(),
  phone: z.string(),
  email: z.string(),
  contactPerson: z.string(),
  active: z.boolean(),
});

export const suppliersPageSchema = z.object({
  suppliers: z.array(supplierRowSchema),
  total: z.int(),
  page: z.int(),
  pageSize: z.int(),
});

const signalSchema = z.enum(["green", "yellow", "red"]);

// ADMIN only: what to buy, grouped by the default supplier of each product.
export const replenishmentSchema = z.object({
  groups: z.array(
    z.object({
      // Null: products without an active default supplier.
      supplier: supplierRowSchema.nullable(),
      items: z.array(
        z.object({
          productId: z.uuid(),
          barcode: z.string(),
          name: z.string(),
          unit: unitSchema,
          stock: z.int(),
          minStock: z.int(),
          // (2 × minimum) − stock, never below zero; in the unit's base (units, grams, milliliters).
          suggested: z.int(),
          nearestExpiration: z.iso.date().nullable(),
          daysLeft: z.int().nullable(),
          signal: signalSchema,
          supplierCode: z.string(),
        }),
      ),
    }),
  ),
});

// ADMIN only: products needing attention now, for the panel header.
export const stockAlertsSchema = z.object({ count: z.int() });

export type CreateSupplier = z.output<typeof createSupplierSchema>;
export type UpdateSupplier = z.output<typeof updateSupplierSchema>;
export type SupplierRow = z.infer<typeof supplierRowSchema>;
/** What the product dialog lists: active suppliers, plus a product's current inactive one. */
export type SupplierOption = Pick<SupplierRow, "id" | "name" | "active">;
export type SuppliersPage = z.infer<typeof suppliersPageSchema>;
export type Replenishment = z.infer<typeof replenishmentSchema>;
export type ReplenishmentGroup = Replenishment["groups"][number];
export type StockAlerts = z.infer<typeof stockAlertsSchema>;
