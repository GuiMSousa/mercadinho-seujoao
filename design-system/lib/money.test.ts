import { expect, it } from "vitest";
import { formatCents } from "./money";

it("formats integer cents in pt-BR with thousands separators", () => {
  expect(formatCents(123456)).toEqual({
    negative: false,
    integer: "1.234",
    cents: "56",
  });
  expect(formatCents(5)).toEqual({
    negative: false,
    integer: "0",
    cents: "05",
  });
  expect(formatCents(-100000000)).toEqual({
    negative: true,
    integer: "1.000.000",
    cents: "00",
  });
});

it("refuses non-integer amounts instead of rounding money silently", () => {
  expect(() => formatCents(10.5)).toThrow(RangeError);
  expect(() => formatCents(Number.NaN)).toThrow(RangeError);
});
