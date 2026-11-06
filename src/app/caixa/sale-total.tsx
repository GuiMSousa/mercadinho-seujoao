"use client";

import type { RefObject } from "react";
import { Button } from "@ds/components/button";
import { Dialog } from "@ds/components/dialog";
import { Money } from "@ds/components/money";

const SHORTCUTS = [
  ["F1", "Buscar produto"],
  ["F2", "Finalizar venda"],
  ["Esc", "Limpar a busca ou fechar a janela"],
  ["Enter", "Confirmar o item ou a opção"],
  ["F8", "Sangria"],
  ["F9", "Suprimento"],
  ["F4", "Fechar o caixa"],
] as const;

/** Total and the sale's actions; a bar at the bottom on phones, a column beside the items on wide screens. */
export function SaleTotal({
  total,
  hasItems,
  onFinish,
  onCancel,
}: {
  total: number;
  hasItems: boolean;
  onFinish: () => void;
  onCancel: () => void;
}) {
  return (
    <aside
      aria-label="Total da venda"
      className="sticky bottom-0 flex flex-col gap-4 rounded-card border border-border-soft bg-surface-card p-5 shadow-(--shadow-sm) lg:top-0 lg:bottom-auto lg:self-start"
    >
      <p className="flex items-baseline justify-between gap-3 lg:flex-col lg:items-start">
        <span className="text-body-lg text-sub">Total</span>
        <Money cents={total} size="counter" mutedCents={false} />
      </p>
      <Button
        variant="brand"
        size="counter"
        fullWidth
        aria-keyshortcuts="F2"
        onClick={onFinish}
      >
        Finalizar venda
        <kbd className="rounded-xs border border-current px-1.5 text-body-lg font-normal">
          F2
        </kbd>
      </Button>
      {hasItems && (
        <Button variant="ghost" size="counter" onClick={onCancel}>
          Cancelar venda
        </Button>
      )}
      <dl className="hidden grid-cols-[auto_1fr] items-center gap-x-3 gap-y-2 border-t border-border-soft pt-4 text-body-lg text-sub lg:grid">
        {SHORTCUTS.map(([key, action]) => (
          <div key={key} className="contents">
            <dt>
              <kbd className="rounded-xs border border-border bg-surface-sunken px-1.5 text-strong">
                {key}
              </kbd>
            </dt>
            <dd>{action}</dd>
          </div>
        ))}
      </dl>
    </aside>
  );
}

/** Asks before dropping every item, so a stray tap does not cost the operator the whole sale. */
export function CancelSaleDialog({
  onConfirm,
  onClose,
  finalFocus,
}: {
  onConfirm: () => void;
  onClose: () => void;
  finalFocus: RefObject<HTMLElement | null>;
}) {
  return (
    <Dialog
      open
      onOpenChange={(open) => !open && onClose()}
      finalFocus={finalFocus}
      title="Cancelar a venda?"
      footer={
        <>
          <Button variant="secondary" size="counter" onClick={onClose}>
            Voltar
          </Button>
          <Button variant="danger" size="counter" onClick={onConfirm}>
            Cancelar venda
          </Button>
        </>
      }
    >
      <p className="text-body-lg text-sub">
        Os itens saem da venda e nada é registrado.
      </p>
    </Dialog>
  );
}
