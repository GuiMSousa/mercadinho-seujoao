import "server-only";
import { UNIT_LOCKED_MESSAGE } from "@/contracts/inventory";
import type {
  CreateBatch,
  CreateCategory,
  CreateProduct,
  ListQuery,
  UpdateProduct,
} from "@/contracts/inventory";
import { logActivity } from "@/domains/activity/service";
import { ServiceError } from "@/domains/auth/errors";
import { uniqueViolation } from "@/infrastructure/db/errors";
import {
  categoryExists,
  consumeBatches,
  countProducts,
  insertBatchWithMovement,
  insertCategory,
  insertProduct,
  selectActiveProductByBarcode,
  selectCategories,
  selectBatchesWithStock,
  selectProduct,
  selectProductsPage,
  updateProductRow,
} from "./repository";
import {
  daysUntil,
  expirySignal,
  stockSignal,
  todayInStore,
  worstSignal,
} from "./semaphore";

type Actor = { id: string; name: string };

// Names only: the log is not the place for cost values.
const FIELD_LABELS: Record<keyof UpdateProduct, string> = {
  barcode: "código de barras",
  name: "nome",
  categoryId: "categoria",
  costPrice: "custo",
  sellPrice: "preço de venda",
  minStock: "estoque mínimo",
  unit: "unidade",
  active: "situação",
};

export const listCategories = selectCategories;

const PRODUCTS_PER_PAGE = 20;
const INVENTORY_PRODUCTS_PER_PAGE = 10;

/** A page past the end (the list shrank meanwhile) answers the last page, not an empty one. */
async function productsPage(
  { search, page }: ListQuery,
  pageSize: number,
  inUseOnly: boolean,
) {
  const scope = { search, inUseOnly };
  const total = await countProducts(scope);
  const current = Math.min(page, Math.max(1, Math.ceil(total / pageSize)));
  const products = await selectProductsPage(scope, {
    limit: pageSize,
    offset: (current - 1) * pageSize,
  });
  return { products, total, page: current, pageSize };
}

export const listProducts = (query: ListQuery) =>
  productsPage(query, PRODUCTS_PER_PAGE, false);

/**
 * Products with their batches and semaphore; a product takes the worst of its stock and batches.
 * A discontinued product with nothing left is out: it would stay red forever, and nothing can clear it.
 */
export async function listInventory(query: ListQuery, today = todayInStore()) {
  const page = await productsPage(query, INVENTORY_PRODUCTS_PER_PAGE, true);
  const rows = await selectBatchesWithStock(page.products.map((p) => p.id));
  return {
    ...page,
    products: page.products.map((product) => {
      const batches = rows
        .filter((batch) => batch.productId === product.id)
        .map((batch) => {
          const daysLeft =
            batch.expirationDate === null
              ? null
              : daysUntil(batch.expirationDate, today);
          return { ...batch, daysLeft, signal: expirySignal(daysLeft) };
        });
      return {
        ...product,
        batches,
        signal: worstSignal([
          stockSignal(product),
          ...batches.map((batch) => batch.signal),
        ]),
      };
    }),
  };
}

const productNotFound = () => new ServiceError(404, "Produto não encontrado.");

/** Stock is the sum of the batches, so a product that was just written is read back with it. */
async function readProduct(id: string) {
  const product = await selectProduct(id);
  if (!product) throw productNotFound();
  return product;
}

async function requireCategory(id: string) {
  if (await categoryExists(id)) return;
  const message = "Categoria não encontrada.";
  throw new ServiceError(422, message, { fields: { categoryId: message } });
}

function barcodeTaken(error: unknown) {
  if (uniqueViolation(error) !== "products_barcode_unique") return error;
  const message = "Já existe um produto com esse código de barras.";
  return new ServiceError(409, message, { fields: { barcode: message } });
}

export async function createCategory(actor: Actor, input: CreateCategory) {
  try {
    const category = await insertCategory(input.name);
    await logActivity({
      user: actor,
      action: "Categoria criada",
      detail: category.name,
    });
    return category;
  } catch (error) {
    if (uniqueViolation(error) !== "categories_name_unique") throw error;
    const message = "Já existe uma categoria com esse nome.";
    throw new ServiceError(409, message, { fields: { name: message } });
  }
}

export async function createProduct(actor: Actor, input: CreateProduct) {
  await requireCategory(input.categoryId);
  const product = await insertProduct(input).catch((error: unknown) => {
    throw barcodeTaken(error);
  });
  await logActivity({
    user: actor,
    action: "Produto criado",
    detail: product.name,
  });
  // No second read: if it failed, a saved product would answer 500 and the retry 409.
  return { ...product, stock: 0, hasBatches: false };
}

export async function updateProduct(
  actor: Actor,
  id: string,
  input: UpdateProduct,
) {
  const current = await readProduct(id);
  if (input.unit && input.unit !== current.unit) {
    // Batches and movements hold integers in the unit's base, so 14 UN would silently become 0,014 kg.
    if (current.hasBatches) {
      throw new ServiceError(409, UNIT_LOCKED_MESSAGE, {
        fields: { unit: UNIT_LOCKED_MESSAGE },
      });
    }
    // The minimum is stored the same way, so it has to come restated in the new unit.
    if (current.minStock > 0 && input.minStock === undefined) {
      const message = "Informe o estoque mínimo na nova unidade.";
      throw new ServiceError(422, message, { fields: { minStock: message } });
    }
  }
  if (input.categoryId) await requireCategory(input.categoryId);
  const row = await updateProductRow(id, input).catch((error: unknown) => {
    throw barcodeTaken(error);
  });
  if (!row) throw productNotFound();
  await logActivity({
    user: actor,
    action: "Produto alterado",
    detail: `${row.name}: ${Object.keys(input)
      .map((field) => FIELD_LABELS[field as keyof UpdateProduct])
      .join(", ")}`,
  });
  return readProduct(id);
}

/** The product as the sale screen sees it: active only, and without cost. */
export async function findProductForSale(barcode: string) {
  const product = await selectActiveProductByBarcode(barcode);
  if (!product) throw productNotFound();
  return product;
}

/** Records a received batch; its IN movement names who received it. */
export async function receiveBatch(
  userId: string,
  productId: string,
  input: CreateBatch,
) {
  await readProduct(productId);
  const batch = await insertBatchWithMovement(productId, input, userId);
  if (!batch)
    throw new ServiceError(
      409,
      "Esta entrada já foi registrada com outros dados. Feche e confira o estoque.",
    );
  return batch;
}

/**
 * Takes stock out by PVPS: the batch that expires first goes first, spilling into the next ones.
 * shortcut: expired batches are consumed like any other, block them in the sale flow when the PDV exists.
 */
export async function consumeStock(input: {
  productId: string;
  quantity: number;
  reason: string;
  userId: string;
}) {
  // A negative quantity would add stock instead of taking it.
  if (!Number.isInteger(input.quantity) || input.quantity <= 0)
    throw new ServiceError(
      422,
      "Informe uma quantidade inteira maior que zero.",
    );
  await readProduct(input.productId);
  const allocations = await consumeBatches(input);
  if (!allocations) throw new ServiceError(409, "Estoque insuficiente.");
  return allocations;
}
