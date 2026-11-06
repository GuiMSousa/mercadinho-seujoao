import "server-only";
import { and, asc, eq, ilike, or, sql } from "drizzle-orm";
import type { CreateSupplier, UpdateSupplier } from "@/contracts/suppliers";
import { containsPattern } from "@/domains/inventory/repository";
import { getDb } from "@/infrastructure/db";
import {
  inventoryBatches,
  products,
  productSuppliers,
  suppliers,
} from "@/infrastructure/db/schema";

const supplierRow = {
  id: suppliers.id,
  name: suppliers.name,
  document: suppliers.document,
  phone: suppliers.phone,
  email: suppliers.email,
  contactPerson: suppliers.contactPerson,
  active: suppliers.active,
};

const matches = (search: string) => {
  const pattern = containsPattern(search);
  return search
    ? or(
        ilike(suppliers.name, pattern),
        ilike(suppliers.contactPerson, pattern),
        ilike(suppliers.document, pattern),
      )
    : undefined;
};

export const countSuppliers = (search: string) =>
  getDb().$count(suppliers, matches(search));

export function selectSuppliersPage(
  search: string,
  page: { limit: number; offset: number },
) {
  return getDb()
    .select(supplierRow)
    .from(suppliers)
    .where(matches(search))
    .orderBy(asc(suppliers.name), asc(suppliers.id))
    .limit(page.limit)
    .offset(page.offset);
}

/** Every supplier, by name: the product dialog lists the active ones and keeps a current inactive one. */
export function selectSupplierOptions() {
  return getDb()
    .select({
      id: suppliers.id,
      name: suppliers.name,
      active: suppliers.active,
    })
    .from(suppliers)
    .orderBy(asc(suppliers.name), asc(suppliers.id));
}

export async function selectSupplier(id: string) {
  const [row] = await getDb()
    .select(supplierRow)
    .from(suppliers)
    .where(eq(suppliers.id, id));
  return row as typeof row | undefined;
}

export async function insertSupplier(values: CreateSupplier) {
  const [row] = await getDb()
    .insert(suppliers)
    .values(values)
    .returning(supplierRow);
  return row;
}

export async function updateSupplierRow(id: string, values: UpdateSupplier) {
  const [row] = await getDb()
    .update(suppliers)
    .set(values)
    .where(eq(suppliers.id, id))
    .returning(supplierRow);
  return row as typeof row | undefined;
}

/**
 * Makes `supplierId` the product's only default supplier, with its code; null leaves it without one.
 * `supplierCode` undefined keeps the code already recorded for that pair (empty for a new one).
 * The product row is locked FOR NO KEY UPDATE: two editors queue up instead of colliding on the
 * unique index, while sales and batches that only reference the product are not held.
 */
export function setDefaultSupplier(
  productId: string,
  supplierId: string | null,
  supplierCode?: string,
) {
  return getDb().transaction(async (tx) => {
    await tx
      .select({ id: products.id })
      .from(products)
      .where(eq(products.id, productId))
      .for("no key update");
    await tx
      .update(productSuppliers)
      .set({ isDefault: false })
      .where(
        and(
          eq(productSuppliers.productId, productId),
          eq(productSuppliers.isDefault, true),
        ),
      );
    if (!supplierId) return;
    await tx
      .insert(productSuppliers)
      .values({
        productId,
        supplierId,
        isDefault: true,
        supplierCode: supplierCode ?? "",
      })
      .onConflictDoUpdate({
        target: [productSuppliers.productId, productSuppliers.supplierId],
        set: {
          isDefault: true,
          ...(supplierCode !== undefined && { supplierCode }),
        },
      });
  });
}

/**
 * Active products at or below their minimum, or with a batch in stock expiring by `horizon`
 * (expired ones included), with their stock, nearest expiration and default supplier.
 */
export function selectReplenishmentRows(horizon: string) {
  const stock = sql`coalesce(sum(${inventoryBatches.quantity}), 0)`;
  // As text: a calendar date must not become a JS Date at some time zone's midnight.
  const nearest = sql`(min(${inventoryBatches.expirationDate}) FILTER (WHERE ${inventoryBatches.quantity} > 0))::text`;
  return getDb()
    .select({
      productId: products.id,
      barcode: products.barcode,
      name: products.name,
      unit: products.unit,
      minStock: products.minStock,
      stock: stock.mapWith(Number),
      nearestExpiration: nearest.mapWith(String),
      supplierCode: sql`coalesce(${productSuppliers.supplierCode}, '')`.mapWith(
        String,
      ),
      supplier: supplierRow,
    })
    .from(products)
    .leftJoin(inventoryBatches, eq(inventoryBatches.productId, products.id))
    .leftJoin(
      productSuppliers,
      and(
        eq(productSuppliers.productId, products.id),
        eq(productSuppliers.isDefault, true),
      ),
    )
    .leftJoin(suppliers, eq(suppliers.id, productSuppliers.supplierId))
    .where(eq(products.active, true))
    .groupBy(products.id, productSuppliers.supplierCode, suppliers.id)
    .having(
      sql`${stock} <= ${products.minStock} OR (min(${inventoryBatches.expirationDate}) FILTER (WHERE ${inventoryBatches.quantity} > 0)) <= ${horizon}::date`,
    )
    .orderBy(asc(products.name), asc(products.id));
}
