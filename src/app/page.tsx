import {
  CalendarClock,
  PackageSearch,
  Store,
  TrendingUp,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { cookies } from "next/headers";
import Link from "next/link";
import { SESSION_COOKIE } from "@/contracts/auth";
import { readSessionToken } from "@/domains/auth/session";
import { LogoutButton } from "./logout-button";

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

const roleLabel = { ADMIN: "Administrador", CASHIER: "Operador de caixa" };

export default async function Home() {
  const session = await readSessionToken(
    (await cookies()).get(SESSION_COOKIE)?.value,
  );
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-10 px-4 py-12 sm:px-8 sm:py-16">
      <header className="flex flex-col gap-4">
        <p className="flex items-center gap-2 text-body-md font-medium text-sub">
          <Store aria-hidden="true" className="size-5" />
          Mkt Control
        </p>
        <h1 className="text-h1 font-medium tracking-tight text-balance text-strong sm:text-display sm:tracking-display">
          Controle de vendas e estoque para o pequeno comércio
        </h1>
        <p className="max-w-2xl text-h3 font-normal text-sub">
          A base técnica está pronta. As funcionalidades do balcão serão
          entregues uma por vez.
        </p>
        {session ? (
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-strong">
              Você entrou como <strong>{session.username}</strong> (
              {roleLabel[session.role]}).
            </p>
            <LogoutButton />
          </div>
        ) : (
          <Link
            href="/login"
            className="w-fit font-medium text-link underline underline-offset-4"
          >
            Entrar no sistema
          </Link>
        )}
      </header>

      <section
        aria-labelledby="pillars-heading"
        className="flex flex-col gap-4"
      >
        <h2 id="pillars-heading" className="text-h2 font-medium text-strong">
          O que o sistema vai resolver
        </h2>
        <ul className="grid gap-4 sm:grid-cols-2">
          {pillars.map(({ icon: Icon, title, description }) => (
            <li
              key={title}
              className="flex gap-4 rounded-card border border-border-soft bg-surface-card p-5 shadow-(--shadow-sm)"
            >
              <Icon
                aria-hidden="true"
                className="mt-0.5 size-6 shrink-0 text-brand"
              />
              <div className="flex flex-col gap-1">
                <h3 className="font-medium text-strong">{title}</h3>
                <p className="text-sub">{description}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
