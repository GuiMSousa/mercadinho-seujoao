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

const paymentSchema = z.object({
  method: paymentMethodSchema,
  // What was handed over in this method; only cash may exceed its share (the excess is the change).
  amount: z
    .int("Informe o valor em centavos.")
    .min(1, "Informe um valor maior que zero.")
    .max(MAX_INTEGER, "Valor acima do limite."),
});

export type Payment = z.infer<typeof paymentSchema>;

/**
 * Each method's share of `total` from what was handed over. Only cash gives change, and the change
 * is taken from it: a cash row keeps what stays in the drawer. The screen and the server share it.
 */
export function settlePayments(total: number, payments: Payment[]) {
  const received = payments.reduce((sum, payment) => sum + payment.amount, 0);
  if (received < total)
    return {
      ok: false as const,
      message: "Os pagamentos não cobrem o total da venda.",
    };
  if (received > MAX_INTEGER)
    return { ok: false as const, message: "Valor acima do limite." };
  const change = received - total;
  const cash = payments.find((payment) => payment.method === "CASH");
  if (change > 0 && (!cash || change >= cash.amount))
    return {
      ok: false as const,
      message:
        "Só o dinheiro tem troco, e o troco não passa do dinheiro recebido.",
    };
  return {
    ok: true as const,
    received,
    change,
    payments: payments.map((payment) =>
      payment.method === "CASH"
        ? { ...payment, amount: payment.amount - change }
        : payment,
    ),
  };
}

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
    // In cents, off the sum of the lines; a percentage is worked out on the screen.
    discount: amountSchema("Informe o desconto em centavos.").default(0),
    // What the operator saw to pay (lines minus discount): if a price changed meanwhile, the sale
    // is refused, not charged differently.
    total: amountSchema("Informe o total em centavos."),
    // Empty only when the total is zero.
    payments: z
      .array(paymentSchema, "Informe os pagamentos.")
      .max(PAYMENT_METHODS.length)
      .refine(
        (payments) =>
          new Set(payments.map((payment) => payment.method)).size ===
          payments.length,
        "Use cada forma de pagamento uma vez; some os valores.",
      ),
    // The fiado customer: required with an ON_ACCOUNT payment, and only then.
    customerId: z.uuid("Cliente inválido.").optional(),
  })
  .refine(
    (sale) =>
      sale.customerId !== undefined ||
      !sale.payments.some((payment) => payment.method === "ON_ACCOUNT"),
    { path: ["customerId"], message: "Escolha o cliente do fiado." },
  )
  .refine(
    (sale) =>
      sale.customerId === undefined ||
      sale.payments.some((payment) => payment.method === "ON_ACCOUNT"),
    {
      path: ["customerId"],
      message: "O cliente só entra numa venda com fiado.",
    },
  );

// What the receipt shows; never add cost, CMV or margin here (CASHIER reads this).
export const saleReceiptSchema = z.object({
  id: z.uuid(),
  number: z.int(),
  createdAt: z.iso.datetime(),
  discount: z.int(),
  total: z.int(),
  // Everything handed over (payments plus change); the change came out of the cash.
  amountReceived: z.int(),
  change: z.int(),
  // Each method's share of the total; the cash row is what stayed in the drawer.
  payments: z.array(z.object({ method: paymentMethodSchema, amount: z.int() })),
  customerName: z.string().nullable(),
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

/** How each method reads on screen, on receipts and in e-mails. */
export const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  CASH: "Dinheiro",
  PIX: "Pix",
  DEBIT: "Cartão de débito",
  CREDIT: "Cartão de crédito",
  ON_ACCOUNT: "Fiado",
};
export type CreateSale = z.output<typeof createSaleSchema>;
export type SaleReceipt = z.infer<typeof saleReceiptSchema>;
