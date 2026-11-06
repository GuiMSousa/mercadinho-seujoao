import { z } from "zod";
import { PAYMENT_METHODS } from "./enums";
import { unitSchema } from "./inventory";

export const REPORT_PERIODS = [
  "today",
  "7d",
  "30d",
  "month",
  "custom",
] as const;
// A year and a day: wide enough for a yearly look, small enough to stay a quick query.
export const MAX_REPORT_DAYS = 366;

const DAY_MS = 86_400_000;
const daysBetween = (from: string, to: string) =>
  (Date.parse(to) - Date.parse(from)) / DAY_MS;

/** Period of a report, read from the query string. Custom periods need both dates, in order. */
export const reportQuerySchema = z
  .object({
    period: z.enum(REPORT_PERIODS).default("today"),
    from: z.iso.date("Informe a data no formato AAAA-MM-DD.").optional(),
    to: z.iso.date("Informe a data no formato AAAA-MM-DD.").optional(),
    page: z.coerce.number().int().min(1).default(1),
  })
  .superRefine((query, context) => {
    if (query.period !== "custom") return;
    if (!query.from || !query.to)
      return context.addIssue({
        code: "custom",
        path: ["from"],
        message: "Informe a data inicial e a final.",
      });
    if (query.from > query.to)
      return context.addIssue({
        code: "custom",
        path: ["to"],
        message: "A data final vem depois da inicial.",
      });
    if (daysBetween(query.from, query.to) >= MAX_REPORT_DAYS)
      context.addIssue({
        code: "custom",
        path: ["to"],
        message: `Escolha um período de até ${MAX_REPORT_DAYS} dias.`,
      });
  });

/** Gross margin bands of the report: 20% or more is healthy, 10% to under 20% is tight. */
export function marginLevel(percent: number | null) {
  if (percent === null) return null;
  if (percent >= 20) return "good" as const;
  return percent >= 10 ? ("fair" as const) : ("low" as const);
}

const periodSchema = z.object({ from: z.iso.date(), to: z.iso.date() });

// ADMIN only: revenue, CMV and margins never reach a CASHIER (PRODUCT.md).
export const reportSummarySchema = z.object({
  revenue: z.int(),
  cogs: z.int(),
  grossProfit: z.int(),
  // Gross profit over revenue, in percent with one decimal; null without revenue.
  marginPercent: z.number().nullable(),
  averageTicket: z.int().nullable(),
  salesCount: z.int(),
  // Units for UN products; each weighed line (kg or L) counts as one item.
  itemsSold: z.int(),
});

const topProductSchema = z.object({
  productId: z.uuid(),
  name: z.string(),
  unit: unitSchema,
  quantity: z.int(),
  revenue: z.int(),
  profit: z.int(),
});

export const financialReportSchema = z.object({
  period: periodSchema,
  summary: reportSummarySchema,
  payments: z.array(
    z.object({
      method: z.enum(PAYMENT_METHODS),
      count: z.int(),
      total: z.int(),
      // Share of the revenue, in percent with one decimal.
      percent: z.number(),
    }),
  ),
  top: z.object({
    byQuantity: z.array(topProductSchema),
    byRevenue: z.array(topProductSchema),
    byProfit: z.array(topProductSchema),
  }),
});

export const reportSalesPageSchema = z.object({
  period: periodSchema,
  sales: z.array(
    z.object({
      id: z.uuid(),
      number: z.int(),
      createdAt: z.iso.datetime(),
      operator: z.string(),
      paymentMethod: z.enum(PAYMENT_METHODS),
      total: z.int(),
      cogs: z.int(),
      marginPercent: z.number().nullable(),
    }),
  ),
  total: z.int(),
  page: z.int(),
  pageSize: z.int(),
});

export const dailySummarySentSchema = z.object({ sentTo: z.string() });

export type ReportQuery = z.output<typeof reportQuerySchema>;
export type ReportPeriod = z.infer<typeof periodSchema>;
export type FinancialReport = z.infer<typeof financialReportSchema>;
export type ReportSalesPage = z.infer<typeof reportSalesPageSchema>;
