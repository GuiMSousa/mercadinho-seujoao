import { expect, it } from "vitest";
import { orderLink, orderText, whatsappNumber } from "./order-text";

const store = {
  name: "Mercadinho Bom Preço",
  document: "11222333000181",
  phone: "11987654321",
};
const supplier = {
  id: "8c3f1f7a-3c1e-4a3b-9f0e-2f6a1d7c5b20",
  name: "Distribuidora Sul",
  document: "",
  phone: "(11) 3456-7890",
  email: "",
  contactPerson: "Marcos",
  active: true,
};
const item = {
  barcode: "789",
  stock: 2,
  minStock: 5,
  nearestExpiration: null,
  daysLeft: null,
  signal: "yellow" as const,
};
const group = {
  supplier,
  items: [
    {
      ...item,
      productId: "8c3f1f7a-3c1e-4a3b-9f0e-2f6a1d7c5b21",
      name: "Café 500 g",
      unit: "UN" as const,
      suggested: 8,
      supplierCode: "CF-500",
    },
    {
      ...item,
      productId: "8c3f1f7a-3c1e-4a3b-9f0e-2f6a1d7c5b22",
      name: "Banana prata",
      unit: "KG" as const,
      suggested: 2500,
      supplierCode: "",
    },
    // Listed for its expiry, but nothing to buy: left out of the order.
    {
      ...item,
      productId: "8c3f1f7a-3c1e-4a3b-9f0e-2f6a1d7c5b23",
      name: "Iogurte",
      unit: "UN" as const,
      suggested: 0,
      supplierCode: "",
    },
  ],
};

it("puts the Brazilian country code on DDD + number and refuses what is not a phone", () => {
  expect(whatsappNumber("(11) 98765-4321")).toBe("5511987654321");
  expect(whatsappNumber("1134567890")).toBe("551134567890");
  expect(whatsappNumber("+55 11 98765-4321")).toBe("5511987654321");
  expect(whatsappNumber("98765-4321")).toBeNull();
  expect(whatsappNumber("")).toBeNull();
});

it("writes the order with the store's details, codes and quantities in the product's unit", () => {
  expect(orderText(store, group)).toBe(
    [
      "*Pedido de compra — Mercadinho Bom Preço*",
      "CNPJ/CPF 11.222.333/0001-81 · Tel. 11987654321",
      "Para: Distribuidora Sul (Marcos)",
      "",
      "• Café 500 g (cód. CF-500): 8 un",
      "• Banana prata: 2,500 kg",
      "",
      "Por favor, confirme disponibilidade, preço e prazo de entrega.",
    ].join("\n"),
  );
});

it("links to the supplier's chat, and to nothing without a number or anything to buy", () => {
  expect(orderLink(store, group)).toMatch(
    /^https:\/\/wa\.me\/551134567890\?text=\*Pedido%20de%20compra/,
  );
  expect(
    orderLink(store, { ...group, supplier: { ...supplier, phone: "" } }),
  ).toBeNull();
  expect(orderLink(store, { ...group, items: [group.items[2]] })).toBeNull();
});
