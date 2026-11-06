"use client";

import { PackagePlus, Pencil, Plus, Search, Tags } from "lucide-react";
import { useState } from "react";
import type {
  CategoryRow,
  ProductRow,
  ProductsPage,
} from "@/contracts/inventory";
import type { SupplierOption } from "@/contracts/suppliers";
import { stockSignal } from "@/domains/inventory/semaphore";
import { Badge } from "@ds/components/badge";
import { Button, IconButton } from "@ds/components/button";
import { Card } from "@ds/components/card";
import { Input } from "@ds/components/input";
import { Money } from "@ds/components/money";
import { Table, type TableColumn } from "@ds/components/table";
import { Pagination } from "../_lib/pagination";
import { usePagedList } from "../_lib/use-paged-list";
import { BatchDialog } from "../estoque/batch-dialog";
import { CategoryDialog } from "./category-dialog";
import { ProductDialog } from "./product-dialog";
import { formatQuantity } from "./product-form";

// Secondary columns give way on phones; the edit dialog still shows them.
const fromTablet = "hidden md:table-cell";

function StockCell({ product }: { product: ProductRow }) {
  const signal = stockSignal(product);
  return (
    <span className="flex flex-col items-end gap-1">
      <span className="tabular-nums">
        {formatQuantity(product.stock, product.unit)}
      </span>
      {signal === "red" && (
        <Badge tone="danger" size="sm" dot>
          Sem estoque
        </Badge>
      )}
      {signal === "yellow" && (
        <Badge tone="warning" size="sm" dot>
          Estoque crítico
        </Badge>
      )}
    </span>
  );
}

/** Each dialog mounts only while open, so every opening starts from fresh state. */
type OpenDialog =
  | { kind: "category" }
  | { kind: "product"; product: ProductRow | null }
  | { kind: "batch"; product: ProductRow };

export function ProductsView({
  initial,
  categories,
  suppliers,
}: {
  initial: ProductsPage;
  categories: CategoryRow[];
  suppliers: SupplierOption[];
}) {
  const {
    data,
    search,
    loadedSearch,
    loading,
    searchRef,
    changeSearch,
    goTo,
    reload,
  } = usePagedList("/api/admin/products", initial);
  const [dialog, setDialog] = useState<OpenDialog | null>(null);
  const close = () => setDialog(null);
  const categoryName = new Map(categories.map((c) => [c.id, c.name]));

  const columns: TableColumn<ProductRow>[] = [
    {
      key: "name",
      label: "Produto",
      wrap: true,
      render: (product) => (
        <span className="flex flex-col items-start wrap-anywhere">
          <span className="font-medium">{product.name}</span>
          <span className="text-body-sm text-sub tabular-nums">
            {product.barcode}
          </span>
          {!product.active && <Badge className="mt-1 md:hidden">Inativo</Badge>}
          <Money
            cents={product.sellPrice}
            size="sm"
            className="mt-1 md:hidden"
          />
        </span>
      ),
    },
    {
      key: "category",
      label: "Categoria",
      className: fromTablet,
      render: (product) => (
        <span className="text-sub">{categoryName.get(product.categoryId)}</span>
      ),
    },
    {
      key: "cost",
      label: "Custo",
      align: "right",
      className: fromTablet,
      render: (product) => <Money cents={product.costPrice} size="sm" />,
    },
    {
      key: "sell",
      label: "Venda",
      align: "right",
      className: fromTablet,
      render: (product) => <Money cents={product.sellPrice} size="sm" />,
    },
    {
      key: "stock",
      label: "Estoque",
      align: "right",
      render: (product) => <StockCell product={product} />,
    },
    {
      key: "active",
      label: "Situação",
      className: fromTablet,
      render: (product) =>
        product.active ? (
          <Badge tone="success">Ativo</Badge>
        ) : (
          <Badge tone="neutral">Inativo</Badge>
        ),
    },
    {
      key: "actions",
      label: <span className="sr-only">Ações</span>,
      align: "right",
      render: (product) => (
        <span className="flex justify-end gap-1">
          <IconButton
            icon={PackagePlus}
            label={`Entrada de lote de ${product.name}`}
            variant="ghost"
            onClick={() => setDialog({ kind: "batch", product })}
          />
          <IconButton
            icon={Pencil}
            label={`Editar ${product.name}`}
            variant="ghost"
            onClick={() => setDialog({ kind: "product", product })}
          />
        </span>
      ),
    },
  ];

  return (
    <div className="mx-auto flex max-w-350 flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <Input
          aria-label="Buscar produto"
          type="search"
          placeholder="Buscar por nome ou código"
          prefix={<Search aria-hidden="true" className="size-4" />}
          ref={searchRef}
          maxLength={120}
          value={search}
          onChange={(event) => changeSearch(event.target.value)}
          className="w-full max-w-sm"
        />
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            onClick={() => setDialog({ kind: "category" })}
          >
            <Tags aria-hidden="true" />
            Criar categoria
          </Button>
          <Button
            disabled={categories.length === 0}
            onClick={() => setDialog({ kind: "product", product: null })}
          >
            <Plus aria-hidden="true" />
            Cadastrar produto
          </Button>
        </div>
      </div>
      <Card flush aria-busy={loading}>
        <Table
          caption="Produtos"
          columns={columns}
          rows={data.products}
          rowKey={(product) => product.id}
          empty={
            loadedSearch.trim()
              ? "Nenhum produto encontrado. Confira o nome ou o código."
              : categories.length > 0
                ? "Cadastre o primeiro produto para começar."
                : "Crie uma categoria para cadastrar o primeiro produto."
          }
        />
        <Pagination
          page={data.page}
          pageSize={data.pageSize}
          total={data.total}
          noun={{ one: "produto", many: "produtos" }}
          loading={loading}
          onPage={(page) => void goTo(page)}
        />
      </Card>
      {dialog?.kind === "category" && <CategoryDialog onClose={close} />}
      {dialog?.kind === "product" && (
        <ProductDialog
          product={dialog.product}
          categories={categories}
          suppliers={suppliers}
          onClose={close}
          onSaved={() => void reload()}
        />
      )}
      {dialog?.kind === "batch" && (
        <BatchDialog
          product={dialog.product}
          onClose={close}
          onSaved={() => void reload()}
        />
      )}
    </div>
  );
}
