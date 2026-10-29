"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@ds/components/badge";
import { Button } from "@ds/components/button";
import { Checkbox } from "@ds/components/checkbox";
import { Dialog } from "@ds/components/dialog";
import { Input } from "@ds/components/input";
import { Keypad } from "@ds/components/keypad";
import { Money } from "@ds/components/money";
import { Table, type TableColumn } from "@ds/components/table";
import { keypadCents } from "@ds/lib/keypad";

/** Sets data-theme on <html> so portaled layers (dialogs) switch too; restores light on leave. */
export function ThemeSwitch() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") root.dataset.theme = "dark";
    else delete root.dataset.theme;
    return () => {
      delete root.dataset.theme;
    };
  }, [theme]);
  return (
    <div
      role="group"
      aria-label="Tema"
      className="inline-flex gap-1 rounded-lg bg-surface-sunken p-1"
    >
      <Button
        size="sm"
        variant={theme === "light" ? "secondary" : "ghost"}
        aria-pressed={theme === "light"}
        onClick={() => setTheme("light")}
      >
        <Sun aria-hidden="true" />
        Modo claro
      </Button>
      <Button
        size="sm"
        variant={theme === "dark" ? "secondary" : "ghost"}
        aria-pressed={theme === "dark"}
        onClick={() => setTheme("dark")}
      >
        <Moon aria-hidden="true" />
        Modo escuro
      </Button>
    </div>
  );
}

type Product = {
  id: string;
  name: string;
  expiry: "ok" | "soon" | "expired";
  stock: number;
  priceCents: number;
};

const products: Product[] = [
  {
    id: "1",
    name: "Leite integral 1 L",
    expiry: "soon",
    stock: 24,
    priceCents: 589,
  },
  {
    id: "2",
    name: "Arroz tipo 1 5 kg",
    expiry: "ok",
    stock: 12,
    priceCents: 2790,
  },
  {
    id: "3",
    name: "Iogurte natural 170 g",
    expiry: "expired",
    stock: 3,
    priceCents: 349,
  },
];

const expiryBadge = {
  ok: (
    <Badge tone="success" dot>
      No prazo
    </Badge>
  ),
  soon: (
    <Badge tone="warning" dot>
      Vence em 3 dias
    </Badge>
  ),
  expired: (
    <Badge tone="danger" dot>
      Vencido
    </Badge>
  ),
};

export function SelectableTable() {
  const [selected, setSelected] = useState<string[]>(["1"]);
  const all = selected.length === products.length;
  const toggle = (id: string, checked: boolean) =>
    setSelected((current) =>
      checked ? [...current, id] : current.filter((item) => item !== id),
    );
  const columns: TableColumn<Product>[] = [
    {
      key: "select",
      label: (
        <Checkbox
          aria-label="Selecionar todos"
          checked={all}
          indeterminate={selected.length > 0 && !all}
          onCheckedChange={(checked) =>
            setSelected(checked ? products.map((product) => product.id) : [])
          }
        />
      ),
      render: (product) => (
        <Checkbox
          aria-label={`Selecionar ${product.name}`}
          checked={selected.includes(product.id)}
          onCheckedChange={(checked) => toggle(product.id, checked)}
        />
      ),
    },
    { key: "name", label: "Produto", render: (product) => product.name },
    {
      key: "expiry",
      label: "Validade",
      render: (product) => expiryBadge[product.expiry],
    },
    {
      key: "stock",
      label: "Estoque",
      align: "right",
      render: (product) => `${product.stock} un`,
    },
    {
      key: "price",
      label: "Preço",
      align: "right",
      render: (product) => <Money cents={product.priceCents} size="sm" />,
    },
  ];
  return (
    <Table
      caption="Produtos com seleção"
      columns={columns}
      rows={products}
      rowKey={(product) => product.id}
      isSelected={(product) => selected.includes(product.id)}
    />
  );
}

export function DialogDemo() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Registrar sangria
      </Button>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title="Registrar sangria"
        description="Retirada de dinheiro do caixa. O motivo é obrigatório."
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => setOpen(false)}>Registrar sangria</Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Input label="Valor" prefix="R$" numeric inputMode="decimal" />
          <Input label="Motivo" hint="Ex.: pagamento de fornecedor." />
        </div>
      </Dialog>
    </>
  );
}

export function KeypadDemo() {
  const [value, setValue] = useState("");
  return (
    <div className="flex max-w-xs flex-col gap-4">
      <output aria-live="polite" className="text-right">
        <Money cents={keypadCents(value)} size="counter" />
      </output>
      <Keypad value={value} onChange={setValue} label="Valor recebido" />
    </div>
  );
}
