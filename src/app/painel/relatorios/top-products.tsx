"use client";

import { useState } from "react";
import type { FinancialReport } from "@/contracts/reports";
import { Card } from "@ds/components/card";
import { Table, type TableColumn } from "@ds/components/table";
import { Tabs } from "@ds/components/tabs";
import { formatBrl } from "@ds/lib/money";
import { formatQuantity } from "../produtos/product-form";

type Ranking = keyof FinancialReport["top"];
type Product = FinancialReport["top"][Ranking][number];

const RANKINGS = [
  { value: "byQuantity", label: "Quantidade" },
  { value: "byRevenue", label: "Faturamento" },
  { value: "byProfit", label: "Lucro" },
];

const columns: TableColumn<Product>[] = [
  {
    key: "name",
    label: "Produto",
    render: (product) => <span className="font-medium">{product.name}</span>,
  },
  {
    key: "quantity",
    label: "Quantidade",
    align: "right",
    render: (product) => formatQuantity(product.quantity, product.unit),
  },
  {
    key: "revenue",
    label: "Faturamento",
    align: "right",
    render: (product) => formatBrl(product.revenue),
  },
  {
    key: "profit",
    label: "Lucro bruto",
    align: "right",
    className: "hidden sm:table-cell",
    render: (product) => formatBrl(product.profit),
  },
];

/** The five best products of the period, ranked by quantity, revenue or gross profit. */
export function TopProducts({ top }: { top: FinancialReport["top"] }) {
  const [ranking, setRanking] = useState<Ranking>("byQuantity");
  return (
    <Card
      title="5 produtos mais vendidos"
      flush
      actions={
        <Tabs
          aria-label="Ordenar por"
          items={RANKINGS}
          value={ranking}
          onValueChange={(value) => setRanking(value as Ranking)}
        />
      }
    >
      <Table
        caption="Produtos mais vendidos no período"
        columns={columns}
        rows={top[ranking]}
        rowKey={(product) => product.productId}
        empty="Nenhuma venda no período."
        dense
      />
    </Card>
  );
}
