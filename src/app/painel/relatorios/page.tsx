import type { Metadata } from "next";
import {
  financialReportSchema,
  reportSalesPageSchema,
} from "@/contracts/reports";
import { getFinancialReport, listReportSales } from "@/domains/reports/service";
import { requireAdmin } from "../_lib/require-admin";
import { ReportsView } from "./reports-view";

export const metadata: Metadata = { title: "Relatórios — Mkt Control" };

export default async function ReportsPage() {
  await requireAdmin();
  // The same DTOs as the routes, so the page shows exactly what the API would answer.
  const [report, sales] = await Promise.all([
    getFinancialReport({ period: "today" }),
    listReportSales({ period: "today", page: 1 }),
  ]);
  return (
    <ReportsView
      initialReport={financialReportSchema.parse(report)}
      initialSales={reportSalesPageSchema.parse(sales)}
    />
  );
}
