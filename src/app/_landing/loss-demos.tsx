import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Banknote,
  PackageX,
  ShoppingCart,
} from "lucide-react";
import { Badge } from "@ds/components/badge";
import { Card } from "@ds/components/card";
import { Money } from "@ds/components/money";
import { cn } from "@ds/lib/cn";

const panel = "shadow-(--shadow-xl)";

const LOTS = [
  {
    code: "L-0412",
    quantity: 12,
    tone: "danger",
    tag: "Vence em 2 dias",
    width: "w-1/2",
    bar: "bg-expiry-expired",
    first: true,
  },
  {
    code: "L-0419",
    quantity: 24,
    tone: "warning",
    tag: "Vence em 9 dias",
    width: "w-full",
    bar: "bg-expiry-soon",
    first: false,
  },
  {
    code: "L-0425",
    quantity: 24,
    tone: "warning",
    tag: "Vence em 18 dias",
    width: "w-full",
    bar: "bg-expiry-soon",
    first: false,
  },
] as const;

export function ExpiryDemo() {
  return (
    <Card
      title="Iogurte natural 170 g"
      subtitle="3 lotes em estoque · PVPS ativo"
      titleAs="h3"
      className={panel}
    >
      <ul className="flex flex-col gap-2.5">
        {LOTS.map((lot) => (
          <li
            key={lot.code}
            className={cn(
              "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2.5 rounded-lg border p-3",
              lot.first ? "border-selected-border" : "border-border-soft",
            )}
          >
            <span className="text-body-md font-medium text-strong">
              {lot.code}
            </span>
            <Badge tone={lot.tone} size="sm" dot>
              {lot.tag}
            </Badge>
            <div className="h-1.5 overflow-hidden rounded-full bg-surface-sunken">
              <div className={cn("h-full rounded-full", lot.width, lot.bar)} />
            </div>
            <span className="min-w-11 text-right text-body-sm text-body tabular-nums">
              {lot.quantity} un
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-body-sm text-sub">
        Próxima venda baixa do lote L-0412, o que vence primeiro.
      </p>
    </Card>
  );
}

const STOCK = [
  {
    name: "Café torrado 500 g",
    quantity: 4,
    min: 6,
    width: "w-1/5",
    minAt: "left-3/10",
    low: true,
  },
  {
    name: "Açúcar cristal 1 kg",
    quantity: 32,
    min: 10,
    width: "w-4/5",
    minAt: "left-1/4",
    low: false,
  },
  {
    name: "Óleo de soja 900 ml",
    quantity: 18,
    min: 8,
    width: "w-3/5",
    minAt: "left-4/15",
    low: false,
  },
];

export function RestockDemo() {
  return (
    <Card
      title="Estoque"
      subtitle="Mínimo configurado por produto"
      titleAs="h3"
      className={panel}
    >
      <ul className="flex flex-col gap-4">
        {STOCK.map((product) => (
          <li key={product.name} className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
              <span className="text-body-md font-medium text-strong">
                {product.name}
              </span>
              {product.low ? (
                <Badge tone="warning" size="sm" dot>
                  Abaixo do mínimo
                </Badge>
              ) : (
                <span className="text-body-sm text-sub tabular-nums">
                  {product.quantity} un · mínimo {product.min}
                </span>
              )}
            </div>
            <div className="relative h-2 rounded-full bg-surface-sunken">
              <div
                className={cn(
                  "h-full rounded-full",
                  product.width,
                  product.low ? "bg-warning-solid" : "bg-brand",
                )}
              />
              <div
                className={cn(
                  "absolute -inset-y-1 w-0.5 rounded-full bg-primary",
                  product.minAt,
                )}
              />
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex items-center gap-2.5 rounded-lg bg-surface-sunken p-3">
        <PackageX
          aria-hidden="true"
          className="size-4 shrink-0 text-warning-fg"
        />
        <span className="flex-1 text-body-md text-strong">
          Lista de reposição: Café torrado 500 g
        </span>
        <span className="text-body-sm text-sub tabular-nums">Repor 16 un</span>
      </div>
    </Card>
  );
}

const MOVES = [
  {
    icon: Banknote,
    label: "Abertura",
    detail: "Troco inicial",
    cents: 15000,
  },
  {
    icon: ShoppingCart,
    label: "Vendas em dinheiro",
    detail: "42 vendas",
    cents: 179000,
  },
  {
    icon: ArrowUpFromLine,
    label: "Sangria",
    detail: "Motivo: depósito no banco",
    cents: -50000,
  },
  {
    icon: ArrowDownToLine,
    label: "Suprimento",
    detail: "Motivo: moedas para troco",
    cents: 5000,
  },
];

export function CashDemo() {
  return (
    <Card
      title="Caixa 01"
      subtitle="Movimentos do dia"
      titleAs="h3"
      className={panel}
    >
      <ul className="flex flex-col">
        {MOVES.map(({ icon: Icon, label, detail, cents }) => (
          <li
            key={label}
            className="flex items-center gap-3 border-b border-border-soft py-2"
          >
            <span
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-md",
                cents < 0
                  ? "bg-danger-bg text-danger-fg"
                  : "bg-surface-sunken text-strong",
              )}
            >
              <Icon aria-hidden="true" className="size-4" />
            </span>
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="text-body-md font-medium text-strong">
                {label}
              </span>
              <span className="text-caption text-sub">{detail}</span>
            </div>
            <Money
              cents={cents}
              size="sm"
              signed
              tone={cents < 0 ? "out" : undefined}
            />
          </li>
        ))}
      </ul>
      <div className="mt-3 flex flex-col gap-1.5 rounded-lg border border-border p-4">
        <span className="text-body-sm text-sub">
          Fechamento cego · valor contado pelo operador
        </span>
        <Money cents={148230} size="xl" />
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <span className="text-body-sm text-sub">
          Esperado <Money cents={149000} size="sm" /> · só o administrador vê
        </span>
        <Badge tone="danger" dot>
          Quebra <Money cents={-770} size="sm" tone="out" />
        </Badge>
      </div>
    </Card>
  );
}

// Margin is 28% of revenue on every day of the sample, so the split is constant.
const WEEK = [
  { day: "seg", height: "h-63/100" },
  { day: "ter", height: "h-73/100" },
  { day: "qua", height: "h-68/100" },
  { day: "qui", height: "h-79/100" },
  { day: "sex", height: "h-91/100" },
  { day: "sáb", height: "h-full" },
  { day: "dom", height: "h-66/100" },
];

const WEEK_TOTALS = [
  { label: "Faturamento", cents: 1842000 },
  { label: "CMV", cents: 1326240 },
  { label: "Margem", cents: 515760, tone: "margin" as const },
];

export function MarginDemo() {
  return (
    <Card
      title="Margem da semana"
      subtitle="Faturamento − CMV"
      titleAs="h3"
      actions={
        <Badge tone="success" size="sm">
          28,0%
        </Badge>
      }
      className={panel}
    >
      <div
        role="img"
        aria-label="Faturamento de segunda a domingo: cresce até sábado, o maior dia, e cai no domingo. A margem é 28% de cada dia."
        className="flex h-40 items-end gap-2.5"
      >
        {WEEK.map(({ day, height }) => (
          <div
            key={day}
            className="flex h-full flex-1 flex-col justify-end gap-2"
          >
            <div className={cn("flex min-h-0 flex-col gap-0.5", height)}>
              <div className="flex-28 rounded-t-xs bg-brand" />
              <div className="flex-72 bg-sub" />
            </div>
            <span className="text-center text-caption text-sub">{day}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 flex gap-4 text-caption text-sub">
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-xs bg-brand" />
          Margem
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-xs bg-sub" />
          CMV
        </span>
      </div>
      <dl className="mt-4 grid grid-cols-3 gap-3 border-t border-border-soft pt-4">
        {WEEK_TOTALS.map((stat) => (
          <div key={stat.label} className="flex min-w-0 flex-col gap-1">
            <dt className="text-caption text-sub">{stat.label}</dt>
            <dd>
              <Money cents={stat.cents} size="sm" tone={stat.tone} />
            </dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}
