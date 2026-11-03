import "server-only";
import { and, asc, eq, gt, sql } from "drizzle-orm";
import type {
  CreateBatch,
  CreateProduct,
  UpdateProduct,
} from "@/contracts/inventory";
import { getDb } from "@/infrastructure/db";
import {
  categories,
  inventoryBatches,
  inventoryMovements,
  products,
} from "@/infrastructure/db/schema";
import { allocatePvps } from "./pvps";

const categoryRow = { id: categories.id, name: categories.name };

const productColumns = {
  id: products.id,
  barcode: products.barcode,
  name: products.name,
  categoryId: products.categoryId,
  costPrice: products.costPrice,
  sellPrice: products.sellPrice,
  minStock: products.minStock,
  unit: products.unit,
  active: products.active,
};

const stock = sql<number>`coalesce(sum(${inventoryBatches.quantity}), 0)::int`;

export function selectCategories() {
  return getDb()
    .select(categoryRow)
    .from(categories)
    .orderBy(asc(categories.name));
}

export async function insertCategory(name: string) {
  const [row] = await getDb()
    .insert(categories)
    .values({ name })
    .returning(categoryRow);
  return row;
}

export async function categoryExists(id: string) {
  const [row] = await getDb()
    .select({ id: categories.id })
    .from(categories)
    .where(eq(categories.id, id));
  return row !== undefined;
}

// shortcut: no pagination, a small store has a few thousand products; add a cursor when the catalog screen needs one.
export function selectProducts() {
  return getDb()
    .select({ ...productColumns, stock })
    .from(products)
    .leftJoin(inventoryBatches, eq(inventoryBatches.productId, products.id))
    .groupBy(products.id)
    .orderBy(asc(products.name));
}

export async function selectProduct(id: string) {
  const [row] = await getDb()
    .select({ ...productColumns, stock })
    .from(products)
    .leftJoin(inventoryBatches, eq(inventoryBatches.productId, products.id))
    .where(eq(products.id, id))
    .groupBy(products.id);
  return row as typeof row | undefined;
}

/** Selects no cost column, so the sale screen cannot leak it. */
export async function selectActiveProductByBarcode(barcode: string) {
  const [row] = await getDb()
    .select({
      id: products.id,
      barcode: products.barcode,
      name: products.name,
      sellPrice: products.sellPrice,
      unit: products.unit,
      stock,
    })
    .from(products)
    .leftJoin(inventoryBatches, eq(inventoryBatches.productId, products.id))
    .where(and(eq(products.barcode, barcode), eq(products.active, true)))
    .groupBy(products.id);
  return row as typeof row | undefined;
}

export async function insertProduct(values: CreateProduct) {
  const [row] = await getDb()
    .insert(products)
    .values(values)
    .returning(productColumns);
  return row;
}

export async function updateProductRow(id: string, values: UpdateProduct) {
  const [row] = await getDb()
    .update(products)
    .set(values)
    .where(eq(products.id, id))
    .returning({ id: products.id });
  return row as typeof row | undefined;
}

/** A batch and its IN movement land together or not at all. */
export function insertBatchWithMovement(
  productId: string,
  values: CreateBatch,
  userId: string,
) {
  return getDb().transaction(async (tx) => {
    const [batch] = await tx
      .insert(inventoryBatches)
      .values({ ...values, productId })
      .returning({
        id: inventoryBatches.id,
        productId: inventoryBatches.productId,
        batchCode: inventoryBatches.batchCode,
        expirationDate: inventoryBatches.expirationDate,
        quantity: inventoryBatches.quantity,
      });
    await tx.insert(inventoryMovements).values({
      productId,
      batchId: batch.id,
      type: "IN",
      quantity: values.quantity,
      reason: `Entrada do lote ${values.batchCode}`,
      userId,
    });
    return batch;
  });
}

/**
 * Takes `quantity` from the batches by PVPS and records one OUT movement per batch.
 * Locking the rows makes concurrent sales queue up, so two of them cannot spend the same stock.
 * Returns null, changing nothing, when the stock does not cover it.
 */
export function consumeBatches(input: {
  productId: string;
  quantity: number;
  reason: string;
  userId: string;
}) {
  return getDb().transaction(async (tx) => {
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

    const allocations = allocatePvps(batches, input.quantity);
    if (!allocations) return null;

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
  });
}
