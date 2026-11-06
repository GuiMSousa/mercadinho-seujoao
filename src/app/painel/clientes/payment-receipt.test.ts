import { expect, it } from "vitest";
import { paymentReceiptLines, paymentReceiptLink } from "./payment-receipt";

const store = { name: "Mercadinho Bom Preço", document: "11222333000181" };
const payment = {
  id: "8c3f1f7a-3c1e-4a3b-9f0e-2f6a1d7c5b09",
  type: "PAYMENT" as const,
  amount: 2000,
  saleNumber: null,
  userName: "Ana",
  notes: "Pix",
  createdAt: "2026-11-06T13:30:00.000Z",
};
const maria = { name: "Dona Maria", phone: "11987654321", currentDebt: 3000 };

it("states what was paid and what is still owed, in the store's time zone", () => {
  expect(paymentReceiptLines(store, maria, payment)).toEqual([
    "Mercadinho Bom Preço",
    "CNPJ/CPF 11.222.333/0001-81",
    "Comprovante de pagamento de fiado",
    "06/11/2026 10:30",
    "",
    "Cliente: Dona Maria",
    "Valor pago: R$ 20,00",
    "Observação: Pix",
    "Saldo devedor: R$ 30,00",
    "",
    "Comprovante sem valor fiscal.",
  ]);
});

it("sends the WhatsApp to the customer's number, or lets the person pick one", () => {
  expect(paymentReceiptLink(store, maria, payment)).toMatch(
    /^https:\/\/wa\.me\/5511987654321\?text=\*Mercadinho%20Bom%20Pre%C3%A7o\*%0A/,
  );
  expect(paymentReceiptLink(store, { ...maria, phone: "" }, payment)).toMatch(
    /^https:\/\/wa\.me\/\?text=/,
  );
});
