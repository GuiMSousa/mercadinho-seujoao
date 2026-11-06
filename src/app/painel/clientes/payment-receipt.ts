import type { CustomerRow, CustomerTransaction } from "@/contracts/customers";
import { brl, type ReceiptStore } from "@/app/caixa/receipt-text";
import { formatDocument } from "@/lib/document";
import { formatDateTime } from "../_lib/format";
import { whatsappNumber } from "../estoque/reposicao/order-text";

type Customer = Pick<CustomerRow, "name" | "phone" | "currentDebt">;

/** The proof of a fiado payment, line by line; the first line is the store's name. */
export function paymentReceiptLines(
  store: ReceiptStore,
  customer: Customer,
  payment: CustomerTransaction,
) {
  return [
    store.name,
    ...(store.document ? [`CNPJ/CPF ${formatDocument(store.document)}`] : []),
    "Comprovante de pagamento de fiado",
    formatDateTime(payment.createdAt),
    "",
    `Cliente: ${customer.name}`,
    `Valor pago: ${brl(payment.amount)}`,
    ...(payment.notes ? [`Observação: ${payment.notes}`] : []),
    `Saldo devedor: ${brl(customer.currentDebt)}`,
    "",
    "Comprovante sem valor fiscal.",
  ];
}

/** WhatsApp to the customer's number when there is one; otherwise the person picks the contact. */
export function paymentReceiptLink(
  store: ReceiptStore,
  customer: Customer,
  payment: CustomerTransaction,
) {
  const [title, ...rest] = paymentReceiptLines(store, customer, payment);
  const text = [`*${title}*`, ...rest].join("\n");
  return `https://wa.me/${whatsappNumber(customer.phone) ?? ""}?text=${encodeURIComponent(text)}`;
}
