import {
  settlePayments,
  type Payment,
  type PaymentMethod,
} from "@/contracts/sales";

/** A discount as typed: an amount in cents, or a percentage in hundredths (1050 = 10,50%). */
export type Discount = { kind: "amount" | "percent"; value: number };

/** The discount in cents on `subtotal`; a percentage rounds half up to the cent. */
export const discountCents = (subtotal: number, discount: Discount | null) =>
  !discount
    ? 0
    : discount.kind === "amount"
      ? discount.value
      : Math.round((subtotal * discount.value) / 10000);

export const paidSoFar = (lines: Payment[]) =>
  lines.reduce((sum, line) => sum + line.amount, 0);

/** Adds `amount` in `method`, summing into the line of the same method (one line per method). */
export function addPayment(
  lines: Payment[],
  method: PaymentMethod,
  amount: number,
): Payment[] {
  return lines.some((line) => line.method === method)
    ? lines.map((line) =>
        line.method === method
          ? { ...line, amount: line.amount + amount }
          : line,
      )
    : [...lines, { method, amount }];
}

/**
 * What confirming `amount` in `method` does: one more line while the total is not covered, the
 * payments to send once it is, or why not (a card paying more than what is left, for one).
 */
export function nextStep(
  total: number,
  lines: Payment[],
  method: PaymentMethod,
  amount: number,
):
  | { kind: "add"; lines: Payment[] }
  | { kind: "finish"; payments: Payment[] }
  | { kind: "refuse"; message: string } {
  const next = amount > 0 ? addPayment(lines, method, amount) : lines;
  const settled = settlePayments(total, next);
  if (settled.ok) return { kind: "finish", payments: next };
  if (paidSoFar(next) < total)
    return amount > 0
      ? { kind: "add", lines: next }
      : { kind: "refuse", message: "Informe um valor maior que zero." };
  return { kind: "refuse", message: settled.message };
}
