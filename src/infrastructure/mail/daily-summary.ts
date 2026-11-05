import type { FinancialReport } from "@/contracts/reports";
import { PAYMENT_LABELS } from "@/contracts/sales";
import { formatBrl } from "@ds/lib/money";
import type { MailContent } from "./templates";

const percent = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

/** Store and product names come from people: never let them become markup. */
export const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

/** "2026-11-05" → "05/11/2026". */
const localDate = (date: string) => date.split("-").reverse().join("/");

const percentText = (value: number | null) =>
  value === null ? "—" : `${percent.format(value)}%`;

type Row = [label: string, value: string];

// Plain HTML without inline colors or sizes: every e-mail client renders it, light or dark.
const table = (head: string[], rows: string[][]) =>
  `<table border="1" cellpadding="6" cellspacing="0"><thead><tr>${head
    .map((cell) => `<th align="left">${escapeHtml(cell)}</th>`)
    .join("")}</tr></thead><tbody>${rows
    .map(
      (row) =>
        `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`,
    )
    .join("")}</tbody></table>`;

/** The day's financial summary (DRE resumida) for the owner, as text and HTML. */
export function dailySummaryMail(input: {
  storeName: string;
  report: FinancialReport;
}): MailContent & { html: string } {
  const { storeName, report } = input;
  const { summary } = report;
  const day = localDate(report.period.from);
  const figures: Row[] = [
    ["Faturamento bruto", formatBrl(summary.revenue)],
    ["CMV", formatBrl(summary.cogs)],
    ["Lucro bruto", formatBrl(summary.grossProfit)],
    ["Margem bruta", percentText(summary.marginPercent)],
    [
      "Ticket médio",
      summary.averageTicket === null ? "—" : formatBrl(summary.averageTicket),
    ],
    ["Vendas", String(summary.salesCount)],
    ["Itens vendidos", String(summary.itemsSold)],
  ];
  const payments = report.payments.map((payment) => [
    PAYMENT_LABELS[payment.method],
    String(payment.count),
    formatBrl(payment.total),
    percentText(payment.percent),
  ]);
  const top = report.top.byRevenue.map((product) => [
    product.name,
    formatBrl(product.revenue),
    formatBrl(product.profit),
  ]);

  const text = [
    `Resumo financeiro de ${day} — ${storeName}`,
    "",
    ...figures.map(([label, value]) => `${label}: ${value}`),
    "",
    "Formas de pagamento:",
    ...payments.map(
      ([label, count, total, share]) =>
        `${label}: ${count} venda(s), ${total} (${share})`,
    ),
    "",
    "Maiores faturamentos:",
    ...(top.length
      ? top.map(
          ([name, revenue, profit]) => `${name}: ${revenue}, lucro ${profit}`,
        )
      : ["Nenhuma venda no dia."]),
    "",
    "Valores do dia no fuso da loja, enviados pelo Mkt Control.",
  ].join("\n");

  const html = [
    `<h1>Resumo financeiro de ${day}</h1>`,
    `<p>${escapeHtml(storeName)}</p>`,
    table(["Indicador", "Valor"], figures),
    "<h2>Formas de pagamento</h2>",
    table(["Forma", "Vendas", "Total", "Participação"], payments),
    "<h2>Maiores faturamentos</h2>",
    top.length
      ? table(["Produto", "Faturamento", "Lucro bruto"], top)
      : "<p>Nenhuma venda no dia.</p>",
    "<p>Valores do dia no fuso da loja, enviados pelo Mkt Control.</p>",
  ].join("");

  return {
    subject: `Resumo financeiro de ${day} — ${storeName}`,
    text,
    html,
  };
}
