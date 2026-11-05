import { z } from "zod";
import { PAYMENT_METHODS, PRODUCT_UNITS } from "./enums";
import { MAX_INTEGER, unitSchema } from "./inventory";

type Unit = (typeof PRODUCT_UNITS)[number];

// 1 t or 1 m³ in grams/milliliters: keeps price × quantity well inside exact integer math.
const MAX_SALE_QUANTITY = 1_000_000;
const MAX_SALE_LINES = 200;

/**
 * Amount of one sale line in cents. UN prices are per unit; KG and L prices are per kg or L,
 * with the quantity in grams or milliliters, rounded half up to the cent. The sale total is
 * the sum of the rounded lines (PRODUCT.md).
 */
export function lineTotal(price: number, quantity: number, unit: Unit) {
  return unit === "UN"
    ? price * quantity
    : Math.round((price * quantity) / 1000);
}

const amountSchema = (message: string) =>
  z.int(message).min(0, message).max(MAX_INTEGER, "Valor acima do limite.");

export const paymentMethodSchema = z.enum(
  PAYMENT_METHODS,
  "Escolha a forma de pagamento.",
);

export const createSaleSchema = z
  .object({
    // Chosen by the client: repeating it after a lost response answers the sale already made.
    id: z.uuid("Identificador da venda inválido."),
    items: z
      .array(
        z.object({
          productId: z.uuid("Produto inválido."),
          quantity: z
            .int("Informe uma quantidade inteira maior que zero.")
            .min(1, "Informe uma quantidade inteira maior que zero.")
            .max(MAX_SALE_QUANTITY, "Quantidade acima do limite."),
        }),
        "Adicione ao menos um item.",
      )
      .min(1, "Adicione ao menos um item.")
      .max(MAX_SALE_LINES, `Use até ${MAX_SALE_LINES} itens por venda.`)
      .refine(
        (items) =>
          new Set(items.map((item) => item.productId)).size === items.length,
        "Cada produto entra uma vez na venda; some as quantidades.",
      ),
    paymentMethod: paymentMethodSchema,
    // The total the operator saw: if a price changed meanwhile, the sale is refused, not charged differently.
    total: amountSchema("Informe o total em centavos."),
    // Cash only: what the customer handed over, which the change comes from.
    amountReceived: amountSchema(
      "Informe o valor recebido em centavos.",
    ).optional(),
  })
  .refine(
    (sale) =>
      sale.paymentMethod !== "CASH" || sale.amountReceived !== undefined,
    { path: ["amountReceived"], message: "Informe o valor recebido." },
  );

// What the receipt shows; never add cost, CMV or margin here (CASHIER reads this).
export const saleReceiptSchema = z.object({
  id: z.uuid(),
  number: z.int(),
  createdAt: z.iso.datetime(),
  paymentMethod: paymentMethodSchema,
  total: z.int(),
  amountReceived: z.int(),
  change: z.int(),
  items: z.array(
    z.object({
      productId: z.uuid(),
      name: z.string(),
      unit: unitSchema,
      quantity: z.int(),
      unitPrice: z.int(),
      total: z.int(),
    }),
  ),
});

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];
export type CreateSale = z.output<typeof createSaleSchema>;
export type SaleReceipt = z.infer<typeof saleReceiptSchema>;
