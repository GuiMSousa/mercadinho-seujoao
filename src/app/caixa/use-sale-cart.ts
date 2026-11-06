"use client";

import { useRef, useState } from "react";
import type { ProductLookup } from "@/contracts/inventory";
import { useToast } from "@ds/components/toast";
import { addToCart, cartTotal, refusal, type CartLine } from "./cart";
import type { Discount } from "./checkout-payments";
import { brl } from "./receipt-text";

/**
 * The items of the sale, its discount, and how products go in: refused with a danger toast when
 * expired, empty or short, announced to screen readers when added. `onWeigh` asks the weight of a
 * weighed product.
 */
export function useSaleCart(onWeigh: (product: ProductLookup) => void) {
  const { toast } = useToast();
  // Scans can answer while another is in flight; handlers read the cart here, never a stale render.
  const cartRef = useRef<CartLine[]>([]);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [announcement, setAnnouncement] = useState("");
  const [discount, setDiscount] = useState<Discount | null>(null);

  function commit(next: CartLine[]) {
    cartRef.current = next;
    setCart(next);
    // The discount belongs to the sale: an emptied cart starts the next one without it.
    if (next.length === 0) setDiscount(null);
  }

  function refuse(product: ProductLookup, quantity: number) {
    const refused = refusal(cartRef.current, product, quantity);
    if (refused) toast({ ...refused, tone: "danger" });
    return refused !== null;
  }

  function add(product: ProductLookup, quantity: number) {
    if (refuse(product, quantity)) return;
    commit(addToCart(cartRef.current, product, quantity));
    setAnnouncement(
      `${product.name} adicionado. Total ${brl(cartTotal(cartRef.current))}.`,
    );
  }

  /** A unit product goes in one at a time; a weighed one asks for the weight first. */
  function pick(product: ProductLookup) {
    if (product.unit === "UN") return add(product, 1);
    // Refused before the weight is typed, so an expired or empty product stops right away.
    if (!refuse(product, 1)) onWeigh(product);
  }

  return {
    cart,
    cartRef,
    announcement,
    commit,
    add,
    pick,
    discount,
    setDiscount,
  };
}
