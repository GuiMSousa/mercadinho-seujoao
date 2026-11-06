import { PAYMENT_LABELS, type SaleReceipt } from "@/contracts/sales";
import { formatDateTime } from "@/app/painel/_lib/format";
import { formatQuantity, unitSuffix } from "@/app/painel/produtos/product-form";
import { formatBrl as brl } from "@ds/lib/money";

export { PAYMENT_LABELS };

export type ReceiptStore = { name: string; document: string };

export { brl };

type Item = SaleReceipt["items"][number];

/** "2 un × R$ 18,49" or "1,250 kg × R$ 6,99/kg". */
export function itemDetail({ quantity, unit, unitPrice }: Item) {
  const price =
    unit === "UN" ? brl(unitPrice) : `${brl(unitPrice)}/${unitSuffix(unit)}`;
  return `${formatQuantity(quantity, unit)} × ${price}`;
}

const paymentLabel = (
  method: SaleReceipt["payments"][number]["method"],
  customerName: string | null,
) =>
  method === "ON_ACCOUNT" && customerName
    ? `Fiado (${customerName})`
    : PAYMENT_LABELS[method];

/**
 * The rows under the items, as label and amount: subtotal and discount when there is one, the total,
 * each payment, and the cash handed over with its change.
 */
export function receiptTotals(receipt: SaleReceipt) {
  const cash = receipt.payments.find((payment) => payment.method === "CASH");
  return [
    ...(receipt.discount > 0
      ? [
          ["Subtotal", brl(receipt.total + receipt.discount)],
          ["Desconto", brl(-receipt.discount)],
        ]
      : []),
    ["Total", brl(receipt.total)],
    ...receipt.payments.map((payment) => [
      paymentLabel(payment.method, receipt.customerName),
      brl(payment.amount),
    ]),
    ...(cash
      ? [
          ["Recebido em dinheiro", brl(cash.amount + receipt.change)],
          ["Troco", brl(receipt.change)],
        ]
      : []),
  ] as [string, string][];
}

/** Plain-text receipt for WhatsApp (*bold*); it is not a fiscal document. */
export function receiptText(store: ReceiptStore, receipt: SaleReceipt) {
  return [
    `*${store.name}*`,
    `Venda nº ${receipt.number} · ${formatDateTime(receipt.createdAt)}`,
    "",
    ...receipt.items.map(
      (item) =>
        `${item.name}\n${itemDetail(item)}${item.discount > 0 ? ` − ${brl(item.discount)} de desconto` : ""} = ${brl(item.total)}`,
    ),
    "",
    ...receiptTotals(receipt).map(([label, amount]) =>
      label === "Total" ? `*${label}: ${amount}*` : `${label}: ${amount}`,
    ),
    "",
    "Comprovante sem valor fiscal.",
  ].join("\n");
}

/** Opens WhatsApp with the text ready; the person picks the contact and sends it. */
export const whatsappLink = (text: string) =>
  `https://wa.me/?text=${encodeURIComponent(text)}`;
