import "server-only";
import type {
  CreateBatch,
  CreateCategory,
  CreateProduct,
  UpdateProduct,
} from "@/contracts/inventory";
import { logActivity } from "@/domains/activity/service";
import { ServiceError } from "@/domains/auth/errors";
import { uniqueViolation } from "@/infrastructure/db/errors";
import {
  categoryExists,
  consumeBatches,
  insertBatchWithMovement,
  insertCategory,
  insertProduct,
  selectActiveProductByBarcode,
  selectCategories,
  selectProduct,
  selectProducts,
  updateProductRow,
} from "./repository";

type Actor = { id: string; name: string };

export const listCategories = selectCategories;
export const listProducts = selectProducts;

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
  const { id, name } = await insertProduct(input).catch((error: unknown) => {
    throw barcodeTaken(error);
  });
  await logActivity({ user: actor, action: "Produto criado", detail: name });
  return readProduct(id);
}

export async function updateProduct(
  actor: Actor,
  id: string,
  input: UpdateProduct,
) {
  if (input.categoryId) await requireCategory(input.categoryId);
  const row = await updateProductRow(id, input).catch((error: unknown) => {
    throw barcodeTaken(error);
  });
  if (!row) throw productNotFound();
  const product = await readProduct(id);
  await logActivity({
    user: actor,
    action: "Produto alterado",
    detail: product.name,
  });
  return product;
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
  return insertBatchWithMovement(productId, input, userId);
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
