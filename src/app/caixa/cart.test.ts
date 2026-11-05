import { expect, it } from "vitest";
import { lineTotal } from "@/contracts/sales";
import {
  addToCart,
  cartTotal,
  refusal,
  removeLine,
  setQuantity,
  type CartLine,
} from "./cart";

const coffee = {
  id: "8c3f1f7a-3c1e-4a3b-9f0e-2f6a1d7c5b01",
  barcode: "789100",
  name: "Café 500 g",
  sellPrice: 1849,
  unit: "UN" as const,
  stock: 3,
  expired: false,
};
const banana = {
  id: "8c3f1f7a-3c1e-4a3b-9f0e-2f6a1d7c5b02",
  barcode: "200001",
  name: "Banana prata",
  sellPrice: 699,
  unit: "KG" as const,
  stock: 5000,
  expired: false,
};

it("rounds each weighed line half up to the cent and sums the rounded lines", () => {
  // 1,250 kg × R$ 6,99 = R$ 8,7375 → R$ 8,74; 0,500 kg × R$ 0,01 = R$ 0,005 → R$ 0,01.
  expect(lineTotal(699, 1250, "KG")).toBe(874);
  expect(lineTotal(1, 500, "KG")).toBe(1);
  expect(lineTotal(1849, 2, "UN")).toBe(3698);
  let cart: CartLine[] = addToCart([], coffee, 2);
  cart = addToCart(cart, banana, 1250);
  expect(cartTotal(cart)).toBe(3698 + 874);
});

it("merges a product scanned again into its line and keeps the order", () => {
  let cart = addToCart([], coffee, 1);
  cart = addToCart(cart, banana, 300);
  cart = addToCart(cart, { ...coffee, sellPrice: 1999 }, 1);
  expect(cart.map((line) => [line.name, line.quantity])).toEqual([
    ["Café 500 g", 2],
    ["Banana prata", 300],
  ]);
  // The latest lookup carries the current price.
  expect(cart[0].sellPrice).toBe(1999);
  expect(setQuantity(cart, coffee.id, 3)[0].quantity).toBe(3);
  expect(removeLine(cart, coffee.id).map((line) => line.id)).toEqual([
    banana.id,
  ]);
});

it("refuses an expired next batch, a product without stock and more than the stock", () => {
  expect(refusal([], { ...coffee, expired: true }, 1)?.title).toBe(
    "Lote vencido",
  );
  expect(refusal([], { ...coffee, stock: 0 }, 1)?.title).toBe("Sem estoque");
  const cart = addToCart([], coffee, 3);
  expect(refusal(cart, coffee, 1)).toEqual({
    title: "Estoque insuficiente",
    message: "Café 500 g: restam 3 un em estoque.",
  });
  expect(refusal([], banana, 5000)).toBeNull();
  expect(refusal([], banana, 5001)?.message).toBe(
    "Banana prata: restam 5,000 kg em estoque.",
  );
});
