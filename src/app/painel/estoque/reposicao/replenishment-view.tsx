"use client";

import { MessageCircle } from "lucide-react";
import type { Replenishment, ReplenishmentGroup } from "@/contracts/suppliers";
import { formatQuantity } from "@/app/painel/produtos/product-form";
import { Badge } from "@ds/components/badge";
import { buttonVariants } from "@ds/components/button";
import { Card } from "@ds/components/card";
import { Table, type TableColumn } from "@ds/components/table";
import { cn } from "@ds/lib/cn";
import { expiryLabel, SIGNAL_TONE } from "../signal-labels";
import { orderItems, orderLink, type OrderStore } from "./order-text";

type Item = ReplenishmentGroup["items"][number];

const columns: TableColumn<Item>[] = [
  {
    key: "name",
    label: "Produto",
    wrap: true,
    render: (item) => (
      <span className="flex flex-col items-start wrap-anywhere">
        <span className="font-medium">{item.name}</span>
        <span className="text-body-sm text-sub tabular-nums">
          {item.supplierCode ? `Cód. ${item.supplierCode}` : item.barcode}
        </span>
      </span>
    ),
  },
  {
    key: "signal",
    label: "Situação",
    render: (item) => (
      <Badge tone={SIGNAL_TONE[item.signal]} dot>
        {item.stock <= item.minStock
          ? item.stock === 0
            ? "Sem estoque"
            : "Estoque crítico"
          : expiryLabel(item.daysLeft)}
      </Badge>
    ),
  },
  {
    key: "stock",
    label: "Estoque / mínimo",
    align: "right",
    className: "hidden sm:table-cell",
    render: (item) =>
      `${formatQuantity(item.stock, item.unit)} / ${formatQuantity(item.minStock, item.unit)}`,
  },
  {
    key: "suggested",
    label: "Comprar",
    align: "right",
    render: (item) =>
      item.suggested > 0 ? (
        <span className="font-medium">
          {formatQuantity(item.suggested, item.unit)}
        </span>
      ) : (
        <span className="text-sub">—</span>
      ),
  },
];

function OrderButton({
  store,
  group,
}: {
  store: OrderStore;
  group: ReplenishmentGroup;
}) {
  const link = orderLink(store, group);
  if (!link)
    return (
      <span className="text-body-md text-sub">
        {orderItems(group).length === 0
          ? "Nada a comprar agora"
          : "Cadastre o WhatsApp do fornecedor"}
      </span>
    );
  // A real link: it leaves for WhatsApp in a new tab, on the supplier's chat.
  return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(buttonVariants({ variant: "secondary", size: "sm" }))}
    >
      <MessageCircle aria-hidden="true" />
      Enviar pedido
      <span className="sr-only">
        {" "}
        para {group.supplier?.name} por WhatsApp (abre em outra aba)
      </span>
    </a>
  );
}

/** What to buy, one card per default supplier, each with its WhatsApp order. */
export function ReplenishmentView({
  replenishment,
  store,
}: {
  replenishment: Replenishment;
  store: OrderStore;
}) {
  if (replenishment.groups.length === 0)
    return (
      <Card>
        <p className="text-center text-sub">
          Nenhum produto no mínimo ou vencendo em até 30 dias.
        </p>
      </Card>
    );
  return (
    <div className="flex flex-col gap-6">
      {replenishment.groups.map((group) => (
        <Card
          key={group.supplier?.id ?? "none"}
          flush
          title={group.supplier?.name ?? "Sem fornecedor padrão ativo"}
          subtitle={
            group.supplier
              ? [group.supplier.contactPerson, group.supplier.phone]
                  .filter(Boolean)
                  .join(" · ") || undefined
              : "Defina o fornecedor padrão no cadastro do produto."
          }
          actions={
            group.supplier && <OrderButton store={store} group={group} />
          }
        >
          <Table
            caption={`Reposição: ${group.supplier?.name ?? "sem fornecedor"}`}
            columns={columns}
            rows={group.items}
            rowKey={(item) => item.productId}
            dense
          />
        </Card>
      ))}
    </div>
  );
}
