export type Signal = "green" | "yellow" | "red";

const DAY_MS = 86_400_000;
const SEVERITY: Signal[] = ["green", "yellow", "red"];

/** Today's calendar date at the store ("2026-11-03"), whatever time zone the server runs in. */
export function todayInStore(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
  }).format(now);
}

/** Whole days from `today` to `date`; negative once expired. Both are read as UTC, so DST cannot skew it. */
export function daysUntil(date: string, today: string) {
  return (Date.parse(date) - Date.parse(today)) / DAY_MS;
}

/** Red: expired or within 7 days. Yellow: 8 to 30 days. An item that does not expire is green. */
export function expirySignal(daysLeft: number | null): Signal {
  if (daysLeft === null) return "green";
  if (daysLeft <= 7) return "red";
  return daysLeft <= 30 ? "yellow" : "green";
}

/** Red: no stock. Yellow: at or below the minimum. */
export function stockSignal(product: {
  stock: number;
  minStock: number;
}): Signal {
  if (product.stock === 0) return "red";
  return product.stock <= product.minStock ? "yellow" : "green";
}

export function worstSignal(signals: Signal[]): Signal {
  return SEVERITY[Math.max(0, ...signals.map((s) => SEVERITY.indexOf(s)))];
}
