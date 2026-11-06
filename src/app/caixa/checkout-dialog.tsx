"use client";

import {
  Banknote,
  CreditCard,
  NotebookPen,
  QrCode,
  Trash2,
  WalletCards,
  type LucideIcon,
} from "lucide-react";
import { useRef, useState, type FormEvent, type RefObject } from "react";
import type { CustomerOption } from "@/contracts/customers";
import {
  PAYMENT_LABELS,
  type Payment,
  type PaymentMethod,
  type SaleReceipt,
} from "@/contracts/sales";
import { FormAlert } from "@/app/(auth)/form-alert";
import type { FormErrors } from "@/app/(auth)/auth-client";
import { apiFetch } from "@/app/painel/_lib/api";
import { centsToInput } from "@/app/painel/produtos/product-form";
import { Button, IconButton } from "@ds/components/button";
import { Dialog } from "@ds/components/dialog";
import { Money } from "@ds/components/money";
import { useToast } from "@ds/components/toast";
import { keypadCents } from "@ds/lib/keypad";
import { cartTotal, type CartLine } from "./cart";
import { nextStep, paidSoFar } from "./checkout-payments";
import { availableCredit, CustomerPicker } from "./customer-picker";
import { KeypadField } from "./keypad-field";
import { brl } from "./receipt-text";

const FORM_ID = "checkout-form";

const METHODS: {
  value: PaymentMethod;
  label: string;
  icon: LucideIcon;
  /** The amount field's label with this method chosen. */
  field: string;
}[] = [
  {
    value: "CASH",
    label: "Dinheiro",
    icon: Banknote,
    field: "Valor recebido em dinheiro",
  },
  { value: "PIX", label: "Pix", icon: QrCode, field: "Valor no Pix" },
  {
    value: "DEBIT",
    label: "Débito",
    icon: WalletCards,
    field: "Valor no débito",
  },
  {
    value: "CREDIT",
    label: "Crédito",
    icon: CreditCard,
    field: "Valor no crédito",
  },
  {
    value: "ON_ACCOUNT",
    label: "Fiado",
    icon: NotebookPen,
    field: "Valor no fiado",
  },
];

/**
 * Payment of the sale, split among methods if needed: each confirmed amount below what is left
 * becomes a line, and the one that covers it finishes the sale. Fiado asks for the customer.
 */
export function CheckoutDialog({
  cart,
  discount,
  saleId,
  onClose,
  onDone,
  onPricesChanged,
  onCashClosed,
  finalFocus,
}: {
  cart: CartLine[];
  /** In cents, off the sum of the lines. */
  discount: number;
  /** Kept by the sale screen until the sale is done, so a retry cannot record it twice. */
  saleId: string;
  onClose: () => void;
  onDone: (receipt: SaleReceipt) => void;
  /** The server refused the total: reload the prices so the operator sees the new one. */
  onPricesChanged: () => Promise<void>;
  /** The server found the cash closed: the screen goes back to the opening. */
  onCashClosed: () => void;
  finalFocus: RefObject<HTMLElement | null>;
}) {
  const { toast } = useToast();
  const amountField = useRef<HTMLInputElement>(null);
  const [method, setMethod] = useState<PaymentMethod>("CASH");
  const [digits, setDigits] = useState("");
  const [lines, setLines] = useState<Payment[]>([]);
  const [customer, setCustomer] = useState<CustomerOption | null>(null);
  const [errors, setErrors] = useState<FormErrors | null>(null);
  const [pending, setPending] = useState(false);
  // Once the sale is done the receipt opens and keeps the focus; this dialog must not pull it back.
  const done = useRef(false);

  const total = cartTotal(cart) - discount;
  const paid = paidSoFar(lines);
  const remaining = Math.max(0, total - paid);
  // An empty field stands for what is left to pay.
  const amount = digits ? keypadCents(digits) : remaining;
  const change = method === "CASH" ? paid + amount - total : 0;

  // Errors and every next step go back to the amount, where Enter confirms again.
  const focusAmount = () =>
    requestAnimationFrame(() => amountField.current?.focus());
  const fail = (error: string, field?: string) => {
    setErrors({
      error: field ? undefined : error,
      fields: field ? { [field]: error } : {},
    });
    focusAmount();
  };

  // The credit lock: a danger toast plus the alert in the dialog, and nothing is sent.
  function creditRefused(message: string) {
    toast({ title: "Limite de crédito excedido", message, tone: "danger" });
    fail(`Limite de crédito excedido: ${message}`);
  }

  function choose(next: PaymentMethod) {
    setMethod(next);
    setDigits("");
    setErrors(null);
    if (next !== "ON_ACCOUNT" || customer) focusAmount();
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (pending) return;
    if (total < 0)
      return fail(
        "O desconto passa do total da venda. Volte e ajuste o desconto.",
      );
    const fiado =
      (lines.find((line) => line.method === "ON_ACCOUNT")?.amount ?? 0) +
      (method === "ON_ACCOUNT" ? amount : 0);
    if (fiado > 0 && !customer) return fail("Escolha o cliente do fiado.");
    if (customer && fiado > availableCredit(customer))
      return creditRefused(
        `${customer.name} tem ${brl(availableCredit(customer))} disponíveis para o fiado de ${brl(fiado)}.`,
      );
    const step = nextStep(total, lines, method, amount);
    if (step.kind === "refuse") return fail(step.message, "amount");
    if (step.kind === "add") {
      setLines(step.lines);
      setDigits("");
      setErrors(null);
      return focusAmount();
    }
    setPending(true);
    setErrors(null);
    const onAccount = step.payments.some((p) => p.method === "ON_ACCOUNT");
    const result = await apiFetch<SaleReceipt>("/api/sales", {
      method: "POST",
      body: {
        id: saleId,
        items: cart.map((line) => ({
          productId: line.id,
          quantity: line.quantity,
        })),
        discount,
        total,
        payments: step.payments,
        ...(onAccount && customer && { customerId: customer.id }),
      },
    });
    if (result.ok) {
      done.current = true;
      return onDone(result.data);
    }
    if (result.errors.fields.cash) return onCashClosed();
    if (result.errors.fields.total) await onPricesChanged();
    // The limit is checked again on the server: the debt may have grown at another counter.
    if (result.errors.fields.customerId)
      toast({
        title: "Fiado recusado",
        message: result.errors.fields.customerId,
        tone: "danger",
      });
    setPending(false);
    setErrors(result.errors);
    focusAmount();
  }

  return (
    <Dialog
      open
      // A sale in flight cannot be taken back, so the dialog waits for its answer.
      onOpenChange={(open) => !open && !pending && onClose()}
      initialFocus={amountField}
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
            type="submit"
            form={FORM_ID}
            variant="brand"
            size="counter"
            loading={pending}
          >
            {paid + amount < total
              ? `Adicionar ${brl(amount)}`
              : "Finalizar venda"}
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
        <div className="flex min-w-0 flex-col gap-5">
          <div className="flex flex-col gap-1">
            <span className="text-body-lg text-sub">Total a pagar</span>
            <Money
              cents={Math.max(0, total)}
              size="counter"
              mutedCents={false}
            />
            {discount > 0 && (
              <span className="text-body-lg text-sub tabular-nums">
                Desconto de {brl(discount)} aplicado
              </span>
            )}
          </div>
          {lines.length > 0 && (
            <ul aria-label="Pagamentos" className="flex flex-col gap-2">
              {lines.map((line) => (
                <li
                  key={line.method}
                  className="flex items-center justify-between gap-3 text-body-lg"
                >
                  <span className="text-strong">
                    {PAYMENT_LABELS[line.method]}
                  </span>
                  <span className="flex items-center gap-2 tabular-nums">
                    {brl(line.amount)}
                    <IconButton
                      size="counter"
                      variant="ghost"
                      icon={Trash2}
                      label={`Remover ${PAYMENT_LABELS[line.method]}`}
                      disabled={pending}
                      onClick={() =>
                        setLines(lines.filter((l) => l.method !== line.method))
                      }
                    />
                  </span>
                </li>
              ))}
            </ul>
          )}
          <p
            aria-live="polite"
            className="flex items-baseline justify-between gap-3 text-body-lg text-sub"
          >
            {change > 0 ? "Troco" : "Falta pagar"}
            <Money
              cents={change > 0 ? change : remaining}
              size="lg"
              tone={change > 0 ? "margin" : undefined}
              mutedCents={false}
            />
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
          {method === "ON_ACCOUNT" && (
            <CustomerPicker
              selected={customer}
              onSelect={(next) => {
                // Before the swap: the picked button leaves the page, and a focus lost with it
                // would go to the dialog, where typed digits reach no field.
                if (next) amountField.current?.focus();
                setCustomer(next);
                setErrors(null);
              }}
            />
          )}
          <FormAlert message={errors?.error} />
        </div>
        <KeypadField
          label={
            METHODS.find((option) => option.value === method)?.field ?? "Valor"
          }
          value={digits}
          onChange={(value) => {
            setDigits(value);
            setErrors(null);
          }}
          format={(value) => centsToInput(keypadCents(value))}
          placeholder={centsToInput(remaining)}
          maxLength={9}
          prefix="R$"
          error={errors?.fields.amount}
          inputRef={amountField}
        />
      </form>
    </Dialog>
  );
}
