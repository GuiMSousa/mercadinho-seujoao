import type { ReportPeriod, ReportQuery } from "@/contracts/reports";

const DAY_MS = 86_400_000;

/** `date` moved by `days` calendar days ("2026-03-01", −1 → "2026-02-28"); read as UTC, so no DST shift. */
export const addDays = (date: string, days: number) =>
  new Date(Date.parse(date) + days * DAY_MS).toISOString().slice(0, 10);

/**
 * The calendar days, inclusive, a report covers, counted from the store's `today`:
 * the last 7 days are today and the 6 before it; the month starts on its first day.
 */
export function resolvePeriod(
  query: Pick<ReportQuery, "period" | "from" | "to">,
  today: string,
): ReportPeriod {
  switch (query.period) {
    case "today":
      return { from: today, to: today };
    case "7d":
      return { from: addDays(today, -6), to: today };
    case "30d":
      return { from: addDays(today, -29), to: today };
    case "month":
      return { from: `${today.slice(0, 8)}01`, to: today };
    case "custom":
      // The query schema already required both dates, in order.
      return { from: query.from as string, to: query.to as string };
  }
}
