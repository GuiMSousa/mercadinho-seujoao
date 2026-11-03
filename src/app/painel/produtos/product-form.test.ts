import { expect, it } from "vitest";
import type { ProductRow } from "@/contracts/inventory";
import {
  centsToInput,
  formatQuantity,
  parseCents,
  parseQuantity,
  productPatch,
  quantityToInput,
} from "./product-form";

it("reads pt-BR amounts as integer cents, with no floating point error", () => {
  expect(parseCents("18,49")).toBe(1849);
  expect(parseCents("12,9")).toBe(1290);
  expect(parseCents(" 7 ")).toBe(700);
  expect(parseCents("1.234,56")).toBe(123456);
  // 19,99 × 100 is 1998.9999999999998 in floating point.
  expect(parseCents("19,99")).toBe(1999);
  expect(parseCents("0,07")).toBe(7);
});

it("refuses what is not an amount", () => {
  for (const text of ["", "abc", "-1", "12.90", "1,234", "1.23,00", "12,"]) {
    expect(parseCents(text)).toBeNull();
  }
});

it("writes cents back as the form shows them", () => {
  expect(centsToInput(1849)).toBe("18,49");
  expect(centsToInput(7)).toBe("0,07");
  expect(parseCents(centsToInput(123456))).toBe(123456);
});

it("stores kg as grams and L as milliliters, and keeps units whole", () => {
  expect(parseQuantity("14", "UN")).toBe(14);
  expect(parseQuantity("1,5", "UN")).toBeNull();
  expect(parseQuantity("1,250", "KG")).toBe(1250);
  expect(parseQuantity("2", "KG")).toBe(2000);
  expect(parseQuantity("0,5", "L")).toBe(500);
  expect(parseQuantity("1,2345", "KG")).toBeNull();
  expect(parseQuantity("-1", "KG")).toBeNull();
});

it("shows quantities in the unit of the product", () => {
  expect(formatQuantity(1400, "UN")).toBe("1.400 un");
  expect(formatQuantity(1250, "KG")).toBe("1,250 kg");
  expect(formatQuantity(500, "L")).toBe("0,500 L");
  expect(quantityToInput(1250, "KG")).toBe("1,250");
  expect(quantityToInput(14, "UN")).toBe("14");
});

const product: ProductRow = {
  id: "7f1d8c1e-0d2b-4a8e-9c3f-2b6a1e5d4c3b",
  barcode: "789",
  name: "Café",
  categoryId: "7f1d8c1e-0d2b-4a8e-9c3f-2b6a1e5d4c3c",
  costPrice: 1290,
  sellPrice: 1849,
  minStock: 6,
  unit: "UN",
  active: true,
  stock: 3,
  hasBatches: true,
};

it("sends only the fields that changed", () => {
  const { barcode, name, categoryId, costPrice, sellPrice, minStock } = product;
  const same = {
    barcode,
    name,
    categoryId,
    costPrice,
    sellPrice,
    minStock,
    unit: product.unit,
    active: product.active,
  };
  expect(productPatch(product, same)).toEqual({});
  expect(productPatch(product, { ...same, sellPrice: 1999 })).toEqual({
    sellPrice: 1999,
  });
  // Between kg and L the stored minimum can stay equal; the server still asks for it.
  expect(productPatch(product, { ...same, unit: "KG" })).toEqual({
    unit: "KG",
    minStock: 6,
  });
});
