import type { Metadata } from "next";
import { Download, Plus, Printer, Trash2 } from "lucide-react";
import type { ReactNode } from "react";
import { Badge } from "@ds/components/badge";
import { Button, IconButton } from "@ds/components/button";
import { Card } from "@ds/components/card";
import { Checkbox } from "@ds/components/checkbox";
import { Input } from "@ds/components/input";
import { Money } from "@ds/components/money";
import { Select } from "@ds/components/select";
import { Table } from "@ds/components/table";
import { DialogDemo, KeypadDemo, SelectableTable, ThemeSwitch } from "./demos";
import { TokensSection } from "./tokens-section";

export const metadata: Metadata = { title: "Design system — Mkt Control" };

const buttonVariants = [
  "primary",
  "brand",
  "secondary",
  "soft",
  "ghost",
  "danger",
] as const;
const sizes = ["sm", "md", "lg", "counter"] as const;
const paymentOptions = [
  { value: "dinheiro", label: "Dinheiro" },
  { value: "pix", label: "Pix" },
  { value: "cartao", label: "Cartão" },
];

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-4">
      <h2 id={id} className="text-h2 font-medium tracking-tight text-strong">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Row({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-center gap-3">{children}</div>;
}

export default function DesignSystemPage() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 py-10 sm:px-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-h1 font-medium tracking-tight text-strong">
            Design system
          </h1>
          <p className="text-sub">
            Componentes, estados e temas do Mkt Control. Use Tab para ver o
            foco.
          </p>
        </div>
        <ThemeSwitch />
      </header>

      <Section id="tokens" title="Tokens">
        <TokensSection />
      </Section>

      <Section id="botoes" title="Botões">
        <Row>
          {buttonVariants.map((variant) => (
            <Button key={variant} variant={variant}>
              {variant}
            </Button>
          ))}
        </Row>
        <Row>
          {sizes.map((size) => (
            <Button key={size} size={size} variant="brand">
              <Plus aria-hidden="true" />
              Tamanho {size}
            </Button>
          ))}
        </Row>
        <Row>
          <Button disabled>Desabilitado</Button>
          <Button variant="brand" loading>
            Salvando…
          </Button>
          <Button variant="secondary" fullWidth>
            Largura total
          </Button>
        </Row>
        <Row>
          <IconButton icon={Printer} label="Imprimir" />
          <IconButton icon={Download} label="Baixar" variant="ghost" />
          <IconButton icon={Plus} label="Adicionar" variant="primary" />
          <IconButton icon={Plus} label="Adicionar item" variant="brand" />
          <IconButton icon={Trash2} label="Excluir" variant="danger" />
          <IconButton icon={Trash2} label="Excluir" disabled />
          <IconButton
            icon={Plus}
            label="Adicionar"
            variant="brand"
            size="counter"
          />
        </Row>
      </Section>

      <Section id="campos" title="Campos">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Input label="Nome do produto" placeholder="Ex.: Café 500 g" />
          <Input label="Código de barras" hint="Bipe ou digite o código." />
          <Input
            label="Preço de venda"
            prefix="R$"
            numeric
            inputMode="decimal"
            defaultValue="12,90"
            error="O preço de venda precisa ser maior que o custo."
          />
          <Input
            label="Estoque"
            suffix="un"
            numeric
            inputMode="numeric"
            defaultValue="24"
            disabled
          />
          <Select
            label="Forma de pagamento"
            options={paymentOptions}
            placeholder="Escolha"
            defaultValue=""
          />
          <Select
            label="Forma de pagamento"
            options={paymentOptions}
            defaultValue="pix"
            error="Pix indisponível no momento."
          />
          <Input
            label="Valor recebido"
            prefix="R$"
            numeric
            inputMode="decimal"
            size="counter"
          />
          <Select
            label="Operador"
            options={[{ value: "ana", label: "Ana" }]}
            disabled
          />
        </div>
        <Row>
          <Checkbox label="Imprimir comprovante" />
          <Checkbox label="Baixa por PVPS" defaultChecked />
          <Checkbox label="Parcial" indeterminate />
          <Checkbox label="Indisponível" disabled />
          <Checkbox label="Bloqueado" defaultChecked disabled />
        </Row>
      </Section>

      <Section id="exibicao" title="Badges e valores">
        <Row>
          <Badge tone="success" dot>
            No prazo
          </Badge>
          <Badge tone="warning" dot>
            Abaixo do mínimo
          </Badge>
          <Badge tone="danger" dot>
            Vencido
          </Badge>
          <Badge tone="info">Caixa aberto</Badge>
          <Badge>Rascunho</Badge>
          <Badge tone="success" size="sm">
            Pago
          </Badge>
        </Row>
        <Row>
          <Money cents={123456} size="sm" />
          <Money cents={123456} />
          <Money cents={123456} size="lg" />
          <Money cents={4589} size="counter" />
        </Row>
        <Row>
          <Money cents={250000} tone="in" signed />
          <Money cents={-38000} tone="out" />
          <Money cents={92050} tone="margin" />
          <Money cents={123456} hidden />
        </Row>
      </Section>

      <Section id="composicao" title="Cartões, tabelas e diálogo">
        <div className="grid gap-6 lg:grid-cols-2">
          <Card
            title="Lotes a vencer"
            subtitle="Próximos 7 dias"
            titleAs="h3"
            actions={<IconButton icon={Download} label="Exportar lotes" />}
            flush
          >
            <SelectableTable />
          </Card>
          <Card title="Reposição" subtitle="Sem itens" titleAs="h3" flush>
            <Table
              caption="Lista de reposição"
              columns={[
                { key: "name", label: "Produto", render: () => null },
                { key: "qty", label: "Sugerido", render: () => null },
              ]}
              rows={[]}
              rowKey={() => ""}
              empty="Nenhum produto abaixo do mínimo."
            />
          </Card>
        </div>
        <Row>
          <DialogDemo />
        </Row>
      </Section>

      <Section id="balcao" title="Balcão">
        <KeypadDemo />
      </Section>
    </main>
  );
}
