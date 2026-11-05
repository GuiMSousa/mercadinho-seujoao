import type { ProductLookup } from "@/contracts/inventory";
import { apiFetch } from "@/app/painel/_lib/api";
import type { CartLine } from "./cart";

/** The active product with this exact barcode (404 when there is none). */
export const lookupBarcode = (barcode: string) =>
  apiFetch<ProductLookup>(
    `/api/products?barcode=${encodeURIComponent(barcode)}`,
  );

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
