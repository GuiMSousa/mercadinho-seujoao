import { z } from "zod";
import { productUnit } from "@/infrastructure/db/schema";

// Largest value of a PostgreSQL integer column.
const MAX_INTEGER = 2_147_483_647;

const nameSchema = z
  .string("Informe o nome.")
  .trim()
  .min(1, "Informe o nome.")
  .max(120, "Use até 120 caracteres.");

export const barcodeSchema = z
  .string("Informe o código de barras.")
  .trim()
  .min(1, "Informe o código de barras.")
  .max(48, "Use até 48 caracteres.");

const centsSchema = (message: string) =>
  z.int(message).min(0, message).max(MAX_INTEGER, message);

// Quantities are integers in the unit's base: UN = units, KG = grams, L = milliliters.
const positiveQuantitySchema = z
  .int("Informe uma quantidade inteira maior que zero.")
  .min(1, "Informe uma quantidade inteira maior que zero.")
  .max(MAX_INTEGER, "Quantidade acima do limite.");

const unitSchema = z.enum(productUnit.enumValues, "Escolha a unidade.");
const uuidSchema = (message: string) => z.uuid(message);

export const categoryRowSchema = z.object({ id: z.uuid(), name: z.string() });
export const categoriesListResponseSchema = z.object({
  categories: z.array(categoryRowSchema),
});
export const createCategorySchema = z.object({ name: nameSchema });

const productFields = {
  barcode: barcodeSchema,
  name: nameSchema,
  categoryId: uuidSchema("Escolha a categoria."),
  costPrice: centsSchema("Informe o custo em centavos."),
  sellPrice: centsSchema("Informe o preço de venda em centavos."),
  minStock: centsSchema("Informe o estoque mínimo."),
  unit: unitSchema,
  active: z.boolean("Informe se o produto está ativo."),
};

export const createProductSchema = z.object({
  ...productFields,
  minStock: productFields.minStock.default(0),
  active: productFields.active.default(true),
});

// Built from the fields without defaults, or an absent field would reset the stored value.
export const updateProductSchema = z
  .object(productFields)
  .partial()
  .refine(
    (v) => Object.values(v).some((x) => x !== undefined),
    "Informe ao menos um campo para alterar.",
  );

export const productRowSchema = z.object({
  id: z.uuid(),
  barcode: z.string(),
  name: z.string(),
  categoryId: z.uuid(),
  costPrice: z.int(),
  sellPrice: z.int(),
  minStock: z.int(),
  unit: unitSchema,
  active: z.boolean(),
  stock: z.int(),
});
export const productsListResponseSchema = z.object({
  products: z.array(productRowSchema),
});

// What any session may read: never add cost, CMV or margin here (CASHIER reads this).
export const productLookupSchema = z.object({
  id: z.uuid(),
  barcode: z.string(),
  name: z.string(),
  sellPrice: z.int(),
  unit: unitSchema,
  stock: z.int(),
});

export const createBatchSchema = z.object({
  batchCode: z
    .string("Informe o código do lote.")
    .trim()
    .min(1, "Informe o código do lote.")
    .max(60, "Use até 60 caracteres."),
  // Required on purpose: null states that the item does not expire, a missing date is a mistake.
  expirationDate: z.iso
    .date(
      "Informe a validade no formato AAAA-MM-DD, ou null se o item não vence.",
    )
    .nullable(),
  quantity: positiveQuantitySchema,
});
export const batchRowSchema = z.object({
  id: z.uuid(),
  productId: z.uuid(),
  batchCode: z.string(),
  expirationDate: z.iso.date().nullable(),
  quantity: z.int(),
});

export const consumeStockSchema = z.object({
  productId: uuidSchema("Escolha o produto."),
  quantity: positiveQuantitySchema,
  reason: z
    .string("Informe o motivo.")
    .trim()
    .min(1, "Informe o motivo.")
    .max(200, "Use até 200 caracteres."),
});
export const consumeStockResponseSchema = z.object({
  allocations: z.array(z.object({ batchId: z.uuid(), quantity: z.int() })),
});

export type CreateCategory = z.output<typeof createCategorySchema>;
export type CreateProduct = z.output<typeof createProductSchema>;
export type UpdateProduct = z.output<typeof updateProductSchema>;
export type CreateBatch = z.output<typeof createBatchSchema>;
