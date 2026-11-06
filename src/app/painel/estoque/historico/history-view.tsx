"use client";

import { Search } from "lucide-react";
import { useState } from "react";
import type { MovementRow, MovementsPage } from "@/contracts/stock-history";
import { Badge } from "@ds/components/badge";
import { Card } from "@ds/components/card";
import { Input } from "@ds/components/input";
import { Select } from "@ds/components/select";
import { Table, type TableColumn } from "@ds/components/table";
import { formatDateTime } from "../../_lib/format";
import { Pagination } from "../../_lib/pagination";
import { usePagedList } from "../../_lib/use-paged-list";
import { formatQuantity } from "../../produtos/product-form";

const TYPES = {
  IN: { label: "Entrada", tone: "success", sign: "+" },
  OUT: { label: "Saída", tone: "warning", sign: "−" },
  ADJUSTMENT: { label: "Ajuste", tone: "info", sign: "±" },
} as const;

const typeOptions = [
  { value: "", label: "Todos os movimentos" },
  ...Object.entries(TYPES).map(([value, { label }]) => ({ value, label })),
];

const columns: TableColumn<MovementRow>[] = [
  {
    key: "when",
    label: "Data e hora",
    render: (row) => formatDateTime(row.createdAt),
  },
  {
    key: "product",
    label: "Produto",
    wrap: true,
    render: (row) => (
      <span className="flex flex-col items-start wrap-anywhere">
        <span className="font-medium">{row.productName}</span>
        <span className="text-body-sm text-sub">{row.barcode}</span>
      </span>
    ),
  },
  {
    key: "type",
    label: "Movimento",
    wrap: true,
    render: (row) => (
      <span className="flex flex-col items-start gap-1">
        <Badge tone={TYPES[row.type].tone}>{TYPES[row.type].label}</Badge>
        {row.reason && (
          <span className="text-body-sm text-sub wrap-anywhere">
            {row.reason}
          </span>
        )}
      </span>
    ),
  },
  {
    key: "quantity",
    label: "Quantidade",
    align: "right",
    render: (row) =>
      `${TYPES[row.type].sign}${formatQuantity(row.quantity, row.unit)}`,
  },
  {
    key: "batch",
    label: "Lote",
    className: "hidden md:table-cell",
    render: (row) => row.batchCode ?? "—",
  },
  {
    key: "user",
    label: "Usuário",
    className: "hidden lg:table-cell",
    render: (row) => row.userName,
  },
];

/** Every stock movement, newest first, by product, type and period. */
export function HistoryView({ initial }: { initial: MovementsPage }) {
  const {
    data,
    search,
    loadedSearch,
    loading,
    searchRef,
    changeSearch,
    goTo,
    filter,
  } = usePagedList("/api/admin/inventory/movements", initial);
  const [filters, setFilters] = useState({ type: "", from: "", to: "" });
  const backwards = Boolean(
    filters.from && filters.to && filters.from > filters.to,
  );

  function change(next: Partial<typeof filters>) {
    const merged = { ...filters, ...next };
    setFilters(merged);
    // A period that ends before it starts waits for a fix instead of asking the server.
    if (!(merged.from && merged.to && merged.from > merged.to))
      void filter(merged);
  }

  const filtered = Boolean(
    loadedSearch.trim() || filters.type || filters.from || filters.to,
  );
  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Input
          label="Produto"
          type="search"
          placeholder="Nome ou código de barras"
          prefix={<Search aria-hidden="true" className="size-4" />}
          ref={searchRef}
          maxLength={120}
          value={search}
          onChange={(event) => changeSearch(event.target.value)}
        />
        <Select
          label="Movimento"
          options={typeOptions}
          value={filters.type}
          onChange={(event) => change({ type: event.target.value })}
        />
        <Input
          label="De"
          type="date"
          value={filters.from}
          onChange={(event) => change({ from: event.target.value })}
        />
        <Input
          label="Até"
          type="date"
          value={filters.to}
          onChange={(event) => change({ to: event.target.value })}
          error={
            backwards
              ? "O fim do período não pode vir antes do início."
              : undefined
          }
        />
      </div>
      <Card flush aria-busy={loading}>
        <Table
          caption="Movimentações de estoque"
          columns={columns}
          rows={data.movements}
          rowKey={(row) => row.id}
          empty={
            filtered
              ? "Nenhuma movimentação com esses filtros."
              : "Nenhuma movimentação ainda. Elas aparecem com as entradas de lote, as vendas e as baixas."
          }
        />
        <Pagination
          page={data.page}
          pageSize={data.pageSize}
          total={data.total}
          noun={{ one: "movimentação", many: "movimentações" }}
          loading={loading}
          onPage={(page) => void goTo(page)}
        />
      </Card>
    </div>
  );
}
