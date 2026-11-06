import type { ProductLookup } from "@/contracts/inventory";
import { lineTotal, maxDiscount } from "@/contracts/sales";
import { formatQuantity, unitSuffix } from "@/app/painel/produtos/product-form";
import { discountCents, type Discount } from "./checkout-payments";
import { brl } from "./receipt-text";

/**
 * A product in the sale, as last looked up; quantity in the unit's base (units, grams, milliliters),
 * with the discount given on this line, if any.
 */
export type CartLine = ProductLookup & {
  quantity: number;
  discount?: Discount | null;
};

export type Refusal = { title: string; message: string };

/** What a discount dialog works on: the whole sale or one line. */
export type DiscountTarget = CartLine | "sale";

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
      ? {
          ...product,
          quantity: line.quantity + quantity,
          discount: line.discount,
        }
      : line,
  );
}

export function setQuantity(cart: CartLine[], id: string, quantity: number) {
  return cart.map((line) => (line.id === id ? { ...line, quantity } : line));
}

export function removeLine(cart: CartLine[], id: string) {
  return cart.filter((line) => line.id !== id);
}

export function setLineDiscount(
  cart: CartLine[],
  id: string,
  discount: Discount | null,
) {
  return cart.map((line) => (line.id === id ? { ...line, discount } : line));
}

/** The line before its discount. */
export const lineGross = (line: CartLine) =>
  lineTotal(line.sellPrice, line.quantity, line.unit);

/** The line's discount in cents; an amount set for more units than are left takes the whole line. */
export const lineDiscount = (line: CartLine) =>
  Math.min(
    lineGross(line),
    discountCents(lineGross(line), line.discount ?? null),
  );

export const linePrice = (line: CartLine) =>
  lineGross(line) - lineDiscount(line);

/** The sum of the lines, each already rounded to the cent and after its discount, as the server does. */
export const cartTotal = (cart: CartLine[]) =>
  cart.reduce((sum, line) => sum + linePrice(line), 0);

/**
 * What the discount dialog for `target` (a line or the whole sale) works on: the amount it comes off,
 * the current discount, and the most it may be. An operator's discounts, lines and sale together,
 * stay within 5% of the items before any discount; an ADMIN's only within the amount.
 */
export function discountScope(
  cart: CartLine[],
  saleDiscount: Discount | null,
  target: DiscountTarget,
  isAdmin: boolean,
) {
  const subtotal = cartTotal(cart);
  const saleOff = discountCents(subtotal, saleDiscount);
  const given = cart.reduce((sum, line) => sum + lineDiscount(line), saleOff);
  const gross = cart.reduce((sum, line) => sum + lineGross(line), 0);
  const cap = maxDiscount(gross, isAdmin ? "ADMIN" : "CASHIER");
  const amount = target === "sale" ? subtotal : lineGross(target);
  const own = target === "sale" ? saleOff : lineDiscount(target);
  return {
    title:
      target === "sale" ? "Desconto na venda" : `Desconto em ${target.name}`,
    description: `Sobre o valor ${target === "sale" ? "dos itens" : "deste item"}.`,
    subtotal: amount,
    current: target === "sale" ? saleDiscount : (target.discount ?? null),
    // What is left of the cap once the other discounts are counted, never more than the amount.
    limit: Math.max(0, Math.min(amount, cap - (given - own))),
    cap,
  };
}
