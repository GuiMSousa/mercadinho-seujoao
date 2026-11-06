"use client";

import { useRef, useState, type FormEvent } from "react";
import type { InventoryProduct } from "@/contracts/inventory";
import { FormAlert } from "@/app/(auth)/form-alert";
import { useFocusOnError, type FormErrors } from "@/app/(auth)/auth-client";
import { Button } from "@ds/components/button";
import { Dialog } from "@ds/components/dialog";
import { Input } from "@ds/components/input";
import { useToast } from "@ds/components/toast";
import { apiFetch } from "../_lib/api";
import { newId } from "../_lib/new-id";
import {
  formatQuantity,
  parseQuantity,
  quantityToInput,
  unitSuffix,
} from "../produtos/product-form";

const FORM_ID = "out-form";

/**
 * Write-off (loss, breakage, expired goods). It leaves by PVPS like a sale, so expired batches go
 * first: that is how an expired batch is cleared and the product sells again at the counter.
 */
export function OutDialog({
  product,
  onClose,
  onSaved,
}: {
  product: InventoryProduct;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const firstField = useRef<HTMLInputElement>(null);
  const attempted = useRef(false);
  // One id per opening: pressing again after a lost response is the same write-off.
  const [id] = useState(newId);
  const expired = product.batches
    .filter((batch) => batch.daysLeft !== null && batch.daysLeft < 0)
    .reduce((sum, batch) => sum + batch.quantity, 0);
  const [quantity, setQuantity] = useState(
    expired > 0 ? quantityToInput(expired, product.unit) : "",
  );
  const [reason, setReason] = useState(expired > 0 ? "Lote vencido" : "");
  const [errors, setErrors] = useState<FormErrors | null>(null);
  const [pending, setPending] = useState(false);
  useFocusOnError(formRef, errors);

  function close() {
    // After a failure the write-off may have landed all the same (a lost response): show the truth.
    if (attempted.current) onSaved();
    onClose();
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const amount = parseQuantity(quantity, product.unit);
    const fields: Record<string, string> = {};
    if (!amount)
      fields.quantity =
        product.unit === "UN"
          ? "Informe um número inteiro maior que zero."
          : "Informe uma quantidade maior que zero, com até 3 casas. Ex.: 1,250";
    else if (amount > product.stock)
      fields.quantity = `O saldo é ${formatQuantity(product.stock, product.unit)}.`;
    if (!reason.trim()) fields.reason = "Informe o motivo.";
    if (Object.keys(fields).length) return setErrors({ fields });

    setPending(true);
    setErrors(null);
    const result = await apiFetch("/api/admin/inventory/out", {
      method: "POST",
      body: { id, productId: product.id, quantity: amount, reason },
    });
    setPending(false);
    if (!result.ok) {
      attempted.current = true;
      return setErrors(result.errors);
    }
    toast({
      title: "Baixa registrada",
      message: `${product.name} · ${formatQuantity(amount ?? 0, product.unit)}`,
      tone: "success",
    });
    onClose();
    onSaved();
  }

  return (
    <Dialog
      open
      // A write-off in flight cannot be taken back, so the dialog waits for its answer.
      onOpenChange={(open) => !open && !pending && close()}
      initialFocus={firstField}
      title="Baixa de estoque"
      description={`${product.name} · saldo ${formatQuantity(product.stock, product.unit)}`}
      footer={
        <>
          <Button
            variant="secondary"
            size="counter"
            onClick={close}
            disabled={pending}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            form={FORM_ID}
            variant="danger"
            size="counter"
            loading={pending}
          >
            Registrar baixa
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
          size="counter"
          label="Quantidade"
          name="quantity"
          suffix={unitSuffix(product.unit)}
          numeric
          inputMode={product.unit === "UN" ? "numeric" : "decimal"}
          autoComplete="off"
          hint="Sai primeiro do lote que vence antes, como numa venda."
          value={quantity}
          onChange={(event) => setQuantity(event.target.value)}
          error={errors?.fields.quantity}
        />
        <Input
          required
          size="counter"
          label="Motivo"
          name="reason"
          autoComplete="off"
          maxLength={200}
          placeholder="Ex.: lote vencido, avaria"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          error={errors?.fields.reason}
        />
        <FormAlert message={errors?.error} />
      </form>
    </Dialog>
  );
}
