import type { ReplenishmentGroup } from "@/contracts/suppliers";
import { formatQuantity } from "@/app/painel/produtos/product-form";
import { formatDocument, onlyDigits } from "@/lib/document";

export type OrderStore = { name: string; document: string; phone: string };

/**
 * The number wa.me expects: country code and number, digits only. A Brazilian DDD + number
 * (10 or 11 digits) gets 55; a number already with a country code stays; anything else, null.
 */
export function whatsappNumber(phone: string) {
  const digits = onlyDigits(phone);
  if (/^\d{10,11}$/.test(digits)) return `55${digits}`;
  return /^\d{12,13}$/.test(digits) ? digits : null;
}

/** The items worth ordering: those with something to buy. */
export const orderItems = (group: ReplenishmentGroup) =>
  group.items.filter((item) => item.suggested > 0);

/** Purchase order for WhatsApp (*bold*), with the store's details and the items to buy. */
export function orderText(store: OrderStore, group: ReplenishmentGroup) {
  const contact = group.supplier?.contactPerson
    ? ` (${group.supplier.contactPerson})`
    : "";
  const details = [
    store.document && `CNPJ/CPF ${formatDocument(store.document)}`,
    store.phone && `Tel. ${store.phone}`,
  ].filter(Boolean);
  return [
    `*Pedido de compra — ${store.name}*`,
    ...(details.length ? [details.join(" · ")] : []),
    `Para: ${group.supplier?.name ?? "Fornecedor"}${contact}`,
    "",
    ...orderItems(group).map((item) => {
      const code = item.supplierCode ? ` (cód. ${item.supplierCode})` : "";
      return `• ${item.name}${code}: ${formatQuantity(item.suggested, item.unit)}`;
    }),
    "",
    "Por favor, confirme disponibilidade, preço e prazo de entrega.",
  ].join("\n");
}

/** Opens WhatsApp on the supplier's chat with the order ready; null without a usable number. */
export function orderLink(store: OrderStore, group: ReplenishmentGroup) {
  const number = whatsappNumber(group.supplier?.phone ?? "");
  if (!number || orderItems(group).length === 0) return null;
  return `https://wa.me/${number}?text=${encodeURIComponent(orderText(store, group))}`;
}
