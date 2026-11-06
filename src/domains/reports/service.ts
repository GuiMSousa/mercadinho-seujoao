import "server-only";
import type { ReportQuery } from "@/contracts/reports";
import { PAYMENT_METHODS } from "@/contracts/enums";
import { logActivity } from "@/domains/activity/service";
import { ServiceError } from "@/domains/auth/errors";
import { createRateLimiter } from "@/domains/auth/login-rate-limit";
import { todayInStore } from "@/domains/inventory/semaphore";
import { findStore } from "@/domains/store/repository";
import { getMailer } from "@/infrastructure/mail";
import { dailySummaryMail } from "@/infrastructure/mail/daily-summary";
import { logger } from "@/lib/logger";
import { marginPercent, share, summarize } from "./finance";
import { resolvePeriod } from "./period";
import {
  countSales,
  readReport,
  selectPaymentTotals,
  selectSalesPage,
  selectTopProducts,
  selectTotals,
} from "./repository";

const SALES_PER_PAGE = 20;
// Each e-mail spends the Resend quota: a few a day is plenty.
const summaryMailLimiter = createRateLimiter({
  limit: 5,
  windowMs: 60 * 60 * 1000,
});

type Period = Pick<ReportQuery, "period" | "from" | "to">;

/** Revenue, CMV, gross profit and margin of the period, by payment method and best products. */
export async function getFinancialReport(
  query: Period,
  today = todayInStore(),
) {
  const period = resolvePeriod(query, today);
  // One snapshot, read in order: a transaction has a single connection.
  const { totals, paymentRows, byQuantity, byRevenue, byProfit } =
    await readReport(async (tx) => ({
      totals: await selectTotals(tx, period),
      paymentRows: await selectPaymentTotals(tx, period),
      byQuantity: await selectTopProducts(tx, period, "quantity"),
      byRevenue: await selectTopProducts(tx, period, "revenue"),
      byProfit: await selectTopProducts(tx, period, "profit"),
    }));
  const summary = summarize(totals);
  return {
    period,
    summary,
    // Every method, in a fixed order, so the table and the chart never shift.
    payments: PAYMENT_METHODS.map((method) => {
      const row = paymentRows.find((payment) => payment.method === method);
      const total = row?.total ?? 0;
      return {
        method,
        count: row?.count ?? 0,
        total,
        percent: share(total, summary.revenue),
      };
    }),
    top: { byQuantity, byRevenue, byProfit },
  };
}

/** The period's sales, newest first, each with its CMV and margin. */
export async function listReportSales(
  query: ReportQuery,
  today = todayInStore(),
) {
  const period = resolvePeriod(query, today);
  // Count and page from one snapshot, so the pager agrees with the rows it shows.
  const { total, page, rows } = await readReport(async (tx) => {
    const count = await countSales(tx, period);
    const current = Math.min(
      query.page,
      Math.max(1, Math.ceil(count / SALES_PER_PAGE)),
    );
    return {
      total: count,
      page: current,
      rows: await selectSalesPage(tx, period, {
        limit: SALES_PER_PAGE,
        offset: (current - 1) * SALES_PER_PAGE,
      }),
    };
  });
  return {
    period,
    total,
    page,
    pageSize: SALES_PER_PAGE,
    sales: rows.map((row) => ({
      ...row,
      createdAt: row.createdAt.toISOString(),
      marginPercent: marginPercent(row.total, row.cogs),
    })),
  };
}

/** E-mails today's summary to the ADMIN who asked, at the address of their account. */
export async function sendDailySummary(
  actor: { id: string; name: string; email: string },
  today = todayInStore(),
) {
  const { allowed, retryAfterSeconds } = summaryMailLimiter.hit(actor.id);
  if (!allowed)
    throw new ServiceError(
      429,
      "Muitos envios seguidos. Tente de novo mais tarde.",
      { retryAfterSeconds },
    );
  const [report, store] = await Promise.all([
    getFinancialReport({ period: "today" }, today),
    findStore(),
  ]);
  const mail = dailySummaryMail({
    storeName: store?.name ?? "Minha loja",
    report,
  });
  try {
    await getMailer().send({ to: actor.email, ...mail });
  } catch (error) {
    logger.error({ err: error }, "Daily summary e-mail failed");
    throw new ServiceError(
      502,
      "Não foi possível enviar o e-mail agora. Tente de novo em alguns minutos.",
    );
  }
  await logActivity({
    user: actor,
    action: "Resumo diário enviado",
    detail: report.period.from,
  });
  return { sentTo: actor.email };
}
