import type { ReportSalesPage } from "@/contracts/reports";
import { PAYMENT_LABELS } from "@/contracts/sales";
import { Badge } from "@ds/components/badge";
import { Card } from "@ds/components/card";
import { Table, type TableColumn } from "@ds/components/table";
import { formatBrl } from "@ds/lib/money";
import { formatDateTime } from "../_lib/format";
import { Pagination } from "../_lib/pagination";
import { formatPercent } from "@/lib/formatters";
import { marginBadge } from "./report-format";

type Sale = ReportSalesPage["sales"][number];

const columns: TableColumn<Sale>[] = [
  {
    key: "number",
    label: "Venda",
    render: (sale) => <span className="font-medium">nº {sale.number}</span>,
  },
  {
    key: "when",
    label: "Data e hora",
    render: (sale) => formatDateTime(sale.createdAt),
  },
  {
    key: "operator",
    label: "Operador",
    className: "hidden md:table-cell",
    render: (sale) => sale.operator,
  },
  {
    key: "payment",
    label: "Pagamento",
    className: "hidden lg:table-cell",
    render: (sale) =>
      sale.paymentMethods.map((method) => PAYMENT_LABELS[method]).join(" + ") ||
      "—",
  },
  {
    key: "total",
    label: "Faturamento",
    align: "right",
    render: (sale) => (
      <span className="flex flex-col items-end">
        {formatBrl(sale.total)}
        {sale.discount > 0 && (
          <span className="text-body-sm text-sub">
            desconto {formatBrl(sale.discount)}
          </span>
        )}
      </span>
    ),
  },
  {
    key: "cogs",
    label: "CMV",
    align: "right",
    className: "hidden sm:table-cell",
    render: (sale) => formatBrl(sale.cogs),
  },
  {
    key: "margin",
    label: "Margem",
    align: "right",
    render: (sale) => {
      const badge = marginBadge(sale.marginPercent);
      return (
        <Badge tone={badge.tone} dot>
          {formatPercent(sale.marginPercent)}
          <span className="sr-only"> ({badge.label})</span>
        </Badge>
      );
    },
  },
];

/** Every sale of the period, newest first, with its CMV and margin. */
export function SalesHistory({
  page,
  loading,
  onPage,
}: {
  page: ReportSalesPage;
  loading: boolean;
  onPage: (page: number) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <Card title="Vendas do período" flush>
        <div aria-busy={loading}>
          <Table
            caption="Vendas do período"
            columns={columns}
            rows={page.sales}
            rowKey={(sale) => sale.id}
            empty="Nenhuma venda no período."
          />
        </div>
      </Card>
      <Pagination
        page={page.page}
        pageSize={page.pageSize}
        total={page.total}
        noun={{ one: "venda", many: "vendas" }}
        loading={loading}
        onPage={onPage}
      />
    </div>
  );
}
