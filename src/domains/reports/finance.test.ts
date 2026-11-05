import { expect, it } from "vitest";
import { marginLevel, reportQuerySchema } from "@/contracts/reports";
import { averageTicket, marginPercent, share, summarize } from "./finance";
import { addDays, resolvePeriod } from "./period";

it("derives gross profit, margin and ticket from revenue and CMV", () => {
  // R$ 1.000,00 sold, R$ 650,00 of cost, 8 sales.
  expect(
    summarize({ revenue: 100000, cogs: 65000, salesCount: 8, itemsSold: 21 }),
  ).toEqual({
    revenue: 100000,
    cogs: 65000,
    salesCount: 8,
    itemsSold: 21,
    grossProfit: 35000,
    marginPercent: 35,
    averageTicket: 12500,
  });
});

it("rounds the margin to one decimal, allows a loss and has none without revenue", () => {
  expect(marginPercent(3000, 2000)).toBe(33.3);
  expect(marginPercent(3000, 1000)).toBe(66.7);
  expect(marginPercent(1000, 1250)).toBe(-25);
  expect(marginPercent(0, 0)).toBeNull();
  expect(averageTicket(1000, 3)).toBe(333);
  expect(averageTicket(0, 0)).toBeNull();
  expect(share(1, 3)).toBe(33.3);
  expect(share(5, 0)).toBe(0);
});

it("colors the margin green from 20%, yellow from 10% to under 20%, red below 10%", () => {
  expect(marginLevel(20)).toBe("good");
  expect(marginLevel(19.9)).toBe("fair");
  expect(marginLevel(10)).toBe("fair");
  expect(marginLevel(9.9)).toBe("low");
  expect(marginLevel(-5)).toBe("low");
  expect(marginLevel(null)).toBeNull();
});

it("turns the quick filters into calendar days counted from the store's today", () => {
  const today = "2026-03-01";
  expect(resolvePeriod({ period: "today" }, today)).toEqual({
    from: today,
    to: today,
  });
  // 2026 is not a leap year: 6 days before 1 March is 23 February.
  expect(resolvePeriod({ period: "7d" }, today)).toEqual({
    from: "2026-02-23",
    to: today,
  });
  expect(resolvePeriod({ period: "30d" }, "2026-11-05")).toEqual({
    from: "2026-10-07",
    to: "2026-11-05",
  });
  expect(resolvePeriod({ period: "month" }, "2026-11-05")).toEqual({
    from: "2026-11-01",
    to: "2026-11-05",
  });
  expect(
    resolvePeriod(
      { period: "custom", from: "2026-10-01", to: "2026-10-31" },
      today,
    ),
  ).toEqual({ from: "2026-10-01", to: "2026-10-31" });
  expect(addDays("2028-03-01", -1)).toBe("2028-02-29");
});

it("asks a custom period for both dates, in order, and at most 366 days", () => {
  const parse = (query: Record<string, string>) =>
    reportQuerySchema.safeParse(query).success;
  expect(parse({})).toBe(true);
  expect(parse({ period: "custom", from: "2026-10-01" })).toBe(false);
  expect(
    parse({ period: "custom", from: "2026-10-02", to: "2026-10-01" }),
  ).toBe(false);
  expect(
    parse({ period: "custom", from: "2025-11-05", to: "2026-11-05" }),
  ).toBe(true);
  expect(
    parse({ period: "custom", from: "2025-11-04", to: "2026-11-05" }),
  ).toBe(false);
  expect(parse({ period: "week" })).toBe(false);
});
