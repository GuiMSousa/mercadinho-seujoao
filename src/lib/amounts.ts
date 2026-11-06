import type { PRODUCT_UNITS } from "@/contracts/enums";

type Unit = (typeof PRODUCT_UNITS)[number];

/** "1.234,56" or "12,9" to integer cents, without floating point; null when it is not an amount. */
export function parseCents(text: string) {
  const value = text.trim();
  if (!/^(\d{1,3}(\.\d{3})+|\d+)(,\d{1,2})?$/.test(value)) return null;
  const [integer, fraction = ""] = value.replaceAll(".", "").split(",");
  return Number(integer) * 100 + Number(fraction.padEnd(2, "0"));
}

/**
 * What the person types to the stored integer: units stay whole, while kg and L
 * ("1,250") become grams and milliliters. Null when it does not fit the unit.
 */
export function parseQuantity(text: string, unit: Unit) {
  const value = text.trim();
  if (unit === "UN") return /^\d+$/.test(value) ? Number(value) : null;
  if (!/^\d+(,\d{1,3})?$/.test(value)) return null;
  const [integer, fraction = ""] = value.split(",");
  return Number(integer) * 1000 + Number(fraction.padEnd(3, "0"));
}
