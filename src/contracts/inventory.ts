import { z } from "zod";
import { PRODUCT_UNITS } from "./enums";

// Largest value of a PostgreSQL integer column.
const MAX_INTEGER = 2_147_483_647;

// PostgreSQL text cannot hold NUL, so it must be refused here and not become a 500.
const hasNoNul = (value: string) => !value.includes("\0");
const NUL_MESSAGE = "Use apenas texto.";

const nameSchema = z
  .string("Informe o nome.")
  .trim()
  .min(1, "Informe o nome.")
  .max(120, "Use até 120 caracteres.")
  .refine(hasNoNul, NUL_MESSAGE);

export const barcodeSchema = z
  .string("Informe o código de barras.")
  .trim()
  .min(1, "Informe o código de barras.")
  .max(48, "Use até 48 caracteres.")
  .refine(hasNoNul, NUL_MESSAGE);

const centsSchema = (message: string) =>
  z.int(message).min(0, message).max(MAX_INTEGER, "Valor acima do limite.");

// Quantities are integers in the unit's base: UN = units, KG = grams, L = milliliters.
const positiveQuantitySchema = z
  .int("Informe uma quantidade inteira maior que zero.")
  .min(1, "Informe uma quantidade inteira maior que zero.")
  .max(MAX_INTEGER, "Quantidade acima do limite.");

export const UNIT_LOCKED_MESSAGE =
  "A unidade não muda depois da primeira entrada de lote. Cadastre outro produto.";

const unitSchema = z.enum(PRODUCT_UNITS, "Escolha a unidade.");

export const categoryRowSchema = z.object({ id: z.uuid(), name: z.string() });
export const categoriesListResponseSchema = z.object({
  categories: z.array(categoryRowSchema),
});
export const createCategorySchema = z.object({ name: nameSchema });

const productFields = {
  barcode: barcodeSchema,
  name: nameSchema,
  categoryId: z.uuid("Escolha a categoria."),
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
  hasBatches: z.boolean(),
});

// Search and page of a server-paginated list, read from the query string.
export const listQuerySchema = z.object({
  search: z.string().trim().max(120).refine(hasNoNul).default(""),
  page: z.coerce.number().int().min(1).default(1),
});
const pageFields = { total: z.int(), page: z.int(), pageSize: z.int() };

export const productsPageSchema = z.object({
  products: z.array(productRowSchema),
  ...pageFields,
});

const signalSchema = z.enum(["green", "yellow", "red"]);

// The batches of a product with their semaphore; only ones that still hold stock are listed.
export const inventoryProductSchema = z.object({
  id: z.uuid(),
  barcode: z.string(),
  name: z.string(),
  unit: unitSchema,
  minStock: z.int(),
  active: z.boolean(),
  stock: z.int(),
  signal: signalSchema,
  batches: z.array(
    z.object({
      id: z.uuid(),
      batchCode: z.string(),
      expirationDate: z.iso.date().nullable(),
      quantity: z.int(),
      daysLeft: z.int().nullable(),
      signal: signalSchema,
    }),
  ),
});
export const inventoryPageSchema = z.object({
  products: z.array(inventoryProductSchema),
  ...pageFields,
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

export const EARLIEST_EXPIRATION = "2000-01-01";

export const createBatchSchema = z.object({
  // Optional, chosen by the client: repeating it after a lost response does not enter the stock twice.
  id: z.uuid("Identificador do lote inválido.").optional(),
  batchCode: z
    .string("Informe o código do lote.")
    .trim()
    .min(1, "Informe o código do lote.")
    .max(60, "Use até 60 caracteres.")
    .refine(hasNoNul, NUL_MESSAGE),
  // Required on purpose: null states that the item does not expire, a missing date is a mistake.
  expirationDate: z.iso
    .date(
      "Informe a validade no formato AAAA-MM-DD, ou null se o item não vence.",
    )
    // A mistyped year (0026) would sit at the front of PVPS, and batches cannot be edited.
    .refine((date) => date >= EARLIEST_EXPIRATION, "Confira o ano da validade.")
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
  productId: z.uuid("Escolha o produto."),
  quantity: positiveQuantitySchema,
  reason: z
    .string("Informe o motivo.")
    .trim()
    .min(1, "Informe o motivo.")
    .max(200, "Use até 200 caracteres.")
    .refine(hasNoNul, NUL_MESSAGE),
});
export const consumeStockResponseSchema = z.object({
  allocations: z.array(z.object({ batchId: z.uuid(), quantity: z.int() })),
});

export type CategoryRow = z.infer<typeof categoryRowSchema>;
export type ProductRow = z.infer<typeof productRowSchema>;
export type ListQuery = z.output<typeof listQuerySchema>;
export type ProductsPage = z.infer<typeof productsPageSchema>;
export type InventoryPage = z.infer<typeof inventoryPageSchema>;
export type InventoryProduct = z.infer<typeof inventoryProductSchema>;
export type InventoryBatch = InventoryProduct["batches"][number];
export type CreateCategory = z.output<typeof createCategorySchema>;
export type CreateProduct = z.output<typeof createProductSchema>;
export type UpdateProduct = z.output<typeof updateProductSchema>;
export type CreateBatch = z.output<typeof createBatchSchema>;
