"use client";

import { LockKeyhole } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { apiFetch } from "@/app/painel/_lib/api";
import { centsToInput } from "@/app/painel/produtos/product-form";
import { Button } from "@ds/components/button";
import { useToast } from "@ds/components/toast";
import { keypadCents } from "@ds/lib/keypad";
import { formatBrl } from "@ds/lib/money";
import { KeypadField } from "./keypad-field";

/** Shown instead of the sale while the cash is closed: nothing is sold until the drawer opens. */
export function OpenCashPanel() {
  const router = useRouter();
  const { toast } = useToast();
  const field = useRef<HTMLInputElement>(null);
  const [digits, setDigits] = useState("");
  const [error, setError] = useState<string>();
  const [pending, setPending] = useState(false);

  useEffect(() => {
    // Ready to type on a counter PC; on a phone the keypad is the input.
    if (window.matchMedia("(pointer: fine)").matches) field.current?.focus();
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (pending) return;
    const initialAmount = keypadCents(digits);
    setPending(true);
    setError(undefined);
    const result = await apiFetch("/api/cash/open", {
      method: "POST",
      body: { initialAmount },
    });
    setPending(false);
    if (!result.ok && result.status !== 409)
      return setError(
        result.errors.fields.initialAmount ?? result.errors.error,
      );
    toast(
      result.ok
        ? {
            title: "Caixa aberto",
            message: `Troco inicial ${formatBrl(initialAmount)}.`,
            tone: "success",
          }
        : {
            title: "Caixa já aberto",
            message: result.errors.error,
            tone: "info",
          },
    );
    router.refresh();
  }

  return (
    <section
      aria-labelledby="open-cash-title"
      className="mx-auto flex w-full max-w-md flex-col gap-5 rounded-card border border-border-soft bg-surface-card p-6 shadow-(--shadow-sm)"
    >
      <div className="flex flex-col items-center gap-2 text-center">
        <LockKeyhole aria-hidden="true" className="size-6 text-sub" />
        <h2
          id="open-cash-title"
          className="text-h2 font-medium tracking-tight text-strong"
        >
          Caixa fechado
        </h2>
        <p className="text-body-lg text-sub">
          Conte o troco da gaveta e abra o caixa para começar a vender.
        </p>
      </div>
      <form
        noValidate
        onSubmit={(event) => void submit(event)}
        className="flex flex-col gap-4"
      >
        <KeypadField
          label="Troco inicial"
          value={digits}
          onChange={(value) => {
            setDigits(value);
            setError(undefined);
          }}
          format={(value) => centsToInput(keypadCents(value))}
          maxLength={9}
          prefix="R$"
          error={error}
          inputRef={field}
        />
        <Button
          type="submit"
          variant="brand"
          size="counter"
          fullWidth
          loading={pending}
        >
          Abrir caixa
        </Button>
      </form>
    </section>
  );
}
