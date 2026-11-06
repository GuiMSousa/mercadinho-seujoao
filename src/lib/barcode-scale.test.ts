import { expect, it } from "vitest";
import { lineTotal } from "@/contracts/sales";
import { parseScaleLabel, scaleGrams } from "./barcode-scale";

it("reads a weight label: 21 + product code + grams + check digit", () => {
  expect(parseScaleLabel("2100123015009")).toEqual({
    kind: "weight",
    code: "00123",
    grams: 1500,
  });
});

it("reads a price label: 20 + product code + cents + check digit", () => {
  expect(parseScaleLabel("2000123023472")).toEqual({
    kind: "price",
    code: "00123",
    cents: 2347,
  });
});

it("leaves every other code alone", () => {
  // A regular EAN-13, valid check digit included.
  expect(parseScaleLabel("7891000315507")).toBeNull();
  // Prefix 2 with another second digit: an in-store code, not a scale label.
  expect(parseScaleLabel("2200123015006")).toBeNull();
  // A misread or mistyped digit fails the check digit.
  expect(parseScaleLabel("2100123015008")).toBeNull();
  expect(parseScaleLabel("2100123016009")).toBeNull();
  // Not 13 digits.
  expect(parseScaleLabel("210012301500")).toBeNull();
  expect(parseScaleLabel("21001230150090")).toBeNull();
  expect(parseScaleLabel("21OO123015009")).toBeNull();
  expect(parseScaleLabel("")).toBeNull();
  // Nothing weighed or priced.
  expect(parseScaleLabel("2100123000005")).toBeNull();
});

it("sells the printed weight as is", () => {
  const label = parseScaleLabel("2100123015009")!;
  expect(scaleGrams(label, 3990)).toBe(1500);
  expect(lineTotal(3990, 1500, "KG")).toBe(5985);
});

it("turns a price label into grams at the catalog price per kg", () => {
  const label = parseScaleLabel("2000123023472")!;
  // R$ 23,47 at R$ 80,00/kg: 293.375 g, sold as 293 g = R$ 23,44.
  expect(scaleGrams(label, 8000)).toBe(293);
  // An exact division keeps the printed amount.
  expect(scaleGrams({ kind: "price", code: "00123", cents: 3990 }, 3990)).toBe(
    1000,
  );
  // No price, or too little money for one gram: nothing to sell.
  expect(scaleGrams(label, 0)).toBeNull();
  expect(
    scaleGrams({ kind: "price", code: "00123", cents: 1 }, 8000),
  ).toBeNull();
});

it("never charges more than the printed amount, and at most a gram's price less", () => {
  for (const price of [1, 399, 999, 3990, 7999, 8000, 12345, 99999])
    for (const cents of [1, 99, 2347, 5000, 99999]) {
      const grams = scaleGrams({ kind: "price", code: "00001", cents }, price);
      if (grams === null) {
        expect(cents * 1000).toBeLessThan(price);
        continue;
      }
      const total = lineTotal(price, grams, "KG");
      expect(total, `${cents} at ${price}`).toBeLessThanOrEqual(cents);
      expect(total, `${cents} at ${price}`).toBeGreaterThanOrEqual(
        Math.floor(cents - price / 1000 - 0.5),
      );
    }
});
