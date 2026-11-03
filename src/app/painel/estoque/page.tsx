import type { Metadata } from "next";
import { inventoryPageSchema } from "@/contracts/inventory";
import { listInventory } from "@/domains/inventory/service";
import { requireAdmin } from "../_lib/require-admin";
import { InventoryView } from "./inventory-view";

export const metadata: Metadata = { title: "Estoque — Mkt Control" };

export default async function InventoryPage() {
  await requireAdmin();
  // The same DTO as the route: the service row also carries cost, which this screen never needs.
  const initial = inventoryPageSchema.parse(
    await listInventory({ search: "", page: 1 }),
  );
  return <InventoryView initial={initial} />;
}
