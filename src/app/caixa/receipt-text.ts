import type { PaymentMethod, SaleReceipt } from "@/contracts/sales";
import { formatDateTime } from "@/app/painel/_lib/format";
import { formatQuantity, unitSuffix } from "@/app/painel/produtos/product-form";
import { formatBrl as brl } from "@ds/lib/money";

export const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  CASH: "Dinheiro",
  PIX: "Pix",
  DEBIT: "Cartão de débito",
  CREDIT: "Cartão de crédito",
};

export type ReceiptStore = { name: string; document: string };

export { brl };

type Item = SaleReceipt["items"][number];

/** "2 un × R$ 18,49" or "1,250 kg × R$ 6,99/kg". */
export function itemDetail({ quantity, unit, unitPrice }: Item) {
  const price =
    unit === "UN" ? brl(unitPrice) : `${brl(unitPrice)}/${unitSuffix(unit)}`;
  return `${formatQuantity(quantity, unit)} × ${price}`;
}

/** Plain-text receipt for WhatsApp (*bold*); it is not a fiscal document. */
export function receiptText(store: ReceiptStore, receipt: SaleReceipt) {
  return [
    `*${store.name}*`,
    `Venda nº ${receipt.number} · ${formatDateTime(receipt.createdAt)}`,
    "",
    ...receipt.items.map(
      (item) => `${item.name}\n${itemDetail(item)} = ${brl(item.total)}`,
    ),
    "",
    `*Total: ${brl(receipt.total)}*`,
    `Pagamento: ${PAYMENT_LABELS[receipt.paymentMethod]}`,
    ...(receipt.paymentMethod === "CASH"
      ? [
          `Recebido: ${brl(receipt.amountReceived)}`,
          `Troco: ${brl(receipt.change)}`,
        ]
      : []),
    "",
    "Comprovante sem valor fiscal.",
  ].join("\n");
}

/** Opens WhatsApp with the text ready; the person picks the contact and sends it. */
export const whatsappLink = (text: string) =>
  `https://wa.me/?text=${encodeURIComponent(text)}`;
