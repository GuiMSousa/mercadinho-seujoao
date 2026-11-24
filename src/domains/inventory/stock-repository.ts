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
  /** Recorded on every movement: the client's id of a write-off. */
  operationId?: string;
  /** ADJUSTMENT records the quantity negative: the history tells gains from losses by the sign. */
  type?: "OUT" | "ADJUSTMENT";
  /** Takes only batches past their date on this day (an expiry adjustment); short otherwise. */
  onlyExpiredOn?: string;
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

  const { onlyExpiredOn } = input;
  const allocations = allocatePvps(
    onlyExpiredOn
      ? batches.filter(
          (batch) =>
            batch.expirationDate !== null &&
            batch.expirationDate < onlyExpiredOn,
        )
      : batches,
    input.quantity,
  );
  if (!allocations) return "short" as const;

  for (const { batchId, quantity } of allocations) {
    await tx
      .update(inventoryBatches)
      .set({ quantity: sql`${inventoryBatches.quantity} - ${quantity}` })
      .where(eq(inventoryBatches.id, batchId));
  }
  const type = input.type ?? "OUT";
  await tx.insert(inventoryMovements).values(
    allocations.map(({ batchId, quantity }) => ({
      productId: input.productId,
      batchId,
      type,
      quantity: type === "ADJUSTMENT" ? -quantity : quantity,
      reason: input.reason,
      userId: input.userId,
      operationId: input.operationId,
    })),
  );
  return allocations;
}

/**
 * A write-off by PVPS in its own transaction: null, changing nothing, when the stock does not cover it.
 * With `operationId`, a repeated id answers the write-off already recorded and takes nothing again,
 * or "conflict" when that id holds a different write-off.
 */
export function consumeBatches(input: Omit<TakeStock, "refuseExpiredOn">) {
  return getDb().transaction(async (tx) => {
    const { operationId } = input;
    if (operationId) {
      // Two requests with the same id at once: the second waits here, then finds the first one's rows.
      await tx.execute(
        sql`SELECT pg_advisory_xact_lock(hashtextextended(${operationId}, 0))`,
      );
      const done = await tx
        .select({
          batchId: inventoryMovements.batchId,
          quantity: inventoryMovements.quantity,
          productId: inventoryMovements.productId,
          reason: inventoryMovements.reason,
          userId: inventoryMovements.userId,
          type: inventoryMovements.type,
        })
        .from(inventoryMovements)
        .innerJoin(
          inventoryBatches,
          eq(inventoryBatches.id, inventoryMovements.batchId),
        )
        .where(eq(inventoryMovements.operationId, operationId))
        // The PVPS order of the first answer: one write-off's movements share their timestamp.
        .orderBy(
          sql`${inventoryBatches.expirationDate} ASC NULLS LAST`,
          asc(inventoryBatches.createdAt),
          asc(inventoryBatches.id),
        );
      if (done.length > 0) {
        const same = done.every(
          (row) =>
            row.productId === input.productId &&
            row.reason === input.reason &&
            row.userId === input.userId &&
            row.type === (input.type ?? "OUT"),
        );
        // An ADJUSTMENT out is stored negative; the answer, like the request, is positive.
        const taken = done.map((row) => ({
          // Write-off movements always name their batch.
          batchId: row.batchId as string,
          quantity: Math.abs(row.quantity),
        }));
        const total = taken.reduce((sum, row) => sum + row.quantity, 0);
        if (!same || total !== input.quantity) return "conflict" as const;
        return taken;
      }
    }
    const taken = await takeStock(tx, input);
    return Array.isArray(taken) ? taken : null;
  });
}
