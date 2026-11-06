import type { Metadata } from "next";
import { listMovements } from "@/domains/inventory/history";
import { requireAdmin } from "../../_lib/require-admin";
import { StockNav } from "../stock-nav";
import { HistoryView } from "./history-view";

export const metadata: Metadata = {
  title: "Histórico de estoque — Mkt Control",
};

export default async function StockHistoryPage() {
  await requireAdmin();
  return (
    <div className="mx-auto flex max-w-350 flex-col gap-6">
      <StockNav current="/painel/estoque/historico" />
      <HistoryView initial={await listMovements({ search: "", page: 1 })} />
    </div>
  );
}
