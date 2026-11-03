import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Badge } from "@ds/components/badge";
import { buttonVariants } from "@ds/components/button";
import { cn } from "@ds/lib/cn";
import { ThemeControl } from "../_components/theme-control";
import { ProfilePreview } from "./profile-preview";
import { Rotator } from "./rotator";
import { SaleCard } from "./sale-card";
import { container, Counter, Losses } from "./sections";

const NAV = [
  { href: "#ralos", label: "Como funciona" },
  { href: "#perfis", label: "Perfis" },
  { href: "#balcao", label: "No balcão" },
];

const VOCABULARY = [
  "caixa",
  "troco",
  "sangria",
  "suprimento",
  "fechamento cego",
  "lote",
  "validade",
  "PVPS",
  "reposição",
  "CMV",
  "margem",
];

function LoginButton({
  size,
  variant = "brand",
  children,
}: {
  size: "md" | "lg" | "counter";
  variant?: "brand" | "primary";
  children: ReactNode;
}) {
  // A plain link: it goes somewhere, so it must not be announced as a button.
  return (
    <Link href="/login" className={buttonVariants({ variant, size })}>
      {children}
    </Link>
  );
}

function Header({ initialTheme }: { initialTheme?: "light" | "dark" }) {
  return (
    <header className="sticky top-0 z-50 border-b border-border-soft bg-app">
      <div
        className={cn(
          container,
          "flex h-16 items-center justify-between gap-4",
        )}
      >
        <a
          href="#topo"
          className="text-h3 font-semibold tracking-display whitespace-nowrap text-strong"
        >
          Mkt Control
        </a>
        <nav aria-label="Principal" className="flex items-center gap-2">
          <div className="mr-3 hidden items-center gap-1 md:flex">
            {NAV.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="rounded-sm px-3 py-2 text-body-md font-medium hover:bg-surface-sunken hover:text-strong"
              >
                {item.label}
              </a>
            ))}
          </div>
          <ThemeControl variant="icon" initialTheme={initialTheme} />
          <LoginButton size="md" variant="primary">
            Entrar
          </LoginButton>
        </nav>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section
      className={cn(
        container,
        "grid items-center gap-12 py-12 lg:grid-cols-2 lg:gap-20 lg:py-24",
      )}
    >
      <div className="flex min-w-0 flex-col items-start gap-6">
        <Badge tone="info" dot>
          Para mercadinhos e pequenos comércios
        </Badge>
        <h1 className="text-hero font-medium tracking-display text-strong">
          Pare de perder dinheiro com <Rotator />
        </h1>
        <p className="max-w-xl text-h3 font-normal text-pretty">
          Mkt Control é o sistema de vendas e estoque para o pequeno
          comerciante. Validade por lote, reposição automática, caixa com
          fechamento cego e margem real em cada venda, no computador do balcão
          ou no celular.
        </p>
        <div className="flex flex-wrap gap-3">
          <LoginButton size="lg">
            Entrar no sistema
            <ArrowRight aria-hidden="true" />
          </LoginButton>
          <a
            href="#ralos"
            className={buttonVariants({ variant: "secondary", size: "lg" })}
          >
            Ver como funciona
          </a>
        </div>
      </div>
      <div className="flex min-w-0 justify-center">
        <SaleCard />
      </div>
    </section>
  );
}

function Manifesto() {
  return (
    <section className="border-t border-border py-16 lg:py-32">
      <p
        className={cn(
          container,
          "text-section font-medium tracking-display text-pretty text-strong",
        )}
      >
        Num mercadinho, o lucro não some de uma vez. Ele escorre pelo{" "}
        <span className="text-warning-fg">
          produto que venceu na prateleira,
        </span>{" "}
        pelo{" "}
        <span className="text-warning-fg">
          item que faltou na hora da venda,
        </span>{" "}
        pelo{" "}
        <span className="text-danger-fg">caixa que não bate no fim do dia</span>{" "}
        e pelo <span className="text-link">preço que não cobre o custo.</span>
      </p>
    </section>
  );
}

function Vocabulary() {
  return (
    <section
      aria-label="Vocabulário do balcão"
      className="border-y border-border bg-surface-card py-10 lg:py-16"
    >
      <ul
        className={cn(
          container,
          "flex flex-wrap gap-x-6 gap-y-2 text-section font-medium tracking-display text-strong",
        )}
      >
        {VOCABULARY.map((word) => (
          <li key={word}>{word}</li>
        ))}
      </ul>
    </section>
  );
}

function FinalCall() {
  // A dark subtree: the same tokens resolve to the dark theme, whatever the page theme is.
  return (
    <section data-theme="dark" className="bg-app text-body">
      <div
        className={cn(
          container,
          "flex flex-col items-start gap-8 pt-20 pb-14 lg:pt-40 lg:pb-28",
        )}
      >
        <h2 className="max-w-4xl text-hero font-medium tracking-display text-balance text-strong">
          Feche o caixa hoje sabendo quanto ganhou.
        </h2>
        <p className="max-w-xl text-pretty">
          Vendas, estoque por lote, caixa e margem num só sistema, pensado para
          quem atende no balcão.
        </p>
        <LoginButton size="counter">
          Entrar no Mkt Control
          <ArrowRight aria-hidden="true" />
        </LoginButton>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer data-theme="dark" className="bg-app">
      <div className={cn(container, "pb-10")}>
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6">
          <span className="text-h3 font-semibold tracking-display text-strong">
            Mkt Control
          </span>
          <span className="text-body-sm text-sub">
            Vendas e estoque para o pequeno comércio · © 2026
          </span>
        </div>
      </div>
    </footer>
  );
}

/** Public home page. Sample figures only: nothing here reads store data. */
export function Landing({ initialTheme }: { initialTheme?: "light" | "dark" }) {
  return (
    <>
      <Header initialTheme={initialTheme} />
      <main id="topo">
        <Hero />
        <Manifesto />
        <Losses />
        <Vocabulary />
        <section id="perfis" className={cn(container, "py-16 lg:py-32")}>
          <ProfilePreview />
        </section>
        <Counter />
        <FinalCall />
      </main>
      <Footer />
    </>
  );
}
