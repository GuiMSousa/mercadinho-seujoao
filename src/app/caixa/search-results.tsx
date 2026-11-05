"use client";

import type { ProductLookup } from "@/contracts/inventory";
import { formatQuantity } from "@/app/painel/produtos/product-form";
import { Badge } from "@ds/components/badge";
import { priceLabel } from "./cart";
import type { ProductSearch } from "./use-product-search";

const STATUS = {
  loading: "Buscando…",
  error: "Não foi possível buscar. Tente de novo.",
} as const;

function Availability({ product }: { product: ProductLookup }) {
  if (product.expired || product.stock <= 0)
    return (
      <Badge tone="danger" className="h-7 text-body-lg">
        {product.expired ? "Lote vencido" : "Sem estoque"}
      </Badge>
    );
  return <span>{formatQuantity(product.stock, product.unit)} em estoque</span>;
}

/** Name matches for what is typed; a tap adds the product like a scan would. */
export function SearchResults({
  search,
  onPick,
}: {
  search: Exclude<ProductSearch, { status: "idle" }>;
  onPick: (product: ProductLookup) => void;
}) {
  const products = search.status === "done" ? search.products : [];
  return (
    <section aria-label="Resultados da busca" className="flex flex-col gap-2">
      <p role="status" className="text-body-lg text-sub">
        {search.status === "done"
          ? products.length === 0
            ? "Nenhum produto encontrado."
            : "Toque no produto ou bipe o código."
          : STATUS[search.status]}
      </p>
      {products.length > 0 && (
        <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {products.map((product) => (
            <li key={product.id}>
              <button
                type="button"
                onClick={() => onPick(product)}
                className="flex min-h-control-counter w-full cursor-pointer touch-manipulation flex-col items-start gap-1 rounded-lg border border-border bg-surface-card p-3 text-left shadow-(--shadow-xs) transition-colors duration-(--dur-fast) hover:bg-surface-hover active:bg-control-pressed"
              >
                <span className="text-body-lg font-medium text-strong">
                  {product.name}
                </span>
                <span className="flex flex-wrap items-center gap-2 text-body-lg text-sub tabular-nums">
                  {priceLabel(product)}
                  <Availability product={product} />
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
