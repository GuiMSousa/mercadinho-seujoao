import { expect, it } from "vitest";
import { brl, receiptText, whatsappLink } from "./receipt-text";

const receipt = {
  id: "8c3f1f7a-3c1e-4a3b-9f0e-2f6a1d7c5b09",
  number: 42,
  createdAt: "2026-11-05T19:20:00.000Z",
  discount: 0,
  total: 4572,
  amountReceived: 5000,
  change: 428,
  payments: [{ method: "CASH" as const, amount: 4572 }],
  customerName: null,
  items: [
    {
      productId: "8c3f1f7a-3c1e-4a3b-9f0e-2f6a1d7c5b01",
      name: "Café 500 g",
      unit: "UN" as const,
      quantity: 2,
      unitPrice: 1849,
      discount: 0,
      total: 3698,
    },
    {
      productId: "8c3f1f7a-3c1e-4a3b-9f0e-2f6a1d7c5b02",
      name: "Banana prata",
      unit: "KG" as const,
      quantity: 1250,
      unitPrice: 699,
      discount: 0,
      total: 874,
    },
  ],
};
const store = { name: "Mercadinho Bom Preço", document: "" };

it("formats cents as reais without floating point", () => {
  expect(brl(123456)).toBe("R$\u00a01.234,56");
  expect(brl(5)).toBe("R$\u00a00,05");
  expect(brl(-428)).toBe("−R$\u00a04,28");
});

it("writes the receipt in the store's time zone, with change only for cash", () => {
  expect(receiptText(store, receipt)).toBe(
    [
      "*Mercadinho Bom Preço*",
      "Venda nº 42 · 05/11/2026 16:20",
      "",
      "Café 500 g",
      "2 un × R$\u00a018,49 = R$\u00a036,98",
      "Banana prata",
      "1,250 kg × R$\u00a06,99/kg = R$\u00a08,74",
      "",
      "*Total: R$\u00a045,72*",
      "Dinheiro: R$\u00a045,72",
      "Recebido em dinheiro: R$\u00a050,00",
      "Troco: R$\u00a04,28",
      "",
      "Comprovante sem valor fiscal.",
    ].join("\n"),
  );
  const pix = receiptText(store, {
    ...receipt,
    payments: [{ method: "PIX", amount: 4572 }],
    amountReceived: 4572,
    change: 0,
  });
  expect(pix).toContain("Pix: R$\u00a045,72");
  expect(pix).not.toContain("Troco");
});

it("lists the discount and each payment of a split sale, naming the fiado customer", () => {
  // R$ 50,72 of items, R$ 5,00 off; R$ 20,00 in cash (R$ 25,00 handed over), R$ 10,00 by Pix and
  // R$ 15,72 on account.
  const text = receiptText(store, {
    ...receipt,
    discount: 500,
    total: 4572,
    amountReceived: 5072,
    change: 500,
    payments: [
      { method: "CASH", amount: 2000 },
      { method: "PIX", amount: 1000 },
      { method: "ON_ACCOUNT", amount: 1572 },
    ],
    customerName: "Dona Maria",
  });
  expect(text).toContain(
    [
      "Subtotal: R$\u00a050,72",
      "Desconto: −R$\u00a05,00",
      "*Total: R$\u00a045,72*",
      "Dinheiro: R$\u00a020,00",
      "Pix: R$\u00a010,00",
      "Fiado (Dona Maria): R$\u00a015,72",
      "Recebido em dinheiro: R$\u00a025,00",
      "Troco: R$\u00a05,00",
    ].join("\n"),
  );
});

it("puts the whole text in one encoded parameter", () => {
  expect(whatsappLink("Total: R$ 1,00 & obrigado")).toBe(
    "https://wa.me/?text=Total%3A%20R%24%201%2C00%20%26%20obrigado",
  );
});

it("shows a line's own discount next to it, and vouchers by name", () => {
  const text = receiptText(store, {
    ...receipt,
    total: 4372,
    amountReceived: 4372,
    change: 0,
    payments: [
      { method: "MEAL_VOUCHER", amount: 2000 },
      { method: "FOOD_VOUCHER", amount: 2372 },
    ],
    items: [
      { ...receipt.items[0], discount: 200, total: 3498 },
      receipt.items[1],
    ],
  });
  expect(text).toContain(
    "2 un × R$\u00a018,49 − R$\u00a02,00 de desconto = R$\u00a034,98",
  );
  expect(text).toContain("Vale-refeição (VR): R$\u00a020,00");
  expect(text).toContain("Vale-alimentação (VA): R$\u00a023,72");
});
