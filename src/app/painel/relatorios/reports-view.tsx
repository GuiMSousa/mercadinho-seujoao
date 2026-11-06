"use client";

import { Mail } from "lucide-react";
import { useRef, useState } from "react";
import type { FinancialReport, ReportSalesPage } from "@/contracts/reports";
import { Button } from "@ds/components/button";
import { useToast } from "@ds/components/toast";
import { apiFetch } from "../_lib/api";
import { PaymentBars } from "./payment-bars";
import { PeriodFilter, type PeriodQuery } from "./period-filter";
import { formatDay } from "@/lib/formatters";
import { SalesHistory } from "./sales-history";
import { SummaryCards } from "./summary-cards";
import { TopProducts } from "./top-products";

const search = (query: PeriodQuery, page = 1) =>
  new URLSearchParams({
    period: query.period,
    ...(query.period === "custom" && { from: query.from, to: query.to }),
    page: String(page),
  } as Record<string, string>);

/** The financial report: period, DRE cards, payment methods, best products and the sales. */
export function ReportsView({
  initialReport,
  initialSales,
}: {
  initialReport: FinancialReport;
  initialSales: ReportSalesPage;
}) {
  const { toast } = useToast();
  const [query, setQuery] = useState<PeriodQuery>({ period: "today" });
  const [report, setReport] = useState(initialReport);
  const [sales, setSales] = useState(initialSales);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  // A slower, older answer must not overwrite the period the person chose last.
  const latest = useRef(0);

  const failed = (message: string) =>
    toast({
      title: "Não foi possível carregar o relatório",
      message,
      tone: "danger",
    });

  async function load(next: PeriodQuery) {
    const request = ++latest.current;
    setLoading(true);
    const [reportResult, salesResult] = await Promise.all([
      apiFetch<FinancialReport>(`/api/admin/reports?${search(next)}`),
      apiFetch<ReportSalesPage>(`/api/admin/reports/sales?${search(next)}`),
    ]);
    if (request !== latest.current) return;
    setLoading(false);
    if (!reportResult.ok) return failed(reportResult.errors.error ?? "");
    if (!salesResult.ok) return failed(salesResult.errors.error ?? "");
    setQuery(next);
    setReport(reportResult.data);
    setSales(salesResult.data);
  }

  async function goTo(page: number) {
    const request = ++latest.current;
    setLoading(true);
    const result = await apiFetch<ReportSalesPage>(
      `/api/admin/reports/sales?${search(query, page)}`,
    );
    if (request !== latest.current) return;
    setLoading(false);
    if (!result.ok) return failed(result.errors.error ?? "");
    setSales(result.data);
  }

  async function sendSummary() {
    setSending(true);
    const result = await apiFetch<{ sentTo: string }>(
      "/api/admin/reports/daily-email",
      { method: "POST" },
    );
    setSending(false);
    toast(
      result.ok
        ? {
            title: "Resumo enviado",
            message: `O resumo de hoje foi para ${result.data.sentTo}.`,
            tone: "success",
          }
        : {
            title: "Resumo não enviado",
            message: result.errors.error,
            tone: "danger",
          },
    );
  }

  const { from, to } = report.period;
  return (
    <div className="mx-auto flex max-w-350 flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PeriodFilter
          value={query}
          resolved={report.period}
          onChange={(next) => void load(next)}
        />
        <Button
          variant="secondary"
          loading={sending}
          onClick={() => void sendSummary()}
        >
          <Mail aria-hidden="true" />
          Enviar resumo de hoje por e-mail
        </Button>
      </div>
      <p role="status" className="text-body-md text-sub">
        {from === to
          ? `Vendas de ${formatDay(from)}`
          : `Vendas de ${formatDay(from)} a ${formatDay(to)}`}
        , no horário da loja.
      </p>
      <div aria-busy={loading} className="flex flex-col gap-6">
        <SummaryCards summary={report.summary} />
        <div className="grid gap-6 lg:grid-cols-2">
          <PaymentBars payments={report.payments} />
          <TopProducts top={report.top} />
        </div>
        <SalesHistory
          page={sales}
          loading={loading}
          onPage={(page) => void goTo(page)}
        />
      </div>
    </div>
  );
}
