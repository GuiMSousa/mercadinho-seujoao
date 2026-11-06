import "server-only";
import { CASH_CLOSED_MESSAGE } from "@/contracts/cash";
import { MAX_INTEGER } from "@/contracts/inventory";
import { lineTotal, settlePayments, type CreateSale } from "@/contracts/sales";
import { ServiceError } from "@/domains/auth/errors";
import { selectOpenSession } from "@/domains/cash/repository";
import { selectCustomer } from "@/domains/customers/repository";
import { selectProductsForSale } from "@/domains/inventory/repository";
import { todayInStore } from "@/domains/inventory/semaphore";
import { formatBrl } from "@ds/lib/money";
import {
  CashClosed,
  CreditRefusal,
  insertSale,
  selectSale,
  StockRefusal,
  type SaleLine,
} from "./repository";

type Actor = { id: string };

// fields.cash tells the sale screen to show the opening of the cash instead.
const cashClosed = () =>
  new ServiceError(422, CASH_CLOSED_MESSAGE, {
    fields: { cash: CASH_CLOSED_MESSAGE },
  });

const refuse = (field: string, message: string) =>
  new ServiceError(422, message, { fields: { [field]: message } });

const PRICE_CHANGED =
  "Um preço mudou desde que o item entrou na venda. Confira o novo total e finalize de novo.";

/** The stored sale, if this id was already used; a retry must repeat the same sale by the same person. */
async function recordedSale(actor: Actor, input: CreateSale) {
  const sale = await selectSale(input.id);
  if (!sale) return undefined;
  // What was handed over in each method: the cash share plus the change it gave.
  const handed = (method: string) => {
    const share = sale.payments.find((payment) => payment.method === method);
    return share && share.amount + (method === "CASH" ? sale.change : 0);
  };
  const same =
    sale.userId === actor.id &&
    sale.discount === input.discount &&
    (sale.customerId ?? undefined) === input.customerId &&
    sale.payments.length === input.payments.length &&
    input.payments.every(
      (payment) => handed(payment.method) === payment.amount,
    ) &&
    sale.items.length === input.items.length &&
    input.items.every((item) =>
      sale.items.some(
        (line) =>
          line.productId === item.productId && line.quantity === item.quantity,
      ),
    );
  if (!same)
    throw new ServiceError(
      409,
      "Esta venda já foi registrada com outros dados. Comece uma nova venda.",
    );
  // The route's receipt schema drops userId and customerId.
  return { ...sale, createdAt: sale.createdAt.toISOString() };
}

/** Why the fiado did not fit, read after the refusal: the customer may have changed meanwhile. */
async function creditRefusal(customerId: string, amount: number) {
  const customer = await selectCustomer(customerId);
  if (!customer) return refuse("customerId", "Cliente não encontrado.");
  if (!customer.active)
    return refuse(
      "customerId",
      `${customer.name} está inativo e não pode comprar no fiado.`,
    );
  const available = Math.max(0, customer.creditLimit - customer.currentDebt);
  return refuse(
    "customerId",
    `Limite de crédito excedido: ${customer.name} tem ${formatBrl(available)} disponíveis para o fiado de ${formatBrl(amount)} (limite ${formatBrl(customer.creditLimit)}, saldo devedor ${formatBrl(customer.currentDebt)}).`,
  );
}

/**
 * Registers a sale at the catalog's current prices, minus the discount, split among its payments,
 * and takes its stock by PVPS, all or nothing. Refuses it with the cash closed, when the total
 * differs from what the operator saw, when the payments do not settle it, when the fiado passes the
 * customer's credit limit, or when a product is inactive, short or has an expired batch next.
 */
export async function registerSale(
  actor: Actor,
  input: CreateSale,
  today = todayInStore(),
) {
  const previous = await recordedSale(actor, input);
  if (previous) return previous;
  // Checked again inside the transaction; here it only spares the work when the cash is closed.
  if (!(await selectOpenSession())) throw cashClosed();

  const products = new Map(
    (
      await selectProductsForSale(input.items.map((item) => item.productId))
    ).map((product) => [product.id, product]),
  );
  const lines: SaleLine[] = input.items.map(({ productId, quantity }) => {
    const product = products.get(productId);
    if (!product?.active)
      throw new ServiceError(
        409,
        `${product?.name ?? "Um dos produtos"} não está mais à venda. Remova-o e finalize de novo.`,
      );
    return {
      productId,
      name: product.name,
      unit: product.unit,
      quantity,
      unitPrice: product.sellPrice,
      unitCost: product.costPrice,
      total: lineTotal(product.sellPrice, quantity, product.unit),
      cost: lineTotal(product.costPrice, quantity, product.unit),
    };
  });
  const subtotal = lines.reduce((sum, line) => sum + line.total, 0);
  if (subtotal > MAX_INTEGER || lines.some((line) => line.cost > MAX_INTEGER))
    throw new ServiceError(422, "Total acima do limite. Divida a venda.");
  if (input.discount > subtotal)
    throw refuse("discount", "O desconto não pode passar do total da venda.");
  const total = subtotal - input.discount;
  if (total !== input.total)
    throw new ServiceError(409, PRICE_CHANGED, {
      fields: { total: PRICE_CHANGED },
    });
  const settled = settlePayments(total, input.payments);
  if (!settled.ok) throw refuse("payments", settled.message);

  try {
    await insertSale({
      id: input.id,
      userId: actor.id,
      customerId: input.customerId ?? null,
      discount: input.discount,
      total,
      amountReceived: settled.received,
      change: settled.change,
      payments: settled.payments,
      lines,
      today,
    });
  } catch (error) {
    if (error instanceof CashClosed) throw cashClosed();
    if (error instanceof CreditRefusal && input.customerId) {
      const fiado = settled.payments.find(
        (payment) => payment.method === "ON_ACCOUNT",
      );
      throw await creditRefusal(input.customerId, fiado?.amount ?? 0);
    }
    if (!(error instanceof StockRefusal)) throw error;
    const name = products.get(error.productId)?.name ?? "Um dos produtos";
    throw new ServiceError(
      409,
      error.reason === "expired"
        ? `${name}: o lote que sai primeiro está vencido. Separe o produto e avise o administrador.`
        : `Estoque insuficiente de ${name}. Confira a quantidade.`,
    );
  }
  // Read back, so a concurrent retry that recorded it first answers the same way.
  const sale = await recordedSale(actor, input);
  if (!sale) throw new Error(`Sale ${input.id} was not recorded`);
  return sale;
}
