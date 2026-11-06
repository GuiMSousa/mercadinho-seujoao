import type { Metadata } from "next";
import { inventoryPageSchema } from "@/contracts/inventory";
import { listInventory } from "@/domains/inventory/service";
import { requireAdmin } from "../_lib/require-admin";
import { InventoryView } from "./inventory-view";
import { StockNav } from "./stock-nav";

export const metadata: Metadata = { title: "Estoque — Mkt Control" };

export default async function InventoryPage() {
  await requireAdmin();
  // The same DTO as the route: the service row also carries cost, which this screen never needs.
  const initial = inventoryPageSchema.parse(
    await listInventory({ search: "", page: 1 }),
  );
  return (
    <div className="mx-auto flex max-w-350 flex-col gap-6">
      <StockNav current="/painel/estoque" />
      <InventoryView initial={initial} />
    </div>
  );
}
