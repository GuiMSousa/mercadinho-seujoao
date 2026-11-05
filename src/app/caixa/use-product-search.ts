"use client";

import { useEffect, useState } from "react";
import type { ProductLookup } from "@/contracts/inventory";
import { apiFetch } from "@/app/painel/_lib/api";

const MIN_LENGTH = 2;
// A scanner types a whole code and Enter well within this, so it never triggers a search.
const DELAY_MS = 300;

export type ProductSearch =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error" }
  | { status: "done"; term: string; products: ProductLookup[] };

/** Products whose name or code contains what is typed, looked up after a short pause. */
export function useProductSearch(query: string): ProductSearch {
  const term = query.trim();
  const [found, setFound] = useState<{
    term: string;
    products: ProductLookup[] | null;
  } | null>(null);

  useEffect(() => {
    if (term.length < MIN_LENGTH) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      void apiFetch<{ products: ProductLookup[] }>(
        `/api/products/search?q=${encodeURIComponent(term)}`,
        { signal: controller.signal },
      ).then((result) => {
        if (controller.signal.aborted) return;
        setFound({ term, products: result.ok ? result.data.products : null });
      });
    }, DELAY_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [term]);

  if (term.length < MIN_LENGTH) return { status: "idle" };
  if (found?.term !== term) return { status: "loading" };
  return found.products
    ? { status: "done", term, products: found.products }
    : { status: "error" };
}
