import { expect, it } from "vitest";
import { allocatePvps, type StockBatch } from "./pvps";

const batch = (
  id: string,
  expirationDate: string | null,
  quantity: number,
  createdAt = "2026-01-01T00:00:00Z",
): StockBatch => ({
  id,
  expirationDate,
  quantity,
  createdAt: new Date(createdAt),
});

it("takes from the batch that expires first, whatever the entry order", () => {
  const stock = [
    batch("late", "2027-01-10", 10),
    batch("soon", "2026-11-10", 10),
  ];
  expect(allocatePvps(stock, 4)).toEqual([{ batchId: "soon", quantity: 4 }]);
});

it("spreads over the next batches when the first does not cover it", () => {
  const stock = [
    batch("c", "2027-03-01", 5),
    batch("a", "2026-12-01", 2),
    batch("b", "2027-01-01", 3),
  ];
  expect(allocatePvps(stock, 6)).toEqual([
    { batchId: "a", quantity: 2 },
    { batchId: "b", quantity: 3 },
    { batchId: "c", quantity: 1 },
  ]);
});

it("breaks a date tie by the older entry and skips empty batches", () => {
  const stock = [
    batch("newer", "2026-12-01", 5, "2026-02-01T00:00:00Z"),
    batch("empty", "2026-11-01", 0),
    batch("older", "2026-12-01", 5, "2026-01-01T00:00:00Z"),
  ];
  expect(allocatePvps(stock, 1)).toEqual([{ batchId: "older", quantity: 1 }]);
});

it("uses exactly all the stock and refuses a unit more", () => {
  const stock = [batch("a", "2026-12-01", 2), batch("b", "2027-01-01", 3)];
  expect(allocatePvps(stock, 5)).toHaveLength(2);
  expect(allocatePvps(stock, 6)).toBeNull();
  expect(allocatePvps([], 1)).toBeNull();
});

it("leaves batches without expiration for last", () => {
  const stock = [batch("none", null, 5), batch("late", "2027-01-10", 2)];
  expect(allocatePvps(stock, 3)).toEqual([
    { batchId: "late", quantity: 2 },
    { batchId: "none", quantity: 1 },
  ]);
});
