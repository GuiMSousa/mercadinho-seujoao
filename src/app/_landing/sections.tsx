import {
  FileInput,
  LayoutDashboard,
  LockKeyhole,
  Moon,
  ScanBarcode,
  Store,
} from "lucide-react";
import { cn } from "@ds/lib/cn";
import { ChangeDemo } from "./change-demo";
import { CashDemo, ExpiryDemo, MarginDemo, RestockDemo } from "./loss-demos";

export const container = "mx-auto w-full max-w-6xl px-4 sm:px-6";
const sectionTitle =
  "text-section font-medium tracking-display text-balance text-strong";

const LOSSES = [
  {
    kicker: "01 · Perda por validade",
    kickerClass: "text-warning-fg",
    title: "O que vence primeiro sai primeiro.",
    text: "Estoque controlado por lote e validade. Cada venda dá baixa no lote que vence antes (PVPS), e os lotes a vencer aparecem antes de virar prejuízo.",
    demo: <ExpiryDemo />,
  },
  {
    kicker: "02 · Ruptura",
    kickerClass: "text-warning-fg",
    title: "A prateleira avisa antes de esvaziar.",
    text: "Defina o estoque mínimo de cada produto. Quando ele é atingido, o item entra sozinho na lista de reposição.",
    demo: <RestockDemo />,
  },
  {
    kicker: "03 · Furos no caixa",
    kickerClass: "text-danger-fg",
    title: "Caixa que fecha sem adivinhação.",
    text: "Abertura com troco, sangrias e suprimentos com motivo, e fechamento cego: o operador conta o dinheiro sem ver o valor esperado, e a quebra aparece para o administrador.",
    demo: <CashDemo />,
  },
  {
    kicker: "04 · Cegueira de lucratividade",
    kickerClass: "text-info-fg",
    title: "Margem real, venda por venda.",
    text: "O custo da mercadoria é gravado no momento da venda. Faturamento menos CMV mostra quanto o comércio ganhou de verdade.",
    demo: <MarginDemo />,
  },
];

const FEATURES = [
  {
    icon: ScanBarcode,
    title: "Leitor de código de barras",
    text: "Bipe o produto e ele entra na venda com preço e lote.",
  },
  {
    icon: LockKeyhole,
    title: "Um caixa aberto por loja",
    text: "Sem caixa aberto, a tela de vendas fica bloqueada até alguém abrir com o troco.",
  },
  {
    icon: FileInput,
    title: "Importação de produtos",
    text: "Traga o cadastro inteiro de uma vez e comece a vender no mesmo dia.",
  },
  {
    icon: LayoutDashboard,
    title: "Painel do dono",
    text: "Vendas, margem e lotes a vencer na primeira tela do dia.",
  },
  {
    icon: Store,
    title: "Computador, celular e tablet",
    text: "No PC do balcão ou instalado como app no celular e no tablet.",
  },
  {
    icon: Moon,
    title: "Modo claro e escuro",
    text: "Menos brilho na tela à noite, claro para a loja iluminada.",
  },
];

export function Losses() {
  return (
    <section
      id="ralos"
      aria-labelledby="ralos-titulo"
      className="scroll-mt-16 border-t border-border py-16 lg:py-24"
    >
      <div className={cn(container, "flex flex-col gap-16 lg:gap-24")}>
        <p id="ralos-titulo" className="text-body-sm font-medium text-sub">
          Os quatro ralos do pequeno comércio
        </p>
        {LOSSES.map((loss) => (
          <article
            key={loss.kicker}
            className="grid items-center gap-8 lg:grid-cols-2 lg:gap-16"
          >
            <div className="flex min-w-0 flex-col gap-4">
              <p className={cn("text-body-md font-medium", loss.kickerClass)}>
                {loss.kicker}
              </p>
              <h2 className={sectionTitle}>{loss.title}</h2>
              <p className="max-w-lg text-pretty">{loss.text}</p>
            </div>
            <div className="w-full max-w-lg min-w-0 justify-self-center">
              {loss.demo}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export function Counter() {
  return (
    <section
      id="balcao"
      className="scroll-mt-16 border-t border-border bg-surface-card"
    >
      <div
        className={cn(
          container,
          "flex flex-col gap-12 py-16 lg:gap-24 lg:py-32",
        )}
      >
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-20">
          <div className="flex min-w-0 flex-col gap-5">
            <p className="text-body-sm font-medium text-sub">
              Feito para o balcão
            </p>
            <h2 className={sectionTitle}>
              Botões grandes. Números grandes. Fila andando.
            </h2>
            <p className="max-w-lg text-pretty">
              As telas de venda, caixa e entrada usam botões de 60 px e texto
              acima de 16 pt. Funciona com leitor de código de barras, no toque
              e no teclado. Experimente o troco ao lado.
            </p>
          </div>
          <ChangeDemo />
        </div>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <li
              key={title}
              className="flex flex-col gap-3.5 rounded-card border border-border-soft bg-app p-6"
            >
              <span className="flex size-10 items-center justify-center rounded-md border border-border-soft bg-surface-card text-strong">
                <Icon aria-hidden="true" className="size-5" />
              </span>
              <h3 className="text-h3 font-medium text-strong">{title}</h3>
              <p className="text-body-md text-sub">{text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
