import {
  CalendarClock,
  PackageSearch,
  Store,
  TrendingUp,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";

const pillars: { icon: LucideIcon; title: string; description: string }[] = [
  {
    icon: CalendarClock,
    title: "Validade sob controle",
    description:
      "Estoque por lote com baixa automática pelo que vence primeiro.",
  },
  {
    icon: PackageSearch,
    title: "Sem falta na prateleira",
    description: "Estoque mínimo e lista de reposição gerada automaticamente.",
  },
  {
    icon: Wallet,
    title: "Caixa que fecha",
    description:
      "Abertura, sangrias, suprimentos e fechamento cego com conferência.",
  },
  {
    icon: TrendingUp,
    title: "Lucro de verdade",
    description:
      "Faturamento comparado ao custo de cada venda, não só ao total vendido.",
  },
];

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-10 px-4 py-12 sm:px-8 sm:py-16">
      <header className="flex flex-col gap-4">
        <p className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Store aria-hidden="true" className="size-5" />
          Mkt Control
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          Controle de vendas e estoque para o pequeno comércio
        </h1>
        <p className="max-w-2xl text-lg text-muted-foreground">
          A base técnica está pronta. As funcionalidades do balcão serão
          entregues uma por vez.
        </p>
        <Link
          href="/login"
          className="w-fit font-medium text-primary underline underline-offset-4"
        >
          Entrar no sistema
        </Link>
      </header>

      <section
        aria-labelledby="pillars-heading"
        className="flex flex-col gap-4"
      >
        <h2 id="pillars-heading" className="text-xl font-semibold">
          O que o sistema vai resolver
        </h2>
        <ul className="grid gap-4 sm:grid-cols-2">
          {pillars.map(({ icon: Icon, title, description }) => (
            <li
              key={title}
              className="flex gap-4 rounded-xl border bg-card p-5 text-card-foreground"
            >
              <Icon
                aria-hidden="true"
                className="mt-0.5 size-6 shrink-0 text-primary"
              />
              <div className="flex flex-col gap-1">
                <h3 className="font-medium">{title}</h3>
                <p className="text-muted-foreground">{description}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
