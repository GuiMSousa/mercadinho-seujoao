import "server-only";
import { CASH_CLOSED_MESSAGE } from "@/contracts/cash";
import { MAX_INTEGER } from "@/contracts/inventory";
import { lineTotal, type CreateSale } from "@/contracts/sales";
import { ServiceError } from "@/domains/auth/errors";
import { selectOpenSession } from "@/domains/cash/repository";
import { selectProductsForSale } from "@/domains/inventory/repository";
import { todayInStore } from "@/domains/inventory/semaphore";
import {
  CashClosed,
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

const PRICE_CHANGED =
  "Um preço mudou desde que o item entrou na venda. Confira o novo total e finalize de novo.";

/** The stored sale, if this id was already used; a retry must repeat the same sale by the same person. */
async function recordedSale(actor: Actor, input: CreateSale) {
  const sale = await selectSale(input.id);
  if (!sale) return undefined;
  const same =
    sale.userId === actor.id &&
    sale.paymentMethod === input.paymentMethod &&
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
  return { ...sale, createdAt: sale.createdAt.toISOString() };
}

/**
 * Registers a sale at the catalog's current prices and takes its stock by PVPS, all or nothing.
 * Refuses it with the cash closed, when the total differs from what the operator saw, when cash
 * does not cover it, or when a product is inactive, short or has an expired batch next in line.
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
  const total = lines.reduce((sum, line) => sum + line.total, 0);
  if (total > MAX_INTEGER || lines.some((line) => line.cost > MAX_INTEGER))
    throw new ServiceError(422, "Total acima do limite. Divida a venda.");
  if (total !== input.total)
    throw new ServiceError(409, PRICE_CHANGED, {
      fields: { total: PRICE_CHANGED },
    });
  const amountReceived =
    input.paymentMethod === "CASH" ? (input.amountReceived ?? 0) : total;
  if (amountReceived < total) {
    const message = "O valor recebido é menor que o total.";
    throw new ServiceError(422, message, {
      fields: { amountReceived: message },
    });
  }

  try {
    await insertSale({
      id: input.id,
      userId: actor.id,
      paymentMethod: input.paymentMethod,
      total,
      amountReceived,
      change: amountReceived - total,
      lines,
      today,
    });
  } catch (error) {
    if (error instanceof CashClosed) throw cashClosed();
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
