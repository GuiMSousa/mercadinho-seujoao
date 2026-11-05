import { expect, it } from "vitest";
import { brl, receiptText, whatsappLink } from "./receipt-text";

const receipt = {
  id: "8c3f1f7a-3c1e-4a3b-9f0e-2f6a1d7c5b09",
  number: 42,
  createdAt: "2026-11-05T19:20:00.000Z",
  paymentMethod: "CASH" as const,
  total: 4572,
  amountReceived: 5000,
  change: 428,
  items: [
    {
      productId: "8c3f1f7a-3c1e-4a3b-9f0e-2f6a1d7c5b01",
      name: "Café 500 g",
      unit: "UN" as const,
      quantity: 2,
      unitPrice: 1849,
      total: 3698,
    },
    {
      productId: "8c3f1f7a-3c1e-4a3b-9f0e-2f6a1d7c5b02",
      name: "Banana prata",
      unit: "KG" as const,
      quantity: 1250,
      unitPrice: 699,
      total: 874,
    },
  ],
};
const store = { name: "Mercadinho Bom Preço", document: "" };

it("formats cents as reais without floating point", () => {
  expect(brl(123456)).toBe("R$ 1.234,56");
  expect(brl(5)).toBe("R$ 0,05");
  expect(brl(-428)).toBe("−R$ 4,28");
});

it("writes the receipt in the store's time zone, with change only for cash", () => {
  expect(receiptText(store, receipt)).toBe(
    [
      "*Mercadinho Bom Preço*",
      "Venda nº 42 · 05/11/2026 16:20",
      "",
      "Café 500 g",
      "2 un × R$ 18,49 = R$ 36,98",
      "Banana prata",
      "1,250 kg × R$ 6,99/kg = R$ 8,74",
      "",
      "*Total: R$ 45,72*",
      "Pagamento: Dinheiro",
      "Recebido: R$ 50,00",
      "Troco: R$ 4,28",
      "",
      "Comprovante sem valor fiscal.",
    ].join("\n"),
  );
  const pix = receiptText(store, {
    ...receipt,
    paymentMethod: "PIX",
    amountReceived: 4572,
    change: 0,
  });
  expect(pix).toContain("Pagamento: Pix");
  expect(pix).not.toContain("Troco");
});

it("puts the whole text in one encoded parameter", () => {
  expect(whatsappLink("Total: R$ 1,00 & obrigado")).toBe(
    "https://wa.me/?text=Total%3A%20R%24%201%2C00%20%26%20obrigado",
  );
});
