"use client";

import { useRef, useState, type FormEvent, type RefObject } from "react";
import type { ProductLookup } from "@/contracts/inventory";
import { lineTotal } from "@/contracts/sales";
import {
  formatQuantity,
  quantityToInput,
  unitSuffix,
} from "@/app/painel/produtos/product-form";
import { Button } from "@ds/components/button";
import { Dialog } from "@ds/components/dialog";
import { Money } from "@ds/components/money";
import { KeypadField } from "./keypad-field";

const FORM_ID = "quantity-form";
const LABELS = { UN: "Quantidade", KG: "Peso", L: "Volume" } as const;
const MISSING = {
  UN: "Informe a quantidade.",
  KG: "Informe o peso.",
  L: "Informe o volume.",
} as const;

/** Quantity of a product on the keypad: units for UN, grams and milliliters typed as 0,000 kg or L. */
export function QuantityDialog({
  product,
  initial,
  max,
  onConfirm,
  onClose,
  finalFocus,
}: {
  product: Pick<ProductLookup, "name" | "unit" | "sellPrice">;
  initial: number;
  /** Most the sale can take; above it the dialog says how much is left. */
  max: number;
  onConfirm: (quantity: number) => void;
  onClose: () => void;
  finalFocus: RefObject<HTMLElement | null>;
}) {
  const field = useRef<HTMLInputElement>(null);
  const [digits, setDigits] = useState(initial > 0 ? String(initial) : "");
  const [error, setError] = useState<string>();
  const quantity = digits === "" ? 0 : Number(digits);
  const { unit } = product;

  function submit(event: FormEvent) {
    event.preventDefault();
    if (quantity <= 0) return setError(MISSING[unit]);
    if (quantity > max)
      return setError(`Restam ${formatQuantity(max, unit)} em estoque.`);
    onConfirm(quantity);
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => !open && onClose()}
      initialFocus={field}
      finalFocus={finalFocus}
      title={LABELS[unit]}
      description={product.name}
      footer={
        <>
          <Button variant="secondary" size="counter" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form={FORM_ID} variant="brand" size="counter">
            Confirmar
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
        <KeypadField
          label={
            unit === "UN"
              ? "Quantidade"
              : `${LABELS[unit]} em ${unitSuffix(unit)}`
          }
          value={digits}
          onChange={(value) => {
            setDigits(value);
            setError(undefined);
          }}
          format={(value) =>
            unit === "UN"
              ? value || "0"
              : quantityToInput(Number(value || 0), unit)
          }
          // Up to 999.999 units or 999,999 kg/L: within what one sale line accepts.
          maxLength={6}
          suffix={unitSuffix(unit)}
          error={error}
          inputRef={field}
        />
        <p className="flex items-baseline justify-between gap-3 text-body-lg text-sub">
          Valor do item
          <Money
            cents={lineTotal(product.sellPrice, quantity, unit)}
            size="md"
          />
        </p>
      </form>
    </Dialog>
  );
}
