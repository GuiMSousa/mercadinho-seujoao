import "server-only";
import { and, desc, eq, gte, ilike, lt, or, sql } from "drizzle-orm";
import type { MovementsQuery } from "@/contracts/stock-history";
import { getDb } from "@/infrastructure/db";
import {
  inventoryBatches,
  inventoryMovements,
  products,
  users,
} from "@/infrastructure/db/schema";
import { STORE_TIME_ZONE } from "@/lib/store-time";
import { containsPattern } from "./repository";

const PER_PAGE = 20;

type Filters = Omit<MovementsQuery, "page">;

/** Product by name or barcode, type, and store-calendar days (local midnight to local midnight). */
function matches({ search, type, from, to }: Filters) {
  const pattern = containsPattern(search);
  return and(
    search
      ? or(ilike(products.name, pattern), ilike(products.barcode, pattern))
      : undefined,
    type ? eq(inventoryMovements.type, type) : undefined,
    from
      ? gte(
          inventoryMovements.createdAt,
          sql`(${from}::date)::timestamp AT TIME ZONE ${STORE_TIME_ZONE}`,
        )
      : undefined,
    to
      ? lt(
          inventoryMovements.createdAt,
          sql`(${to}::date + 1)::timestamp AT TIME ZONE ${STORE_TIME_ZONE}`,
        )
      : undefined,
  );
}

const countMovements = async (filters: Filters) => {
  const [row] = await getDb()
    .select({ total: sql`count(*)`.mapWith(Number) })
    .from(inventoryMovements)
    .innerJoin(products, eq(products.id, inventoryMovements.productId))
    .where(matches(filters));
  return row.total;
};

const selectMovementsPage = (
  filters: Filters,
  page: { limit: number; offset: number },
) =>
  getDb()
    .select({
      id: inventoryMovements.id,
      createdAt: inventoryMovements.createdAt,
      productId: products.id,
      productName: products.name,
      barcode: products.barcode,
      unit: products.unit,
      type: inventoryMovements.type,
      quantity: inventoryMovements.quantity,
      reason: inventoryMovements.reason,
      batchCode: inventoryBatches.batchCode,
      userName: users.name,
    })
    .from(inventoryMovements)
    .innerJoin(products, eq(products.id, inventoryMovements.productId))
    .innerJoin(users, eq(users.id, inventoryMovements.userId))
    .leftJoin(
      inventoryBatches,
      eq(inventoryBatches.id, inventoryMovements.batchId),
    )
    .where(matches(filters))
    .orderBy(desc(inventoryMovements.createdAt), desc(inventoryMovements.id))
    .limit(page.limit)
    .offset(page.offset);

/**
 * Every stock movement, newest first: batches received (IN), sales by PVPS and manual write-offs
 * (OUT) and corrections (ADJUSTMENT). A page past the end answers the last one.
 */
export async function listMovements({ page, ...filters }: MovementsQuery) {
  const total = await countMovements(filters);
  const current = Math.min(page, Math.max(1, Math.ceil(total / PER_PAGE)));
  const rows = await selectMovementsPage(filters, {
    limit: PER_PAGE,
    offset: (current - 1) * PER_PAGE,
  });
  return {
    movements: rows.map((row) => ({
      ...row,
      createdAt: row.createdAt.toISOString(),
    })),
    total,
    page: current,
    pageSize: PER_PAGE,
  };
}
