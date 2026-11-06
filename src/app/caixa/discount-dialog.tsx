"use client";

import { useRef, useState, type FormEvent, type RefObject } from "react";
import { centsToInput } from "@/app/painel/produtos/product-form";
import { Button } from "@ds/components/button";
import { Dialog } from "@ds/components/dialog";
import { Money } from "@ds/components/money";
import { keypadCents } from "@ds/lib/keypad";
import { discountTooHigh } from "@/contracts/sales";
import { discountCents, type Discount } from "./checkout-payments";
import { KeypadField } from "./keypad-field";
import { brl } from "./receipt-text";

const FORM_ID = "discount-form";
const KINDS: { kind: Discount["kind"]; label: string }[] = [
  { kind: "amount", label: "Em reais" },
  { kind: "percent", label: "Em %" },
];

/**
 * A discount on the sale or on one line, in reais or in percent of `subtotal`: never above it, nor
 * above `limit`, what the profile may still give (`cap`, an operator's 5%, is in the message).
 */
export function DiscountDialog({
  title,
  description,
  subtotal,
  limit,
  cap,
  current,
  onApply,
  onClose,
  finalFocus,
}: {
  title: string;
  description: string;
  subtotal: number;
  limit: number;
  cap: number;
  current: Discount | null;
  /** Null removes the discount. */
  onApply: (discount: Discount | null) => void;
  onClose: () => void;
  finalFocus: RefObject<HTMLElement | null>;
}) {
  const field = useRef<HTMLInputElement>(null);
  const [kind, setKind] = useState<Discount["kind"]>(current?.kind ?? "amount");
  const [digits, setDigits] = useState(current ? String(current.value) : "");
  const [error, setError] = useState<string>();
  const value = keypadCents(digits);
  const cents = discountCents(subtotal, { kind, value });

  function submit(event: FormEvent) {
    event.preventDefault();
    if (kind === "percent" && value > 10000) return setError("Use até 100%.");
    if (cents > subtotal)
      return setError(`O desconto não pode passar de ${brl(subtotal)}.`);
    if (cents > limit) return setError(discountTooHigh(cap));
    onApply(value === 0 ? null : { kind, value });
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => !open && onClose()}
      initialFocus={field}
      finalFocus={finalFocus}
      title={title}
      description={description}
      footer={
        <>
          {current && (
            <Button
              variant="ghost"
              size="counter"
              onClick={() => onApply(null)}
            >
              Remover desconto
            </Button>
          )}
          <Button variant="secondary" size="counter" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form={FORM_ID} variant="brand" size="counter">
            Aplicar desconto
          </Button>
        </>
      }
    >
      <form
        id={FORM_ID}
        noValidate
        onSubmit={submit}
        className="flex flex-col gap-4"
      >
        <div className="grid grid-cols-2 gap-2">
          {KINDS.map((option) => (
            <Button
              key={option.kind}
              variant={kind === option.kind ? "primary" : "secondary"}
              size="counter"
              aria-pressed={kind === option.kind}
              onClick={() => {
                setKind(option.kind);
                setDigits("");
                setError(undefined);
                field.current?.focus();
              }}
            >
              {option.label}
            </Button>
          ))}
        </div>
        <KeypadField
          label={kind === "amount" ? "Desconto em reais" : "Desconto em %"}
          value={digits}
          onChange={(next) => {
            setDigits(next);
            setError(undefined);
          }}
          format={(next) => centsToInput(keypadCents(next))}
          maxLength={kind === "amount" ? 9 : 5}
          prefix={kind === "amount" ? "R$" : undefined}
          suffix={kind === "percent" ? "%" : undefined}
          error={error}
          inputRef={field}
        />
        <p
          aria-live="polite"
          className="flex items-baseline justify-between gap-3 text-body-lg text-sub"
        >
          Total com desconto
          <Money cents={Math.max(0, subtotal - cents)} size="lg" />
        </p>
      </form>
    </Dialog>
  );
}
