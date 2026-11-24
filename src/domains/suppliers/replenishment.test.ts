import { expect, it } from "vitest";
import { suggestedQuantity, weeklyAverage } from "./replenishment";

it("averages the 28 days into a week, rounding a fraction up", () => {
  expect(weeklyAverage(0)).toBe(0);
  expect(weeklyAverage(28)).toBe(7);
  expect(weeklyAverage(1)).toBe(1);
  // 2,5 kg in 28 days: 625 g a week.
  expect(weeklyAverage(2500)).toBe(625);
});

it("buys the minimum plus a week of sales, never less than twice the minimum", () => {
  // No sales: the old rule, 2 × 5 − 3.
  expect(suggestedQuantity(3, 5)).toBe(7);
  // 40 sold in 28 days = 10 a week: 5 + 10 − 3.
  expect(suggestedQuantity(3, 5, 40)).toBe(12);
  // Slow seller: 2 a week is below the minimum, so twice the minimum wins.
  expect(suggestedQuantity(3, 5, 8)).toBe(7);
  // Shelf already covers it.
  expect(suggestedQuantity(20, 5, 40)).toBe(0);
});
