import "server-only";
import { asc, eq } from "drizzle-orm";
import type { Payment } from "@/contracts/sales";
import { lockOpenSession } from "@/domains/cash/repository";
import { chargeCustomer } from "@/domains/customers/repository";
import { takeStock } from "@/domains/inventory/stock-repository";
import { getDb } from "@/infrastructure/db";
import {
  customers,
  saleItems,
  salePayments,
  sales,
} from "@/infrastructure/db/schema";

export type SaleLine = {
  productId: string;
  name: string;
  unit: "UN" | "KG" | "L";
  quantity: number;
  unitPrice: number;
  unitCost: number;
  discount: number;
  total: number;
  cost: number;
};

/** A product the sale could not take from the shelf; the whole sale was rolled back. */
export class StockRefusal extends Error {
  constructor(
    readonly reason: "short" | "expired",
    readonly productId: string,
  ) {
    super(`Stock refused (${reason}) for product ${productId}`);
  }
}

/** The fiado customer is inactive, gone or would pass the credit limit; the sale was rolled back. */
export class CreditRefusal extends Error {
  constructor() {
    super("Credit refused");
  }
}

/** No cash session is open; the sale was not recorded. */
export class CashClosed extends Error {
  constructor() {
    super("Cash closed");
  }
}

/**
 * Records the sale, its lines, payments, the fiado debt and the PVPS stock takes in one transaction:
 * all of it or nothing. Throws CashClosed without an open drawer, CreditRefusal when the fiado does
 * not fit the customer, and StockRefusal when a product is short or its next batch is expired on
 * `today`.
 * Answers null when the id is already a sale (a retry got there first).
 */
export function insertSale(sale: {
  id: string;
  userId: string;
  customerId: string | null;
  discount: number;
  total: number;
  amountReceived: number;
  change: number;
  /** Each method's share of the total (cash net of the change). */
  payments: Payment[];
  lines: SaleLine[];
  today: string;
}) {
  const { lines, payments, today, ...values } = sale;
  return getDb().transaction(async (tx) => {
    // Held to the end: a closing waits for this sale, so its expected amount includes it.
    const cash = await lockOpenSession(tx);
    if (!cash) throw new CashClosed();
    const [row] = await tx
      .insert(sales)
      .values({ ...values, cashSessionId: cash.id })
      .onConflictDoNothing({ target: sales.id })
      .returning({ number: sales.number });
    if (!row) return null;
    const onAccount = payments.find(
      (payment) => payment.method === "ON_ACCOUNT",
    );
    if (
      onAccount &&
      sale.customerId &&
      !(await chargeCustomer(tx, {
        customerId: sale.customerId,
        saleId: sale.id,
        amount: onAccount.amount,
        userId: sale.userId,
      }))
    )
      throw new CreditRefusal();
    // One product order for every sale, so two sales sharing products cannot deadlock.
    for (const line of lines.toSorted((a, b) =>
      a.productId.localeCompare(b.productId),
    )) {
      const taken = await takeStock(tx, {
        productId: line.productId,
        quantity: line.quantity,
        reason: `Venda nº ${row.number}`,
        userId: sale.userId,
        refuseExpiredOn: today,
      });
      if (!Array.isArray(taken)) throw new StockRefusal(taken, line.productId);
    }
    await tx.insert(saleItems).values(
      lines.map((line, index) => ({
        saleId: sale.id,
        line: index + 1,
        ...line,
      })),
    );
    if (payments.length > 0)
      await tx
        .insert(salePayments)
        .values(payments.map((payment) => ({ saleId: sale.id, ...payment })));
    return row;
  });
}

/** The sale with its lines in the order they were rung up and its payments; no cost column. */
export async function selectSale(id: string) {
  const [sale] = await getDb()
    .select({
      id: sales.id,
      number: sales.number,
      userId: sales.userId,
      customerId: sales.customerId,
      customerName: customers.name,
      discount: sales.discount,
      total: sales.total,
      amountReceived: sales.amountReceived,
      change: sales.change,
      createdAt: sales.createdAt,
    })
    .from(sales)
    .leftJoin(customers, eq(customers.id, sales.customerId))
    .where(eq(sales.id, id));
  if (!sale) return undefined;
  const items = await getDb()
    .select({
      productId: saleItems.productId,
      name: saleItems.name,
      unit: saleItems.unit,
      quantity: saleItems.quantity,
      unitPrice: saleItems.unitPrice,
      discount: saleItems.discount,
      total: saleItems.total,
    })
    .from(saleItems)
    .where(eq(saleItems.saleId, id))
    .orderBy(asc(saleItems.line));
  const payments = await getDb()
    .select({ method: salePayments.method, amount: salePayments.amount })
    .from(salePayments)
    .where(eq(salePayments.saleId, id))
    .orderBy(asc(salePayments.method));
  return { ...sale, items, payments };
}
