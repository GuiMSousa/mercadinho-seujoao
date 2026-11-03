export type StockBatch = {
  id: string;
  expirationDate: string | null;
  createdAt: Date;
  quantity: number;
};

type Allocation = { batchId: string; quantity: number };

function byExpiration(a: string | null, b: string | null) {
  if (a === b) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return a.localeCompare(b);
}

/**
 * PVPS (Primeiro que Vence, Primeiro que Sai): takes `quantity` from the batches that expire first,
 * older entries first on the same date and batches without expiration last. Returns null when the stock does not cover it.
 */
export function allocatePvps(
  batches: StockBatch[],
  quantity: number,
): Allocation[] | null {
  const ordered = batches
    .filter((batch) => batch.quantity > 0)
    .toSorted(
      (a, b) =>
        byExpiration(a.expirationDate, b.expirationDate) ||
        a.createdAt.getTime() - b.createdAt.getTime() ||
        a.id.localeCompare(b.id),
    );
  const allocations: Allocation[] = [];
  let missing = quantity;
  for (const batch of ordered) {
    if (missing === 0) break;
    const taken = Math.min(batch.quantity, missing);
    allocations.push({ batchId: batch.id, quantity: taken });
    missing -= taken;
  }
  return missing === 0 ? allocations : null;
}
