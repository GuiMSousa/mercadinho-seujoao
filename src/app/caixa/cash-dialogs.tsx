"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent, type RefObject } from "react";
import type { OpenCashSession } from "@/contracts/cash";
import type { FormErrors } from "@/app/(auth)/auth-client";
import { FormAlert } from "@/app/(auth)/form-alert";
import { apiFetch } from "@/app/painel/_lib/api";
import { formatDateTime } from "@/app/painel/_lib/format";
import { newId } from "@/app/painel/_lib/new-id";
import { centsToInput } from "@/app/painel/produtos/product-form";
import { Button } from "@ds/components/button";
import { Dialog } from "@ds/components/dialog";
import { Input } from "@ds/components/input";
import { useToast } from "@ds/components/toast";
import { keypadCents } from "@ds/lib/keypad";
import { formatBrl } from "@ds/lib/money";
import { KeypadField } from "./keypad-field";

export type CashDialogKind = "menu" | "BLEED" | "SUPPLY" | "close";

/** Shortcuts of the cash operations, shown on their buttons and listed beside the total. */
export const CASH_SHORTCUTS = {
  BLEED: "F8",
  SUPPLY: "F9",
  close: "F4",
} as const;

const MOVEMENT = {
  BLEED: {
    title: "Sangria",
    description: "Dinheiro retirado da gaveta.",
    submit: "Registrar sangria",
    done: "Sangria registrada",
    placeholder: "Ex.: depósito no banco",
  },
  SUPPLY: {
    title: "Suprimento",
    description: "Dinheiro colocado na gaveta.",
    submit: "Registrar suprimento",
    done: "Suprimento registrado",
    placeholder: "Ex.: reforço de troco",
  },
} as const;

const FORM_ID = "cash-form";
const money = (digits: string) => centsToInput(keypadCents(digits));

type Shared = {
  cash: OpenCashSession;
  onClose: () => void;
  finalFocus: RefObject<HTMLElement | null>;
};

function CashMenu({
  cash,
  onClose,
  onPick,
  finalFocus,
}: Shared & { onPick: (kind: Exclude<CashDialogKind, "menu">) => void }) {
  const item = (kind: Exclude<CashDialogKind, "menu">, label: string) => (
    <Button
      variant="secondary"
      size="counter"
      fullWidth
      aria-keyshortcuts={CASH_SHORTCUTS[kind]}
      onClick={() => onPick(kind)}
    >
      {label}
      <kbd className="rounded-xs border border-border bg-surface-sunken px-1.5 text-body-lg font-normal">
        {CASH_SHORTCUTS[kind]}
      </kbd>
    </Button>
  );
  return (
    <Dialog
      open
      onOpenChange={(open) => !open && onClose()}
      finalFocus={finalFocus}
      title="Caixa"
      description={`Aberto em ${formatDateTime(cash.openedAt)} por ${cash.openedBy} · troco inicial ${formatBrl(cash.initialAmount)}`}
    >
      <div className="flex flex-col gap-2">
        {item("BLEED", "Sangria")}
        {item("SUPPLY", "Suprimento")}
        {item("close", "Fechar caixa")}
      </div>
    </Dialog>
  );
}

/**
 * Sangria or suprimento with its required reason. One id per opening, so pressing again after a
 * lost answer records the money once.
 */
function MovementDialog({
  type,
  onClose,
  finalFocus,
}: Shared & { type: "BLEED" | "SUPPLY" }) {
  const router = useRouter();
  const { toast } = useToast();
  const field = useRef<HTMLInputElement>(null);
  const [id] = useState(newId);
  const [digits, setDigits] = useState("");
  const [reason, setReason] = useState("");
  const [errors, setErrors] = useState<FormErrors | null>(null);
  const [pending, setPending] = useState(false);
  const text = MOVEMENT[type];

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (pending) return;
    const amount = keypadCents(digits);
    const fields: Record<string, string> = {};
    if (amount <= 0) fields.amount = "Informe um valor maior que zero.";
    if (!reason.trim()) fields.reason = "Informe o motivo.";
    if (Object.keys(fields).length) return setErrors({ fields });
    setPending(true);
    setErrors(null);
    const result = await apiFetch("/api/cash/movements", {
      method: "POST",
      body: { id, type, amount, reason },
    });
    setPending(false);
    if (result.ok) {
      toast({ title: text.done, message: formatBrl(amount), tone: "success" });
      return onClose();
    }
    if (result.errors.fields.cash) {
      // Closed from another counter: the screen goes back to the opening.
      toast({
        title: "Caixa fechado",
        message: result.errors.error,
        tone: "danger",
      });
      onClose();
      return router.refresh();
    }
    setErrors(result.errors);
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => !open && !pending && onClose()}
      initialFocus={field}
      finalFocus={finalFocus}
      title={text.title}
      description={text.description}
      footer={
        <>
          <Button
            variant="secondary"
            size="counter"
            onClick={onClose}
            disabled={pending}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            form={FORM_ID}
            variant="brand"
            size="counter"
            loading={pending}
          >
            {text.submit}
          </Button>
        </>
      }
    >
      <form
        id={FORM_ID}
        noValidate
        onSubmit={(event) => void submit(event)}
        className="flex flex-col gap-4"
      >
        <KeypadField
          label="Valor"
          value={digits}
          onChange={(value) => {
            setDigits(value);
            setErrors(null);
          }}
          format={money}
          maxLength={9}
          prefix="R$"
          error={errors?.fields.amount}
          inputRef={field}
        />
        <Input
          size="counter"
          label="Motivo"
          name="reason"
          required
          autoComplete="off"
          maxLength={200}
          placeholder={text.placeholder}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          error={errors?.fields.reason}
        />
        <FormAlert message={errors?.error} />
      </form>
    </Dialog>
  );
}

/**
 * Blind closing: the operator types what is in the drawer and never sees the expected amount;
 * the ADMIN reconciles it in the panel.
 */
function CloseDialog({ cash, onClose, finalFocus }: Shared) {
  const router = useRouter();
  const { toast } = useToast();
  const field = useRef<HTMLInputElement>(null);
  const [digits, setDigits] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<FormErrors | null>(null);
  const [pending, setPending] = useState(false);
  const counted = keypadCents(digits);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setErrors(null);
    const result = await apiFetch("/api/cash/close", {
      method: "POST",
      body: { sessionId: cash.id, actualAmount: counted, notes },
    });
    setPending(false);
    if (!result.ok && result.status !== 409) return setErrors(result.errors);
    toast(
      result.ok
        ? {
            title: "Caixa fechado",
            message: `Contagem registrada: ${formatBrl(counted)}.`,
            tone: "success",
          }
        : {
            title: "Caixa já fechado",
            message: result.errors.error,
            tone: "info",
          },
    );
    onClose();
    router.refresh();
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => !open && !pending && onClose()}
      initialFocus={field}
      finalFocus={finalFocus}
      title="Fechamento de caixa"
      description="Conte todo o dinheiro da gaveta e informe o total. O valor esperado não aparece aqui; o administrador confere a diferença no painel."
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
            variant="danger"
            size="counter"
            loading={pending}
          >
            Fechar com {formatBrl(counted)}
          </Button>
        </>
      }
    >
      <form
        id={FORM_ID}
        noValidate
        onSubmit={(event) => void submit(event)}
        className="flex flex-col gap-4"
      >
        <KeypadField
          label="Dinheiro contado na gaveta"
          value={digits}
          onChange={(value) => {
            setDigits(value);
            setErrors(null);
          }}
          format={money}
          maxLength={9}
          prefix="R$"
          error={errors?.fields.actualAmount}
          inputRef={field}
        />
        <Input
          size="lg"
          label="Observações (opcional)"
          name="notes"
          autoComplete="off"
          maxLength={500}
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          error={errors?.fields.notes}
        />
        <FormAlert message={errors?.error} />
      </form>
    </Dialog>
  );
}

/** The cash operations of the counter, one dialog at a time. */
export function CashDialogs({
  kind,
  onPick,
  ...shared
}: Shared & {
  kind: CashDialogKind;
  onPick: (kind: Exclude<CashDialogKind, "menu">) => void;
}) {
  if (kind === "menu") return <CashMenu {...shared} onPick={onPick} />;
  if (kind === "close") return <CloseDialog {...shared} />;
  return <MovementDialog {...shared} type={kind} />;
}
