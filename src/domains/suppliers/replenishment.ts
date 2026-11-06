import type { SupplierRow } from "@/contracts/suppliers";
import {
  daysUntil,
  expirySignal,
  stockSignal,
  worstSignal,
} from "@/domains/inventory/semaphore";

/** What to buy: twice the minimum minus what is on the shelf, never below zero. */
export const suggestedQuantity = (stock: number, minStock: number) =>
  Math.max(0, 2 * minStock - stock);

export type ReplenishmentRow = {
  productId: string;
  barcode: string;
  name: string;
  unit: "UN" | "KG" | "L";
  stock: number;
  minStock: number;
  nearestExpiration: string | null;
  supplierCode: string;
  /** The default supplier, or null without one. */
  supplier: SupplierRow | null;
};

/**
 * Turns the products that need attention into items with the suggestion and the semaphore, grouped
 * by the default supplier (by name), with the products without an active one at the end.
 */
export function groupBySupplier(rows: ReplenishmentRow[], today: string) {
  const groups = new Map<
    string,
    { supplier: SupplierRow | null; items: ReturnType<typeof toItem>[] }
  >();
  function toItem(row: ReplenishmentRow) {
    const daysLeft =
      row.nearestExpiration === null
        ? null
        : daysUntil(row.nearestExpiration, today);
    return {
      productId: row.productId,
      barcode: row.barcode,
      name: row.name,
      unit: row.unit,
      stock: row.stock,
      minStock: row.minStock,
      suggested: suggestedQuantity(row.stock, row.minStock),
      nearestExpiration: row.nearestExpiration,
      daysLeft,
      signal: worstSignal([stockSignal(row), expirySignal(daysLeft)]),
      supplierCode: row.supplierCode,
    };
  }
  for (const row of rows) {
    // An inactive supplier takes no orders: its products wait for a new default.
    const supplier = row.supplier?.active ? row.supplier : null;
    const key = supplier?.id ?? "";
    const group = groups.get(key) ?? { supplier, items: [] };
    group.items.push(toItem(row));
    groups.set(key, group);
  }
  return [...groups.values()].sort((a, b) =>
    a.supplier && b.supplier
      ? a.supplier.name.localeCompare(b.supplier.name, "pt-BR")
      : a.supplier
        ? -1
        : 1,
  );
}
