/**
 * A label printed by the store's scale (butcher, produce): an EAN-13 that starts with 2.
 * "20" + 5-digit product code + total in cents (5 digits) + check digit, or
 * "21" + 5-digit product code + net weight in grams (5 digits) + check digit.
 * The product code is the barcode of the weighed product in the catalog (e.g. "00123").
 */
export type ScaleLabel =
  | { kind: "price"; code: string; cents: number }
  | { kind: "weight"; code: string; grams: number };

const LABEL = /^2([01])(\d{5})(\d{5})\d$/;

/** EAN-13: digits weigh 1 and 3 alternately from the left; the 13th completes a multiple of 10. */
function hasValidCheckDigit(code: string) {
  let sum = 0;
  for (let index = 0; index < 12; index++)
    sum += Number(code[index]) * (index % 2 === 0 ? 1 : 3);
  return (10 - (sum % 10)) % 10 === Number(code[12]);
}

/** The scale label behind a scanned code, or null for any other code (a regular EAN-13 included). */
export function parseScaleLabel(code: string): ScaleLabel | null {
  const match = LABEL.exec(code);
  // A wrong check digit is a misread or a typo; read as a label, it would sell the wrong amount.
  if (!match || !hasValidCheckDigit(code)) return null;
  const [, kind, product, digits] = match;
  const amount = Number(digits);
  if (amount === 0) return null;
  return kind === "0"
    ? { kind: "price", code: product, cents: amount }
    : { kind: "weight", code: product, grams: amount };
}

/**
 * Grams to sell for the label at the catalog price per kg (the price the sale is charged at).
 * A price label rounds the weight down, so the line never costs more than the printed amount;
 * it can cost up to the price of one gram less. Null when not even one gram fits.
 */
export function scaleGrams(label: ScaleLabel, pricePerKg: number) {
  if (label.kind === "weight") return label.grams;
  if (pricePerKg <= 0) return null;
  const grams = Math.floor((label.cents * 1000) / pricePerKg);
  return grams > 0 ? grams : null;
}
