"use client";

import { useState } from "react";
import { Badge } from "@ds/components/badge";
import { Button } from "@ds/components/button";
import { Keypad } from "@ds/components/keypad";
import { Money } from "@ds/components/money";
import { keypadCents } from "@ds/lib/keypad";

const TOTAL_CENTS = 3740;
const QUICK_CENTS = [4000, 5000, 10000];

/** Hands-on change calculator; a demo, so nothing is saved. */
export function ChangeDemo() {
  const [typed, setTyped] = useState("");
  const received = keypadCents(typed);
  const difference = received - TOTAL_CENTS;

  return (
    <div className="flex w-full max-w-md flex-col gap-4 justify-self-center rounded-2xl border border-border-soft bg-app p-5 shadow-(--shadow-xl)">
      <div className="flex items-center justify-between gap-3">
        <span className="font-medium text-strong">Pagamento em dinheiro</span>
        <Badge tone="info" size="sm">
          PDV
        </Badge>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex min-w-0 flex-col gap-1.5 rounded-lg border border-border-soft bg-surface-card p-3.5">
          <span className="text-body-sm text-sub">Total da venda</span>
          <Money cents={TOTAL_CENTS} size="lg" />
        </div>
        <div className="flex min-w-0 flex-col gap-1.5 rounded-lg border border-selected-border bg-surface-card p-3.5">
          <span className="text-body-sm text-sub">Valor recebido</span>
          <Money cents={received} size="lg" />
        </div>
      </div>
      <div
        aria-live="polite"
        className="flex min-h-24 flex-col justify-center gap-1 rounded-lg border border-border-soft bg-surface-card p-4"
      >
        {typed === "" ? (
          <span className="text-sub">Digite o valor recebido no teclado.</span>
        ) : difference >= 0 ? (
          <>
            <span className="text-body-md text-sub">Troco</span>
            <Money cents={difference} size="display" tone="margin" />
          </>
        ) : (
          <>
            <span className="text-body-md text-danger-fg">Falta receber</span>
            <Money cents={-difference} size="display" tone="out" />
          </>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {QUICK_CENTS.map((cents) => (
          <Button
            key={cents}
            variant="secondary"
            size="sm"
            onClick={() => setTyped(String(cents))}
          >
            <Money cents={cents} size="sm" />
          </Button>
        ))}
        <Button variant="ghost" size="sm" onClick={() => setTyped("")}>
          Limpar
        </Button>
      </div>
      <Keypad value={typed} onChange={setTyped} label="Valor recebido" />
    </div>
  );
}
