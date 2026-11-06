"use client";

import { UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import type { CustomerOption } from "@/contracts/customers";
import { apiFetch } from "@/app/painel/_lib/api";
import { Button } from "@ds/components/button";
import { Input } from "@ds/components/input";
import { brl } from "./receipt-text";

const DELAY_MS = 250;

/** What the customer can still buy on account; never below zero. */
export const availableCredit = (customer: CustomerOption) =>
  Math.max(0, customer.creditLimit - customer.currentDebt);

/** Active customers whose name or phone contains the term; the first ones by name when empty. */
function useCustomerSearch(term: string) {
  const [found, setFound] = useState<{
    term: string;
    customers: CustomerOption[] | null;
  } | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      void apiFetch<{ customers: CustomerOption[] }>(
        `/api/customers?search=${encodeURIComponent(term)}`,
        { signal: controller.signal },
      ).then((result) => {
        if (controller.signal.aborted) return;
        setFound({ term, customers: result.ok ? result.data.customers : null });
      });
    }, DELAY_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [term]);

  return found?.term === term ? found.customers : undefined;
}

function CustomerLine({ customer }: { customer: CustomerOption }) {
  return (
    <span className="flex min-w-0 flex-col items-start text-left">
      <span className="text-body-lg font-medium wrap-anywhere text-strong">
        {customer.name}
      </span>
      <span className="text-body-lg text-sub tabular-nums">
        Disponível {brl(availableCredit(customer))}
      </span>
    </span>
  );
}

/** The fiado customer: chosen from a search, then shown with what is left of the credit. */
export function CustomerPicker({
  selected,
  onSelect,
  error,
}: {
  selected: CustomerOption | null;
  onSelect: (customer: CustomerOption | null) => void;
  error?: string;
}) {
  const [query, setQuery] = useState("");
  const term = query.trim();
  const customers = useCustomerSearch(term);

  if (selected)
    return (
      <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface-card p-3">
        <CustomerLine customer={selected} />
        <Button
          variant="secondary"
          size="counter"
          onClick={() => onSelect(null)}
        >
          Trocar
        </Button>
      </div>
    );
  return (
    <div className="flex flex-col gap-2">
      <Input
        size="counter"
        label="Cliente do fiado"
        placeholder="Nome ou telefone"
        autoComplete="off"
        maxLength={120}
        prefix={<UserRound aria-hidden="true" className="size-6" />}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        // Enter picks the first match instead of submitting the payment without a customer.
        onKeyDown={(event) => {
          if (event.key !== "Enter") return;
          event.preventDefault();
          if (customers?.[0]) onSelect(customers[0]);
        }}
        error={error}
      />
      <p role="status" className="text-body-lg text-sub">
        {customers === undefined
          ? "Buscando…"
          : customers === null
            ? "Não foi possível buscar. Tente de novo."
            : customers.length === 0
              ? "Nenhum cliente ativo encontrado. O cadastro fica no painel."
              : ""}
      </p>
      {customers && customers.length > 0 && (
        <ul className="flex flex-col gap-2">
          {customers.map((customer) => (
            <li key={customer.id}>
              <button
                type="button"
                onClick={() => onSelect(customer)}
                className="flex min-h-control-counter w-full cursor-pointer touch-manipulation items-center rounded-lg border border-border bg-surface-card p-3 shadow-(--shadow-xs) transition-colors duration-(--dur-fast) hover:bg-surface-hover active:bg-control-pressed"
              >
                <CustomerLine customer={customer} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
