import "server-only";
import { asc, eq } from "drizzle-orm";
import type { PaymentMethod } from "@/contracts/sales";
import { takeStock } from "@/domains/inventory/stock-repository";
import { getDb } from "@/infrastructure/db";
import { saleItems, sales } from "@/infrastructure/db/schema";

export type SaleLine = {
  productId: string;
  name: string;
  unit: "UN" | "KG" | "L";
  quantity: number;
  unitPrice: number;
  unitCost: number;
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

/**
 * Records the sale, its lines and the PVPS stock takes in one transaction: all of it or nothing.
 * Throws StockRefusal when a product is short or its next batch is expired on `today`.
 * Answers null when the id is already a sale (a retry got there first).
 */
export function insertSale(sale: {
  id: string;
  userId: string;
  paymentMethod: PaymentMethod;
  total: number;
  amountReceived: number;
  change: number;
  lines: SaleLine[];
  today: string;
}) {
  const { lines, today, ...values } = sale;
  return getDb().transaction(async (tx) => {
    const [row] = await tx
      .insert(sales)
      .values(values)
      .onConflictDoNothing({ target: sales.id })
      .returning({ number: sales.number });
    if (!row) return null;
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
    return row;
  });
}

/** The sale with its lines in the order they were rung up; no cost column. */
export async function selectSale(id: string) {
  const [sale] = await getDb()
    .select({
      id: sales.id,
      number: sales.number,
      userId: sales.userId,
      paymentMethod: sales.paymentMethod,
      total: sales.total,
      amountReceived: sales.amountReceived,
      change: sales.change,
      createdAt: sales.createdAt,
    })
    .from(sales)
    .where(eq(sales.id, id));
  if (!sale) return undefined;
  const items = await getDb()
    .select({
      productId: saleItems.productId,
      name: saleItems.name,
      unit: saleItems.unit,
      quantity: saleItems.quantity,
      unitPrice: saleItems.unitPrice,
      total: saleItems.total,
    })
    .from(saleItems)
    .where(eq(saleItems.saleId, id))
    .orderBy(asc(saleItems.line));
  return { ...sale, items };
}
