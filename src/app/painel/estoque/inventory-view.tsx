"use client";

import { PackageMinus, PackagePlus, Search } from "lucide-react";
import { useState } from "react";
import type {
  InventoryBatch,
  InventoryPage,
  InventoryProduct,
} from "@/contracts/inventory";
import { stockSignal } from "@/domains/inventory/semaphore";
import { Badge } from "@ds/components/badge";
import { Button } from "@ds/components/button";
import { Card } from "@ds/components/card";
import { Input } from "@ds/components/input";
import { Table, type TableColumn } from "@ds/components/table";
import { Pagination } from "../_lib/pagination";
import { usePagedList } from "../_lib/use-paged-list";
import { formatDay } from "@/lib/formatters";
import { formatQuantity } from "../produtos/product-form";
import { BatchDialog } from "./batch-dialog";
import { OutDialog } from "./out-dialog";
import { expiryLabel, SIGNAL_LABEL, SIGNAL_TONE } from "./signal-labels";

function Legend() {
  return (
    <ul className="flex flex-wrap gap-x-5 gap-y-2 text-body-sm text-sub">
      <li className="flex items-center gap-2">
        <Badge tone="success" size="sm" dot>
          {SIGNAL_LABEL.green}
        </Badge>
        Validade e estoque em dia
      </li>
      <li className="flex items-center gap-2">
        <Badge tone="warning" size="sm" dot>
          {SIGNAL_LABEL.yellow}
        </Badge>
        Vence em 8 a 30 dias, ou estoque no mínimo ou abaixo
      </li>
      <li className="flex items-center gap-2">
        <Badge tone="danger" size="sm" dot>
          {SIGNAL_LABEL.red}
        </Badge>
        Vencido, vence em até 7 dias, ou sem estoque
      </li>
    </ul>
  );
}

function ProductBatches({
  product,
  onReceive,
  onTakeOut,
}: {
  product: InventoryProduct;
  onReceive: () => void;
  onTakeOut: () => void;
}) {
  const stock = stockSignal(product);
  const columns: TableColumn<InventoryBatch>[] = [
    {
      key: "code",
      label: "Lote",
      render: (batch) => <span className="font-medium">{batch.batchCode}</span>,
    },
    {
      key: "signal",
      label: "Situação",
      render: (batch) => (
        <Badge tone={SIGNAL_TONE[batch.signal]} dot>
          {expiryLabel(batch.daysLeft)}
        </Badge>
      ),
    },
    {
      key: "date",
      label: "Validade",
      // On phones the badge already says how long is left.
      className: "hidden sm:table-cell",
      render: (batch) =>
        batch.expirationDate ? formatDay(batch.expirationDate) : "—",
    },
    {
      key: "quantity",
      label: "Quantidade",
      align: "right",
      render: (batch) => formatQuantity(batch.quantity, product.unit),
    },
  ];

  return (
    <Card
      flush
      title={product.name}
      subtitle={<span className="wrap-anywhere">Código {product.barcode}</span>}
    >
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 pb-3 text-body-md">
        <Badge tone={SIGNAL_TONE[product.signal]} dot>
          {SIGNAL_LABEL[product.signal]}
        </Badge>
        {!product.active && <Badge>Inativo</Badge>}
        <span className="tabular-nums">
          Saldo{" "}
          <span className="font-medium text-strong">
            {formatQuantity(product.stock, product.unit)}
          </span>
        </span>
        <span className="text-sub tabular-nums">
          Mínimo {formatQuantity(product.minStock, product.unit)}
        </span>
        {stock === "red" && <span className="text-danger-fg">Sem estoque</span>}
        {stock === "yellow" && (
          <span className="text-warning-fg">Estoque crítico</span>
        )}
        {product.stock > 0 && (
          <Button
            variant="secondary"
            aria-label={`Dar baixa no estoque de ${product.name}`}
            className="ml-auto"
            onClick={onTakeOut}
          >
            <PackageMinus aria-hidden="true" />
            Dar baixa
          </Button>
        )}
        <Button
          variant="secondary"
          aria-label={`Registrar entrada de lote de ${product.name}`}
          className={product.stock > 0 ? undefined : "ml-auto"}
          onClick={onReceive}
        >
          <PackagePlus aria-hidden="true" />
          Registrar entrada
        </Button>
      </div>
      <Table
        caption={`Lotes de ${product.name}`}
        columns={columns}
        rows={product.batches}
        rowKey={(batch) => batch.id}
        dense
        empty="Nenhum lote com saldo. Registre uma entrada."
      />
    </Card>
  );
}

export function InventoryView({ initial }: { initial: InventoryPage }) {
  const {
    data,
    search,
    loadedSearch,
    loading,
    searchRef,
    changeSearch,
    goTo,
    reload,
  } = usePagedList("/api/admin/inventory", initial);
  const [receiving, setReceiving] = useState<InventoryProduct | null>(null);
  const [takingOut, setTakingOut] = useState<InventoryProduct | null>(null);

  return (
    <div className="mx-auto flex max-w-350 flex-col gap-6">
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
      <Legend />
      <div aria-busy={loading} className="flex flex-col gap-6">
        {data.products.length === 0 ? (
          <Card>
            <p className="text-center text-sub">
              {loadedSearch.trim()
                ? "Nenhum produto encontrado. Confira o nome ou o código."
                : "Cadastre um produto em Produtos para registrar lotes."}
            </p>
          </Card>
        ) : (
          data.products.map((product) => (
            <ProductBatches
              key={product.id}
              product={product}
              onReceive={() => setReceiving(product)}
              onTakeOut={() => setTakingOut(product)}
            />
          ))
        )}
      </div>
      <Pagination
        page={data.page}
        pageSize={data.pageSize}
        total={data.total}
        noun={{ one: "produto", many: "produtos" }}
        loading={loading}
        onPage={(page) => void goTo(page)}
      />
      {receiving && (
        <BatchDialog
          product={receiving}
          onClose={() => setReceiving(null)}
          onSaved={() => void reload()}
        />
      )}
      {takingOut && (
        <OutDialog
          product={takingOut}
          onClose={() => setTakingOut(null)}
          onSaved={() => void reload()}
        />
      )}
    </div>
  );
}
