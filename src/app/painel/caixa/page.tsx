import type { Metadata } from "next";
import { cashSessionsPageSchema } from "@/contracts/cash";
import { listCashSessions } from "@/domains/cash/service";
import { requireAdmin } from "../_lib/require-admin";
import { CashSessionsView } from "./cash-sessions-view";

export const metadata: Metadata = { title: "Caixa diário — Mkt Control" };

export default async function CashSessionsPage() {
  await requireAdmin();
  return (
    <CashSessionsView
      initial={cashSessionsPageSchema.parse(
        await listCashSessions({ page: 1 }),
      )}
    />
  );
}
