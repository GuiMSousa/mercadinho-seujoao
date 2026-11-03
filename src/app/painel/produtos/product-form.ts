import type { ProductRow } from "@/contracts/inventory";

export type Unit = ProductRow["unit"];

const UNIT_SUFFIX = { UN: "un", KG: "kg", L: "L" } as const;
const integerFormat = new Intl.NumberFormat("pt-BR");

export const unitSuffix = (unit: Unit) => UNIT_SUFFIX[unit];

/** "1.234,56" or "12,9" to integer cents, without floating point; null when it is not an amount. */
export function parseCents(text: string) {
  const value = text.trim();
  if (!/^(\d{1,3}(\.\d{3})+|\d+)(,\d{1,2})?$/.test(value)) return null;
  const [integer, fraction = ""] = value.replaceAll(".", "").split(",");
  return Number(integer) * 100 + Number(fraction.padEnd(2, "0"));
}

export function centsToInput(cents: number) {
  const remainder = cents % 100;
  return `${(cents - remainder) / 100},${String(remainder).padStart(2, "0")}`;
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

export function quantityToInput(quantity: number, unit: Unit) {
  if (unit === "UN") return String(quantity);
  const remainder = quantity % 1000;
  return `${(quantity - remainder) / 1000},${String(remainder).padStart(3, "0")}`;
}

export function formatQuantity(quantity: number, unit: Unit) {
  if (unit === "UN") return `${integerFormat.format(quantity)} un`;
  const remainder = quantity % 1000;
  const whole = integerFormat.format((quantity - remainder) / 1000);
  return `${whole},${String(remainder).padStart(3, "0")} ${UNIT_SUFFIX[unit]}`;
}

type ProductValues = Pick<
  ProductRow,
  | "barcode"
  | "name"
  | "categoryId"
  | "costPrice"
  | "sellPrice"
  | "minStock"
  | "unit"
  | "active"
>;

/** Only the fields the person changed, so the activity log names just those. */
export function productPatch(product: ProductRow, next: ProductValues) {
  const patch = Object.fromEntries(
    Object.entries(next).filter(
      ([key, value]) => product[key as keyof ProductValues] !== value,
    ),
  ) as Partial<ProductValues>;
  // The minimum means something else in the new unit, even when the stored number stays equal.
  if (patch.unit) patch.minStock = next.minStock;
  return patch;
}
