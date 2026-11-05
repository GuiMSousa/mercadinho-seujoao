import type { ProductLookup } from "@/contracts/inventory";
import { lineTotal } from "@/contracts/sales";
import { formatQuantity, unitSuffix } from "@/app/painel/produtos/product-form";
import { brl } from "./receipt-text";

/** A product in the sale, as last looked up; quantity in the unit's base (units, grams, milliliters). */
export type CartLine = ProductLookup & { quantity: number };

export type Refusal = { title: string; message: string };

/** "R$ 18,49" for a unit, "R$ 6,99/kg" for a weighed product. */
export const priceLabel = ({
  sellPrice,
  unit,
}: Pick<ProductLookup, "sellPrice" | "unit">) =>
  unit === "UN" ? brl(sellPrice) : `${brl(sellPrice)}/${unitSuffix(unit)}`;

/** Why `quantity` more of the product cannot go into the sale, or null when it can. */
export function refusal(
  cart: CartLine[],
  product: ProductLookup,
  quantity: number,
): Refusal | null {
  if (product.expired)
    return {
      title: "Lote vencido",
      message: `${product.name}: o lote que sai primeiro está vencido. Separe o produto e avise o administrador.`,
    };
  if (product.stock <= 0)
    return {
      title: "Sem estoque",
      message: `${product.name} não tem saldo nos lotes. Avise o administrador.`,
    };
  const inCart = cart.find((line) => line.id === product.id)?.quantity ?? 0;
  if (inCart + quantity > product.stock)
    return {
      title: "Estoque insuficiente",
      message: `${product.name}: restam ${formatQuantity(product.stock, product.unit)} em estoque.`,
    };
  return null;
}

/** Adds to the line of the same product, or puts a new line at the end. */
export function addToCart(
  cart: CartLine[],
  product: ProductLookup,
  quantity: number,
): CartLine[] {
  if (!cart.some((line) => line.id === product.id))
    return [...cart, { ...product, quantity }];
  // The latest lookup carries the current price and stock.
  return cart.map((line) =>
    line.id === product.id
      ? { ...product, quantity: line.quantity + quantity }
      : line,
  );
}

export function setQuantity(cart: CartLine[], id: string, quantity: number) {
  return cart.map((line) => (line.id === id ? { ...line, quantity } : line));
}

export function removeLine(cart: CartLine[], id: string) {
  return cart.filter((line) => line.id !== id);
}

export const linePrice = (line: CartLine) =>
  lineTotal(line.sellPrice, line.quantity, line.unit);

/** The sum of the lines, each already rounded to the cent, as the server computes it. */
export const cartTotal = (cart: CartLine[]) =>
  cart.reduce((sum, line) => sum + linePrice(line), 0);
