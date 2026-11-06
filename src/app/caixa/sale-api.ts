import type { ProductLookup } from "@/contracts/inventory";
import { scaleGrams, type ScaleLabel } from "@/lib/barcode-scale";
import { apiFetch } from "@/app/painel/_lib/api";
import { priceLabel, type CartLine, type Refusal } from "./cart";

/** The active product with this exact barcode (404 when there is none). */
export const lookupBarcode = (barcode: string) =>
  apiFetch<ProductLookup>(
    `/api/products?barcode=${encodeURIComponent(barcode)}`,
  );

/**
 * The weighed product a scale label names (its barcode is the label's 5-digit code) and the
 * grams to sell, or why it cannot go into the sale.
 */
export async function lookupScaleLabel(
  label: ScaleLabel,
): Promise<{ product: ProductLookup; grams: number } | Refusal> {
  const result = await lookupBarcode(label.code);
  if (!result.ok)
    return result.status === 404
      ? {
          title: "Produto da etiqueta não encontrado",
          message: `Nada ativo com o código de balança ${label.code}. Confira o cadastro do produto.`,
        }
      : {
          title: "Não foi possível buscar",
          message: result.errors.error ?? "Tente de novo.",
        };
  const product = result.data;
  if (product.unit !== "KG")
    return {
      title: "Etiqueta de balança",
      message: `${product.name} não é vendido por quilo. Confira o código de balança no cadastro.`,
    };
  const grams = scaleGrams(label, product.sellPrice);
  if (grams === null)
    return {
      title: "Etiqueta sem peso",
      message: `${product.name}: o valor da etiqueta não chega a 1 g ao preço de ${priceLabel(product)}.`,
    };
  return { product, grams };
}

/** The lines with the catalog's current price and stock; a line that fails to load stays as it was. */
export async function withCurrentPrices(cart: CartLine[]) {
  const results = await Promise.all(
    cart.map((line) => lookupBarcode(line.barcode)),
  );
  return cart.map((line, index) => {
    const result = results[index];
    return result.ok
      ? { ...line, sellPrice: result.data.sellPrice, stock: result.data.stock }
      : line;
  });
}
