"use client";

import {
  Banknote,
  CreditCard,
  QrCode,
  WalletCards,
  type LucideIcon,
} from "lucide-react";
import { useRef, useState, type FormEvent, type RefObject } from "react";
import type { PaymentMethod, SaleReceipt } from "@/contracts/sales";
import { FormAlert } from "@/app/(auth)/form-alert";
import type { FormErrors } from "@/app/(auth)/auth-client";
import { apiFetch } from "@/app/painel/_lib/api";
import { centsToInput } from "@/app/painel/produtos/product-form";
import { Button } from "@ds/components/button";
import { Dialog } from "@ds/components/dialog";
import { Money } from "@ds/components/money";
import { keypadCents } from "@ds/lib/keypad";
import { cartTotal, type CartLine } from "./cart";
import { KeypadField } from "./keypad-field";
import { brl } from "./receipt-text";

const FORM_ID = "checkout-form";

const METHODS: { value: PaymentMethod; label: string; icon: LucideIcon }[] = [
  { value: "CASH", label: "Dinheiro", icon: Banknote },
  { value: "PIX", label: "Pix", icon: QrCode },
  { value: "DEBIT", label: "Débito", icon: WalletCards },
  { value: "CREDIT", label: "Crédito", icon: CreditCard },
];

/** Payment of the sale: method, cash received with the change, and the request that records it. */
export function CheckoutDialog({
  cart,
  saleId,
  onClose,
  onDone,
  onPricesChanged,
  finalFocus,
}: {
  cart: CartLine[];
  /** Kept by the sale screen until the sale is done, so a retry cannot record it twice. */
  saleId: string;
  onClose: () => void;
  onDone: (receipt: SaleReceipt) => void;
  /** The server refused the total: reload the prices so the operator sees the new one. */
  onPricesChanged: () => Promise<void>;
  finalFocus: RefObject<HTMLElement | null>;
}) {
  const receivedField = useRef<HTMLInputElement>(null);
  const finishButton = useRef<HTMLButtonElement>(null);
  const [method, setMethod] = useState<PaymentMethod>("CASH");
  const [received, setReceived] = useState("");
  const [errors, setErrors] = useState<FormErrors | null>(null);
  const [pending, setPending] = useState(false);
  // Once the sale is done the receipt opens and keeps the focus; this dialog must not pull it back.
  const done = useRef(false);

  const total = cartTotal(cart);
  const cash = method === "CASH";
  const amountReceived = keypadCents(received);

  // Where the next Enter finishes the sale: cash asks for the amount first, the others are ready.
  // Errors go there too; the alert is announced by its role, and Enter tries again.
  const focusNext = (next: PaymentMethod) =>
    requestAnimationFrame(() =>
      (next === "CASH" ? receivedField : finishButton).current?.focus(),
    );

  function choose(next: PaymentMethod) {
    setMethod(next);
    setErrors(null);
    focusNext(next);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (pending) return;
    if (cash && amountReceived < total) {
      setErrors({
        fields: { amountReceived: "O valor recebido é menor que o total." },
      });
      return focusNext(method);
    }
    setPending(true);
    setErrors(null);
    const result = await apiFetch<SaleReceipt>("/api/sales", {
      method: "POST",
      body: {
        id: saleId,
        items: cart.map((line) => ({
          productId: line.id,
          quantity: line.quantity,
        })),
        paymentMethod: method,
        total,
        ...(cash && { amountReceived }),
      },
    });
    if (result.ok) {
      done.current = true;
      return onDone(result.data);
    }
    if (result.errors.fields.total) await onPricesChanged();
    setPending(false);
    setErrors(result.errors);
    focusNext(method);
  }

  return (
    <Dialog
      open
      // A sale in flight cannot be taken back, so the dialog waits for its answer.
      onOpenChange={(open) => !open && !pending && onClose()}
      initialFocus={receivedField}
      finalFocus={() => (done.current ? false : finalFocus.current)}
      className="md:max-w-180"
      title="Pagamento"
      description={`${cart.length} ${cart.length === 1 ? "item" : "itens"} na venda`}
      footer={
        <>
          <Button
            variant="secondary"
            size="counter"
            onClick={onClose}
            disabled={pending}
          >
            Voltar
          </Button>
          <Button
            ref={finishButton}
            type="submit"
            form={FORM_ID}
            variant="brand"
            size="counter"
            loading={pending}
          >
            Finalizar venda
          </Button>
        </>
      }
    >
      <form
        id={FORM_ID}
        noValidate
        onSubmit={(event) => void submit(event)}
        className="grid gap-6 md:grid-cols-2"
      >
        <div className="flex flex-col gap-5">
          <p className="flex flex-col gap-1">
            <span className="text-body-lg text-sub">Total a pagar</span>
            <Money cents={total} size="counter" mutedCents={false} />
          </p>
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-body-lg font-medium text-strong">
              Forma de pagamento
            </legend>
            <div className="grid grid-cols-2 gap-2">
              {METHODS.map(({ value, label, icon: Icon }) => (
                <Button
                  key={value}
                  variant={method === value ? "primary" : "secondary"}
                  size="counter"
                  aria-pressed={method === value}
                  disabled={pending}
                  onClick={() => choose(value)}
                >
                  <Icon aria-hidden="true" />
                  {label}
                </Button>
              ))}
            </div>
          </fieldset>
          {cash && (
            <p
              aria-live="polite"
              className="flex items-baseline justify-between gap-3 text-body-lg text-sub"
            >
              Troco
              {amountReceived >= total ? (
                <Money
                  cents={amountReceived - total}
                  size="lg"
                  tone="margin"
                  mutedCents={false}
                />
              ) : (
                <span className="text-strong">
                  Faltam {brl(total - amountReceived)}
                </span>
              )}
            </p>
          )}
          <FormAlert message={errors?.error} />
        </div>
        {cash ? (
          <KeypadField
            label="Valor recebido"
            value={received}
            onChange={(value) => {
              setReceived(value);
              setErrors(null);
            }}
            format={(value) => centsToInput(keypadCents(value))}
            maxLength={9}
            prefix="R$"
            error={errors?.fields.amountReceived}
            inputRef={receivedField}
          />
        ) : (
          <p className="self-center text-body-lg text-sub">
            Receba {brl(total)} na maquininha ou no Pix e confirme com
            &ldquo;Finalizar venda&rdquo;.
          </p>
        )}
      </form>
    </Dialog>
  );
}
