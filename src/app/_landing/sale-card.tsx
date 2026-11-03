import {
  CalendarClock,
  PackageX,
  ScanBarcode,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { Badge } from "@ds/components/badge";
import { Money } from "@ds/components/money";
import { cn } from "@ds/lib/cn";

const ITEMS = [
  {
    name: "Arroz tipo 1 5 kg",
    amount: "1 un",
    price: 2790,
    per: "",
    cents: 2790,
  },
  {
    name: "Leite integral 1 L",
    amount: "2 un",
    price: 499,
    per: "",
    cents: 998,
  },
  {
    name: "Café torrado 500 g",
    amount: "1 un",
    price: 1849,
    per: "",
    cents: 1849,
  },
  {
    name: "Banana prata",
    amount: "1,200 kg",
    price: 690,
    per: "/kg",
    cents: 828,
  },
  {
    name: "Pão francês",
    amount: "0,600 kg",
    price: 1590,
    per: "/kg",
    cents: 954,
  },
];
const TOTAL_CENTS = ITEMS.reduce((sum, item) => sum + item.cents, 0);

function Chip({
  icon: Icon,
  iconClass,
  title,
  className,
  children,
}: {
  icon: LucideIcon;
  iconClass: string;
  title: string;
  className: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "absolute z-10 hidden items-center gap-2.5 rounded-xl border border-border-soft bg-surface-card py-2.5 pr-3 pl-2.5 shadow-(--shadow-lg) xl:flex",
        className,
      )}
    >
      <span
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-md",
          iconClass,
        )}
      >
        <Icon aria-hidden="true" className="size-4" />
      </span>
      <div className="flex flex-col gap-1">
        <span className="text-body-sm font-medium text-strong">{title}</span>
        {children}
      </div>
    </div>
  );
}

/** Sample sale on the landing hero: an illustration, so nothing in it is interactive. */
export function SaleCard() {
  return (
    <div className="relative w-full max-w-md xl:py-7">
      <Chip
        icon={CalendarClock}
        iconClass="bg-danger-bg text-danger-fg"
        title="Iogurte natural · L-0412"
        className="top-0 -left-16"
      >
        <Badge tone="danger" size="sm" dot>
          Vence em 2 dias
        </Badge>
      </Chip>
      <Chip
        icon={PackageX}
        iconClass="bg-info-bg text-info-fg"
        title="Café torrado 500 g"
        className="top-5/12 -right-16"
      >
        <span className="text-caption text-sub">Entrou na reposição</span>
      </Chip>
      <Chip
        icon={TrendingUp}
        iconClass="bg-success-bg text-success-fg"
        title="Margem de hoje"
        className="bottom-0 -left-12"
      >
        <Money cents={128460} size="sm" tone="margin" />
      </Chip>

      <div className="overflow-hidden rounded-card border border-border-soft bg-surface-card shadow-(--shadow-xl)">
        <div className="flex items-center justify-between gap-3 px-5 pt-4 pb-3">
          <div className="flex flex-col gap-0.5">
            <span className="font-medium text-strong">Venda 0148</span>
            <span className="text-body-sm text-sub">Caixa 01 · Ana</span>
          </div>
          <Badge tone="success" size="sm" dot>
            Caixa aberto
          </Badge>
        </div>
        <div className="mx-5 flex h-control-counter items-center gap-3 rounded-lg border border-border bg-app px-4">
          <ScanBarcode aria-hidden="true" className="size-6 text-sub" />
          <span className="text-sub">Bipe ou digite o código</span>
        </div>
        <ul className="flex flex-col px-5 pt-2.5 pb-1">
          {ITEMS.map((item) => (
            <li
              key={item.name}
              className="flex items-center justify-between gap-3 border-b border-border-soft py-2.5 last:border-b-0"
            >
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="text-body-md font-medium text-strong">
                  {item.name}
                </span>
                <span className="text-caption text-sub tabular-nums">
                  {item.amount} ×{" "}
                  <Money
                    cents={item.price}
                    size="sm"
                    className="text-caption font-normal text-sub"
                  />
                  {item.per}
                </span>
              </div>
              <Money cents={item.cents} size="sm" />
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap items-end justify-between gap-3 border-t border-border bg-app px-5 pt-4 pb-5">
          <div className="flex flex-col gap-1">
            <span className="text-body-md text-sub">Total</span>
            <span className="text-body-sm text-sub">{ITEMS.length} itens</span>
          </div>
          <Money cents={TOTAL_CENTS} size="display" />
        </div>
      </div>
    </div>
  );
}
