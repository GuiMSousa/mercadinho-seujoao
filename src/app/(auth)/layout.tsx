import {
  CalendarClock,
  PackageSearch,
  Percent,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { ThemeControl } from "../_components/theme-control";
import { getTheme } from "../theme";

const highlights: { icon: LucideIcon; title: string; text: string }[] = [
  {
    icon: CalendarClock,
    title: "Validade sob controle",
    text: "Estoque por lote e baixa PVPS automática.",
  },
  {
    icon: PackageSearch,
    title: "Sem ruptura",
    text: "Estoque mínimo e lista de reposição gerada sozinha.",
  },
  {
    icon: Wallet,
    title: "Caixa sem furos",
    text: "Troco, sangrias e suprimentos com motivo e fechamento cego.",
  },
  {
    icon: Percent,
    title: "Margem real",
    text: "Faturamento menos CMV registrado no momento da venda.",
  },
];

export default async function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="grid flex-1 bg-app shell:grid-cols-2">
      <aside className="hidden flex-col justify-between gap-8 border-r border-border bg-surface-card p-10 shell:flex">
        <p className="text-h1 font-semibold tracking-display text-strong">
          Mkt Control
        </p>
        <div className="flex max-w-md flex-col gap-7">
          <p className="text-h1 font-medium tracking-tight text-pretty text-strong">
            Controle de vendas e estoque para o seu comércio.
          </p>
          <ul className="flex flex-col gap-4">
            {highlights.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex items-start gap-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-sm bg-surface-sunken text-strong">
                  <Icon aria-hidden="true" className="size-4.5" />
                </span>
                <span className="flex flex-col gap-0.5">
                  <strong className="font-medium text-strong">{title}</strong>
                  <span className="text-body-sm text-sub">{text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
        <p className="text-caption text-sub">© 2026 Mkt Control</p>
      </aside>
      <main className="relative flex flex-col items-center justify-center px-4 py-8">
        <div className="absolute top-4 right-4">
          <ThemeControl variant="icon" initialTheme={await getTheme()} />
        </div>
        <div className="flex w-full max-w-md flex-col gap-6">
          <p className="text-center text-h1 font-semibold tracking-display text-strong shell:hidden">
            Mkt Control
          </p>
          {children}
        </div>
      </main>
    </div>
  );
}
