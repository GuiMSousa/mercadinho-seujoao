import type { Metadata } from "next";
import Link from "next/link";
import {
  ChartColumn,
  PackagePlus,
  ShoppingCart,
  Warehouse,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { Badge } from "@ds/components/badge";
import { Button } from "@ds/components/button";
import { Card } from "@ds/components/card";
import { Money } from "@ds/components/money";
import { getCashStatus } from "@/domains/cash/service";
import { totalReceivable } from "@/domains/customers/service";
import { getFinancialReport } from "@/domains/reports/service";
import { countStockAlerts } from "@/domains/suppliers/service";
import { formatDateTime } from "./_lib/format";
import { greeting, longDate } from "./_lib/greeting";
import { requireAdmin } from "./_lib/require-admin";

export const metadata: Metadata = { title: "Painel — Mkt Control" };

const count = new Intl.NumberFormat("pt-BR");
// The figure on top, the card's link under it.
const BODY = "flex flex-col items-start gap-4";

const QUICK_ACTIONS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/caixa", label: "Abrir PDV", icon: ShoppingCart },
  { href: "/painel/produtos", label: "Cadastrar produto", icon: PackagePlus },
  { href: "/painel/estoque", label: "Movimentar estoque", icon: Warehouse },
  { href: "/painel/relatorios", label: "Ver relatórios", icon: ChartColumn },
];

function CardLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Button
      variant="secondary"
      size="sm"
      nativeButton={false}
      render={<Link href={href} />}
    >
      {children}
    </Button>
  );
}

function Figure({ value, label }: { value: number; label: string }) {
  return (
    <p>
      <span className="text-h1 font-medium tracking-tight text-strong tabular-nums">
        {count.format(value)}
      </span>{" "}
      <span className="text-sub">{label}</span>
    </p>
  );
}

/** The store's day at a glance: sales, the drawer, stock to act on and fiado to collect. */
export default async function PanelHome() {
  const session = await requireAdmin();
  const now = new Date();
  const [report, cash, stockAlerts, receivable] = await Promise.all([
    getFinancialReport({ period: "today" }),
    getCashStatus(),
    countStockAlerts(),
    totalReceivable(),
  ]);
  const { revenue, salesCount } = report.summary;
  return (
    <div className="mx-auto flex max-w-350 flex-col gap-6">
      <div className="flex flex-col gap-1">
        <p className="text-body-sm text-sub first-letter:uppercase">
          {longDate(now)}
        </p>
        <h2 className="text-h1 font-medium tracking-tight text-strong">
          {greeting(now, session.user.name)}
        </h2>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card
          title="Vendas de hoje"
          subtitle="Total faturado desde a meia-noite"
        >
          <div className={BODY}>
            <div className="flex flex-col gap-1">
              <Money cents={revenue} size="xl" />
              <p className="text-body-md text-sub">
                {salesCount === 1
                  ? "1 venda"
                  : `${count.format(salesCount)} vendas`}
              </p>
            </div>
            <CardLink href="/painel/relatorios">Ver relatórios</CardLink>
          </div>
        </Card>

        <Card
          title="Caixa"
          subtitle={
            cash
              ? `Aberto por ${cash.openedBy} em ${formatDateTime(cash.openedAt)}`
              : "Nenhum caixa aberto agora"
          }
          actions={
            <Badge tone={cash ? "success" : "neutral"} dot>
              {cash ? "Aberto" : "Fechado"}
            </Badge>
          }
        >
          <div className={BODY}>
            {cash && (
              <div className="flex flex-col gap-1">
                <Money cents={cash.expectedAmount} size="xl" />
                <p className="text-body-md text-sub">Esperado na gaveta</p>
              </div>
            )}
            <Button
              variant="brand"
              nativeButton={false}
              render={<Link href="/caixa" />}
            >
              <ShoppingCart aria-hidden="true" />
              Ir para Frente de Caixa
            </Button>
          </div>
        </Card>

        <Card
          title="Alertas de estoque"
          subtitle="Estoque baixo ou zerado e lotes vencendo em até 7 dias"
        >
          <div className={BODY}>
            {stockAlerts === 0 ? (
              <p className="text-body-lg text-sub">
                Nenhum produto pede atenção.
              </p>
            ) : (
              <Figure
                value={stockAlerts}
                label={stockAlerts === 1 ? "produto" : "produtos"}
              />
            )}
            <CardLink href="/painel/estoque">Ver estoque</CardLink>
          </div>
        </Card>

        <Card
          title="A receber no fiado"
          subtitle="Soma do saldo devedor dos clientes"
        >
          <div className={BODY}>
            <Money cents={receivable} size="xl" />
            <CardLink href="/painel/clientes">Ver clientes</CardLink>
          </div>
        </Card>
      </div>

      <Card title="Ações rápidas">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {QUICK_ACTIONS.map(({ href, label, icon: Icon }) => (
            <Button
              key={href}
              variant="secondary"
              size="lg"
              fullWidth
              nativeButton={false}
              render={<Link href={href} />}
            >
              <Icon aria-hidden="true" />
              {label}
            </Button>
          ))}
        </div>
      </Card>
    </div>
  );
}
