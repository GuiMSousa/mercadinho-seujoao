import { expect, it } from "vitest";
import {
  daysUntil,
  expirySignal,
  stockSignal,
  todayInStore,
  worstSignal,
} from "./semaphore";

it("uses the store's calendar day, not the server's", () => {
  // 01:30 UTC on Nov 4 is still the evening of Nov 3 in São Paulo.
  expect(todayInStore(new Date("2026-11-04T01:30:00Z"))).toBe("2026-11-03");
  expect(todayInStore(new Date("2026-11-04T03:00:00Z"))).toBe("2026-11-04");
});

it("counts whole days, across a month and backwards", () => {
  expect(daysUntil("2026-11-03", "2026-11-03")).toBe(0);
  expect(daysUntil("2026-12-01", "2026-11-03")).toBe(28);
  expect(daysUntil("2026-11-02", "2026-11-03")).toBe(-1);
});

it("turns expiry into the semaphore at the agreed limits", () => {
  const expected = [
    [-1, "red"],
    [0, "red"],
    [7, "red"],
    [8, "yellow"],
    [30, "yellow"],
    [31, "green"],
    [null, "green"],
  ] as const;
  for (const [days, signal] of expected) {
    expect(expirySignal(days)).toBe(signal);
  }
});

it("turns stock into the semaphore at the agreed limits", () => {
  expect(stockSignal({ stock: 0, minStock: 0 })).toBe("red");
  expect(stockSignal({ stock: 6, minStock: 6 })).toBe("yellow");
  expect(stockSignal({ stock: 5, minStock: 6 })).toBe("yellow");
  expect(stockSignal({ stock: 7, minStock: 6 })).toBe("green");
  expect(stockSignal({ stock: 1, minStock: 0 })).toBe("green");
});

it("keeps the worst signal", () => {
  expect(worstSignal([])).toBe("green");
  expect(worstSignal(["green", "yellow"])).toBe("yellow");
  expect(worstSignal(["yellow", "red", "green"])).toBe("red");
});
