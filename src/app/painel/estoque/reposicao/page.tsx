import type { Metadata } from "next";
import { replenishmentSchema } from "@/contracts/suppliers";
import { getStore } from "@/domains/store/service";
import { getReplenishment } from "@/domains/suppliers/service";
import { requireAdmin } from "../../_lib/require-admin";
import { StockNav } from "../stock-nav";
import { ReplenishmentView } from "./replenishment-view";

export const metadata: Metadata = { title: "Reposição — Mkt Control" };

export default async function ReplenishmentPage() {
  await requireAdmin();
  const [replenishment, store] = await Promise.all([
    getReplenishment(),
    getStore(),
  ]);
  return (
    <div className="mx-auto flex max-w-350 flex-col gap-6">
      <StockNav current="/painel/estoque/reposicao" />
      <p className="text-body-md text-sub">
        Produtos no estoque mínimo ou abaixo dele, ou com lote vencido ou
        vencendo em até 30 dias. Sugestão de compra: 2 × mínimo − estoque.
      </p>
      <ReplenishmentView
        replenishment={replenishmentSchema.parse(replenishment)}
        store={{
          name: store?.name ?? "Minha loja",
          document: store?.document ?? "",
          phone: store?.phone ?? "",
        }}
      />
    </div>
  );
}
