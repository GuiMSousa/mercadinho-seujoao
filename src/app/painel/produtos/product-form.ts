import type { ProductRow } from "@/contracts/inventory";

export type Unit = ProductRow["unit"];

const UNIT_SUFFIX = { UN: "un", KG: "kg", L: "L" } as const;
const integerFormat = new Intl.NumberFormat("pt-BR");

export const unitSuffix = (unit: Unit) => UNIT_SUFFIX[unit];

// Shared with the server, which reads the same amounts from imported spreadsheets.
export { parseCents, parseQuantity } from "@/lib/amounts";

export function centsToInput(cents: number) {
  const remainder = cents % 100;
  return `${(cents - remainder) / 100},${String(remainder).padStart(2, "0")}`;
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
  | "defaultSupplierId"
  | "supplierCode"
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
