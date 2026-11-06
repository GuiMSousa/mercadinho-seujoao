import "server-only";
import { and, asc, eq, exists, gt, ilike, inArray, or, sql } from "drizzle-orm";
import type { CreateBatch, CreateProduct } from "@/contracts/inventory";
import { getDb } from "@/infrastructure/db";
import {
  categories,
  inventoryBatches,
  inventoryMovements,
  products,
} from "@/infrastructure/db/schema";

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

// A bigint: each batch fits an integer, but their sum may not.
const stock = sql`coalesce(sum(${inventoryBatches.quantity}), 0)`.mapWith(
  Number,
);

/** Whether a batch with stock is past its date on `today`; such a batch is always the first PVPS takes. */
const hasExpired = (today: string) =>
  sql<boolean>`coalesce(bool_or(${inventoryBatches.quantity} > 0 AND ${inventoryBatches.expirationDate} < ${today}), false)`;

// The default supplier and its code. Explicit names: the subquery must read the outer product.
const defaultSupplier = (column: "supplier_id" | "supplier_code") =>
  sql.raw(
    `(SELECT ps.${column} FROM product_suppliers ps WHERE ps.product_id = "products"."id" AND ps.is_default)`,
  );
const supplierColumns = {
  defaultSupplierId: sql<string | null>`${defaultSupplier("supplier_id")}`,
  supplierCode: sql<string>`coalesce(${defaultSupplier("supplier_code")}, '')`,
};

// Batches are never deleted, so this also tells whether the product has any history.
const hasBatches = sql<boolean>`count(${inventoryBatches.id}) > 0`;

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

type ProductScope = {
  search: string;
  /** Leaves out discontinued products, unless some of their stock is still on the shelf. */
  inUseOnly: boolean;
};

/** ILIKE pattern for "contains": what the person typed is literal text, not LIKE wildcards. */
export const containsPattern = (search: string) =>
  `%${search.replace(/[\\%_]/g, "\\$&")}%`;

function matches(search: string) {
  const pattern = containsPattern(search);
  return or(ilike(products.name, pattern), ilike(products.barcode, pattern));
}

function inScope({ search, inUseOnly }: ProductScope) {
  return and(
    search ? matches(search) : undefined,
    inUseOnly
      ? or(
          eq(products.active, true),
          exists(
            getDb()
              .select({ id: inventoryBatches.id })
              .from(inventoryBatches)
              .where(
                and(
                  eq(inventoryBatches.productId, products.id),
                  gt(inventoryBatches.quantity, 0),
                ),
              ),
          ),
        )
      : undefined,
  );
}

export function countProducts(scope: ProductScope) {
  return getDb().$count(products, inScope(scope));
}

export function selectProductsPage(
  scope: ProductScope,
  page: { limit: number; offset: number },
) {
  return getDb()
    .select({ ...productColumns, stock, hasBatches, ...supplierColumns })
    .from(products)
    .leftJoin(inventoryBatches, eq(inventoryBatches.productId, products.id))
    .where(inScope(scope))
    .groupBy(products.id)
    .orderBy(asc(products.name), asc(products.id))
    .limit(page.limit)
    .offset(page.offset);
}

const batchRow = {
  id: inventoryBatches.id,
  productId: inventoryBatches.productId,
  batchCode: inventoryBatches.batchCode,
  expirationDate: inventoryBatches.expirationDate,
  quantity: inventoryBatches.quantity,
};

/** Batches that still hold stock, in the order PVPS consumes them. */
export function selectBatchesWithStock(productIds: string[]) {
  return getDb()
    .select(batchRow)
    .from(inventoryBatches)
    .where(
      and(
        inArray(inventoryBatches.productId, productIds),
        gt(inventoryBatches.quantity, 0),
      ),
    )
    .orderBy(
      sql`${inventoryBatches.expirationDate} ASC NULLS LAST`,
      asc(inventoryBatches.createdAt),
      asc(inventoryBatches.id),
    );
}

export async function selectProduct(id: string) {
  const [row] = await getDb()
    .select({ ...productColumns, stock, hasBatches, ...supplierColumns })
    .from(products)
    .leftJoin(inventoryBatches, eq(inventoryBatches.productId, products.id))
    .where(eq(products.id, id))
    .groupBy(products.id);
  return row as typeof row | undefined;
}

/** Products as the sale screen sees them. Selects no cost column, so it cannot leak. */
function selectForSale(today: string) {
  return getDb()
    .select({
      id: products.id,
      barcode: products.barcode,
      name: products.name,
      sellPrice: products.sellPrice,
      unit: products.unit,
      stock,
      expired: hasExpired(today),
    })
    .from(products)
    .leftJoin(inventoryBatches, eq(inventoryBatches.productId, products.id))
    .groupBy(products.id)
    .$dynamic();
}

export async function selectActiveProductByBarcode(
  barcode: string,
  today: string,
) {
  const [row] = await selectForSale(today).where(
    and(eq(products.barcode, barcode), eq(products.active, true)),
  );
  return row as typeof row | undefined;
}

export function searchActiveProducts(
  search: string,
  today: string,
  limit: number,
) {
  return selectForSale(today)
    .where(and(matches(search), eq(products.active, true)))
    .orderBy(asc(products.name), asc(products.id))
    .limit(limit);
}

/** What a sale records for each product: price and cost now, so later edits leave it alone. */
export function selectProductsForSale(ids: string[]) {
  return getDb()
    .select({
      id: products.id,
      name: products.name,
      unit: products.unit,
      sellPrice: products.sellPrice,
      costPrice: products.costPrice,
      active: products.active,
    })
    .from(products)
    .where(inArray(products.id, ids));
}

type ProductValues = Omit<CreateProduct, "defaultSupplierId" | "supplierCode">;

export async function insertProduct(values: ProductValues) {
  const [row] = await getDb()
    .insert(products)
    .values(values)
    .returning(productColumns);
  return row;
}

export async function updateProductRow(
  id: string,
  values: Partial<ProductValues>,
) {
  const [row] = await getDb()
    .update(products)
    .set(values)
    .where(eq(products.id, id))
    .returning({ id: products.id, name: products.name });
  return row as typeof row | undefined;
}

/**
 * A batch and its IN movement land together or not at all. An id chosen by the client makes a
 * retry after a lost response safe: the same entry answers the batch that exists and adds no stock.
 * Answers undefined when the id already holds a different entry, or a batch of another product.
 */
export function insertBatchWithMovement(
  productId: string,
  values: CreateBatch,
  userId: string,
) {
  return getDb().transaction(async (tx) => {
    const [batch] = await tx
      .insert(inventoryBatches)
      .values({ ...values, productId })
      .onConflictDoNothing({ target: inventoryBatches.id })
      .returning(batchRow);
    if (!batch) {
      const [existing] = await tx
        .select({ ...batchRow, received: inventoryMovements.quantity })
        .from(inventoryBatches)
        .innerJoin(
          inventoryMovements,
          and(
            eq(inventoryMovements.batchId, inventoryBatches.id),
            eq(inventoryMovements.type, "IN"),
          ),
        )
        .where(
          and(
            // Only an id sent by the client can conflict.
            eq(inventoryBatches.id, values.id as string),
            eq(inventoryBatches.productId, productId),
          ),
        );
      // The batch quantity may already be consumed, so the entry is compared by what came in.
      const sameEntry =
        existing?.batchCode === values.batchCode &&
        existing.expirationDate === values.expirationDate &&
        existing.received === values.quantity;
      return sameEntry ? existing : undefined;
    }
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
