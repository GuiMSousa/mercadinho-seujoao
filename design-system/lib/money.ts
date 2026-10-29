const integerFormat = new Intl.NumberFormat("pt-BR");

/**
 * Splits integer cents into pt-BR display parts without floating point:
 * -123456 → { negative: true, integer: "1.234", cents: "56" }.
 */
export function formatCents(cents: number) {
  if (!Number.isSafeInteger(cents)) {
    throw new RangeError(`Money expects integer cents, got ${cents}`);
  }
  const abs = Math.abs(cents);
  const remainder = abs % 100;
  return {
    negative: cents < 0,
    integer: integerFormat.format((abs - remainder) / 100),
    cents: String(remainder).padStart(2, "0"),
  };
}
