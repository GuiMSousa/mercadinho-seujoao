import type { FinancialReport } from "@/contracts/reports";
import { PAYMENT_LABELS } from "@/contracts/sales";
import { Card } from "@ds/components/card";
import { formatBrl } from "@ds/lib/money";
import { formatPercent } from "@/lib/formatters";

/**
 * Share of the revenue by payment method. One series in one color, every bar labeled with its
 * method, total, count and share, so nothing depends on the color or on hovering.
 */
export function PaymentBars({
  payments,
}: {
  payments: FinancialReport["payments"];
}) {
  return (
    <Card title="Formas de pagamento">
      <ul className="flex flex-col gap-4">
        {payments.map((payment) => (
          <li key={payment.method} className="flex flex-col gap-1.5">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3">
              <span className="font-medium text-strong">
                {PAYMENT_LABELS[payment.method]}
              </span>
              <span className="text-body-md text-sub tabular-nums">
                <span className="font-medium text-strong">
                  {formatBrl(payment.total)}
                </span>{" "}
                · {payment.count} {payment.count === 1 ? "venda" : "vendas"} ·{" "}
                {formatPercent(payment.percent)}
              </span>
            </div>
            <div
              aria-hidden="true"
              className="h-2 overflow-hidden rounded-xs bg-surface-sunken"
            >
              <div
                className="h-full rounded-xs bg-brand"
                style={{ width: `${payment.percent}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
