/** Gross profit over revenue, in percent with one decimal; null when nothing was sold. */
export function marginPercent(revenue: number, cogs: number) {
  if (revenue === 0) return null;
  return Math.round(((revenue - cogs) * 1000) / revenue) / 10;
}

/** Revenue per sale, rounded to the cent; null without sales. */
export const averageTicket = (revenue: number, salesCount: number) =>
  salesCount === 0 ? null : Math.round(revenue / salesCount);

/** Part of the revenue, in percent with one decimal; zero when there is no revenue. */
export const share = (part: number, whole: number) =>
  whole === 0 ? 0 : Math.round((part * 1000) / whole) / 10;

/** The summary cards (DRE resumida): revenue − CMV = gross profit, with margin and ticket. */
export function summarize(totals: {
  revenue: number;
  cogs: number;
  salesCount: number;
  itemsSold: number;
}) {
  return {
    ...totals,
    grossProfit: totals.revenue - totals.cogs,
    marginPercent: marginPercent(totals.revenue, totals.cogs),
    averageTicket: averageTicket(totals.revenue, totals.salesCount),
  };
}
