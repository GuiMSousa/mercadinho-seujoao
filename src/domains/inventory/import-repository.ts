import "server-only";
import { eq, inArray, sql } from "drizzle-orm";
import { UNIT_LOCKED_MESSAGE } from "@/contracts/inventory";
import { getDb } from "@/infrastructure/db";
import { categories, products } from "@/infrastructure/db/schema";
import type { ImportErrors, ImportRow } from "./import-rows";

/** Some rows cannot go in as they are; nothing was written. */
export class ImportRefusal extends Error {
  constructor(readonly errors: ImportErrors) {
    super("Import refused");
  }
}

/**
 * Inserts the new products and updates the ones whose barcode exists, creating the missing
 * categories (matched by name regardless of case), all in one transaction: every row or none.
 * A unit cannot change once the product has batches (ImportRefusal with the lines).
 */
export function applyProductImport(rows: ImportRow[]) {
  return getDb().transaction(async (tx) => {
    const existing = await tx
      .select({
        id: products.id,
        barcode: products.barcode,
        unit: products.unit,
        // Explicit names: a single-table select drops the table from column references.
        hasBatches: sql<boolean>`exists (SELECT 1 FROM inventory_batches b WHERE b.product_id = "products"."id")`,
      })
      .from(products)
      .where(
        inArray(
          products.barcode,
          rows.map((row) => row.barcode),
        ),
      )
      // Edits of these products in the panel wait for the import, and the other way round.
      .for("update");
    const byBarcode = new Map(
      existing.map((product) => [product.barcode, product]),
    );
    const errors: ImportErrors = {};
    for (const row of rows) {
      const product = byBarcode.get(row.barcode);
      if (product?.hasBatches && product.unit !== row.unit)
        errors[row.line] = UNIT_LOCKED_MESSAGE;
    }
    if (Object.keys(errors).length > 0) throw new ImportRefusal(errors);

    const lower = (name: string) => name.toLocaleLowerCase("pt-BR");
    const wanted = new Map(
      rows.map((row) => [lower(row.category), row.category]),
    );
    const known = await tx
      .select({ id: categories.id, name: categories.name })
      .from(categories)
      .where(inArray(sql`lower(${categories.name})`, [...wanted.keys()]));
    const categoryId = new Map(known.map((row) => [lower(row.name), row.id]));
    const missing = [...wanted].filter(([key]) => !categoryId.has(key));
    if (missing.length > 0) {
      const created = await tx
        .insert(categories)
        .values(missing.map(([, name]) => ({ name })))
        .returning({ id: categories.id, name: categories.name });
      for (const row of created) categoryId.set(lower(row.name), row.id);
    }

    const values = (row: ImportRow) => ({
      barcode: row.barcode,
      name: row.name,
      categoryId: categoryId.get(lower(row.category)) as string,
      costPrice: row.costPrice,
      sellPrice: row.sellPrice,
      unit: row.unit,
      minStock: row.minStock,
    });
    const fresh = rows.filter((row) => !byBarcode.has(row.barcode));
    if (fresh.length > 0) await tx.insert(products).values(fresh.map(values));
    for (const row of rows) {
      const product = byBarcode.get(row.barcode);
      if (product)
        await tx
          .update(products)
          .set(values(row))
          .where(eq(products.id, product.id));
    }
    return {
      inserted: fresh.length,
      updated: rows.length - fresh.length,
      categoriesCreated: missing.length,
    };
  });
}
