import "server-only";
import { and, asc, eq, gt, sql } from "drizzle-orm";
import { getDb, type Tx } from "@/infrastructure/db";
import {
  inventoryBatches,
  inventoryMovements,
} from "@/infrastructure/db/schema";
import { allocatePvps } from "./pvps";

type TakeStock = {
  productId: string;
  quantity: number;
  reason: string;
  userId: string;
  /** Refuses when a batch with stock is past its date on this day: a sale passes it, a write-off does not. */
  refuseExpiredOn?: string;
};

/**
 * Inside `tx`, takes `quantity` from the batches by PVPS and records one OUT movement per batch.
 * Locking the rows makes concurrent sales queue up, so two of them cannot spend the same stock.
 * Answers "short" or "expired", writing nothing, when it cannot.
 */
export async function takeStock(tx: Tx, input: TakeStock) {
  const batches = await tx
    .select({
      id: inventoryBatches.id,
      expirationDate: inventoryBatches.expirationDate,
      createdAt: inventoryBatches.createdAt,
      quantity: inventoryBatches.quantity,
    })
    .from(inventoryBatches)
    .where(
      and(
        eq(inventoryBatches.productId, input.productId),
        gt(inventoryBatches.quantity, 0),
      ),
    )
    // A fixed lock order keeps concurrent sales of the same product from deadlocking.
    .orderBy(asc(inventoryBatches.id))
    .for("update");

  // Expired dates sort before any other, so an expired batch with stock is the next one out.
  const { refuseExpiredOn } = input;
  if (
    refuseExpiredOn &&
    batches.some(
      (batch) =>
        batch.expirationDate !== null && batch.expirationDate < refuseExpiredOn,
    )
  )
    return "expired" as const;

  const allocations = allocatePvps(batches, input.quantity);
  if (!allocations) return "short" as const;

  for (const { batchId, quantity } of allocations) {
    await tx
      .update(inventoryBatches)
      .set({ quantity: sql`${inventoryBatches.quantity} - ${quantity}` })
      .where(eq(inventoryBatches.id, batchId));
  }
  await tx.insert(inventoryMovements).values(
    allocations.map(({ batchId, quantity }) => ({
      productId: input.productId,
      batchId,
      type: "OUT" as const,
      quantity,
      reason: input.reason,
      userId: input.userId,
    })),
  );
  return allocations;
}

/** A write-off by PVPS in its own transaction: null, changing nothing, when the stock does not cover it. */
export function consumeBatches(input: Omit<TakeStock, "refuseExpiredOn">) {
  return getDb().transaction(async (tx) => {
    const taken = await takeStock(tx, input);
    return Array.isArray(taken) ? taken : null;
  });
}
