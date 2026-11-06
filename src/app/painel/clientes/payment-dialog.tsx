"use client";

import { MessageCircle, Printer } from "lucide-react";
import { useRef, useState, type FormEvent } from "react";
import type { CustomerPaymentResult, CustomerRow } from "@/contracts/customers";
import { FormAlert } from "@/app/(auth)/form-alert";
import { useFocusOnError, type FormErrors } from "@/app/(auth)/auth-client";
import { brl, type ReceiptStore } from "@/app/caixa/receipt-text";
import { Button, buttonVariants } from "@ds/components/button";
import { Dialog } from "@ds/components/dialog";
import { Input } from "@ds/components/input";
import { cn } from "@ds/lib/cn";
import { apiFetch } from "../_lib/api";
import { newId } from "../_lib/new-id";
import { centsToInput, parseCents } from "../produtos/product-form";
import { paymentReceiptLink } from "./payment-receipt";

const FORM_ID = "customer-payment-form";

/**
 * Quitação: the customer pays all or part of the debt. Once recorded, the dialog offers the proof
 * to print or send by WhatsApp (the printable copy is rendered by the page, outside the dialog).
 */
export function PaymentDialog({
  customer,
  store,
  paid,
  onPaid,
  onClose,
}: {
  customer: CustomerRow;
  store: ReceiptStore;
  /** The recorded payment, once there is one. */
  paid: CustomerPaymentResult | null;
  onPaid: (result: CustomerPaymentResult) => void;
  onClose: () => void;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const firstField = useRef<HTMLInputElement>(null);
  // One id per payment, kept across retries: a lost answer cannot record it twice.
  const [id] = useState(newId);
  const [amount, setAmount] = useState(centsToInput(customer.currentDebt));
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<FormErrors | null>(null);
  const [pending, setPending] = useState(false);
  useFocusOnError(formRef, errors);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const cents = parseCents(amount);
    if (!cents)
      return setErrors({
        fields: { amount: "Informe o valor pago. Ex.: 50,00" },
      });
    if (cents > customer.currentDebt)
      return setErrors({
        fields: {
          amount: `O valor passa do saldo devedor de ${brl(customer.currentDebt)}.`,
        },
      });
    setPending(true);
    setErrors(null);
    const result = await apiFetch<CustomerPaymentResult>(
      `/api/admin/customers/${customer.id}/payments`,
      { method: "POST", body: { id, amount: cents, notes: notes.trim() } },
    );
    setPending(false);
    if (!result.ok) return setErrors(result.errors);
    onPaid(result.data);
  }

  if (paid)
    return (
      <Dialog
        // A new dialog, not the form's: the focus starts inside it and its title is announced.
        key="paid"
        open
        onOpenChange={(open) => !open && onClose()}
        title="Pagamento registrado"
        description={`${paid.customer.name} pagou ${brl(paid.transaction.amount)}.`}
        footer={
          <>
            <Button variant="secondary" onClick={() => window.print()}>
              <Printer aria-hidden="true" />
              Imprimir<span className="sr-only"> comprovante</span>
            </Button>
            {/* A real link: it leaves for WhatsApp in a new tab. */}
            <a
              href={paymentReceiptLink(store, paid.customer, paid.transaction)}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(buttonVariants({ variant: "secondary" }))}
            >
              <MessageCircle aria-hidden="true" />
              <span className="sr-only">Enviar por </span>WhatsApp
              <span className="sr-only"> (abre em outra aba)</span>
            </a>
            <Button onClick={onClose}>Concluir</Button>
          </>
        }
      >
        <p className="text-body-lg text-body">
          Saldo devedor agora: {brl(paid.customer.currentDebt)}.
        </p>
      </Dialog>
    );

  return (
    <Dialog
      open
      // A save in flight cannot be taken back, so the dialog waits for its answer.
      onOpenChange={(open) => !open && !pending && onClose()}
      initialFocus={firstField}
      title="Registrar pagamento"
      description={`${customer.name} deve ${brl(customer.currentDebt)}.`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={pending}>
            Cancelar
          </Button>
          <Button type="submit" form={FORM_ID} loading={pending}>
            Registrar pagamento
          </Button>
        </>
      }
    >
      <form
        id={FORM_ID}
        ref={formRef}
        noValidate
        onSubmit={(event) => void submit(event)}
        className="flex flex-col gap-4"
      >
        <Input
          ref={firstField}
          required
          label="Valor pago"
          name="amount"
          prefix="R$"
          numeric
          inputMode="decimal"
          autoComplete="off"
          hint="O saldo inteiro quita a conta; menos que isso é um pagamento parcial."
          maxLength={13}
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          error={errors?.fields.amount}
        />
        <Input
          label="Observação (opcional)"
          name="notes"
          autoComplete="off"
          placeholder="Ex.: Pix, dinheiro"
          maxLength={200}
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          error={errors?.fields.notes}
        />
        <p className="text-body-md text-sub">
          Este recebimento não entra no caixa do PDV. Se o dinheiro for para a
          gaveta, registre um suprimento.
        </p>
        <FormAlert message={errors?.error} />
      </form>
    </Dialog>
  );
}
