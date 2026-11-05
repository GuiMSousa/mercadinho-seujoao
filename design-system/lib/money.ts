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

/** "R$ 1.234,56" as plain text, for places that cannot hold the Money component (toasts, logs, receipts).
 * A no-break space keeps "R$" on the same line as the amount. */
export function formatBrl(cents: number) {
  const parts = formatCents(cents);
  return `${parts.negative ? "−" : ""}R$\u00a0${parts.integer},${parts.cents}`;
}
