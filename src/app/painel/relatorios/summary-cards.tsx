import type { FinancialReport } from "@/contracts/reports";
import { Badge } from "@ds/components/badge";
import { Card } from "@ds/components/card";
import { Money } from "@ds/components/money";
import { formatPercent, marginBadge } from "./report-format";

const count = new Intl.NumberFormat("pt-BR");

/** DRE resumida: revenue − CMV = gross profit, with the margin, the ticket and the volumes. */
export function SummaryCards({
  summary,
}: {
  summary: FinancialReport["summary"];
}) {
  const badge = marginBadge(summary.marginPercent);
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Card title="Faturamento bruto" subtitle="Soma das vendas do período">
        <Money cents={summary.revenue} size="xl" />
      </Card>
      <Card title="CMV" subtitle="Custo gravado em cada venda">
        <Money cents={summary.cogs} size="xl" />
      </Card>
      <Card title="Lucro bruto" subtitle="Faturamento − CMV">
        <Money
          cents={summary.grossProfit}
          size="xl"
          tone={summary.grossProfit < 0 ? "out" : undefined}
        />
      </Card>
      <Card title="Margem bruta" subtitle="Lucro bruto ÷ faturamento">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-h1 font-medium tracking-tight text-strong tabular-nums">
            {formatPercent(summary.marginPercent)}
          </span>
          <Badge tone={badge.tone} dot>
            {badge.label}
          </Badge>
        </div>
      </Card>
      <Card title="Ticket médio" subtitle="Faturamento ÷ vendas">
        {summary.averageTicket === null ? (
          <span className="text-h1 font-medium text-sub">—</span>
        ) : (
          <Money cents={summary.averageTicket} size="xl" />
        )}
      </Card>
      <Card
        title="Vendas e itens"
        subtitle="Cada linha pesável conta como 1 item"
      >
        <p className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <span>
            <span className="text-h1 font-medium tracking-tight text-strong tabular-nums">
              {count.format(summary.salesCount)}
            </span>{" "}
            <span className="text-sub">vendas</span>
          </span>
          <span>
            <span className="text-h1 font-medium tracking-tight text-strong tabular-nums">
              {count.format(summary.itemsSold)}
            </span>{" "}
            <span className="text-sub">itens</span>
          </span>
        </p>
      </Card>
    </div>
  );
}
