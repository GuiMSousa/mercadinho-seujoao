"use client";

import { useRef, useState, type FormEvent } from "react";
import {
  ADJUSTMENT_KINDS,
  EARLIEST_EXPIRATION,
  type AdjustStock,
  type InventoryProduct,
} from "@/contracts/inventory";
import { FormAlert } from "@/app/(auth)/form-alert";
import { useFocusOnError, type FormErrors } from "@/app/(auth)/auth-client";
import { Button } from "@ds/components/button";
import { Checkbox } from "@ds/components/checkbox";
import { Dialog } from "@ds/components/dialog";
import { Input } from "@ds/components/input";
import { Select } from "@ds/components/select";
import { useToast } from "@ds/components/toast";
import { apiFetch } from "../_lib/api";
import { newId } from "../_lib/new-id";
import {
  formatQuantity,
  parseQuantity,
  quantityToInput,
  unitSuffix,
} from "../produtos/product-form";

const FORM_ID = "adjust-form";

type Kind = AdjustStock["kind"];

const HINTS: Record<Kind, string> = {
  GAIN: "Entra como um lote novo, com o código e a validade abaixo.",
  LOSS: "Sai primeiro do lote que vence antes, como numa venda.",
  EXPIRED: "Sai só dos lotes já vencidos.",
};

/**
 * Manual adjustment with a required reason: an inventory count that found more, a loss or
 * breakage, or expired goods. Clearing expired batches is what lets the product sell again.
 */
export function AdjustDialog({
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
  const firstField = useRef<HTMLSelectElement>(null);
  const attempted = useRef(false);
  // One id per opening: pressing again after a lost response is the same adjustment.
  const [id] = useState(newId);
  const expired = product.batches
    .filter((batch) => batch.daysLeft !== null && batch.daysLeft < 0)
    .reduce((sum, batch) => sum + batch.quantity, 0);
  const [kind, setKind] = useState<Kind>(
    expired > 0 ? "EXPIRED" : product.stock > 0 ? "LOSS" : "GAIN",
  );
  const [quantity, setQuantity] = useState(
    expired > 0 ? quantityToInput(expired, product.unit) : "",
  );
  const [reason, setReason] = useState(expired > 0 ? "Lote vencido" : "");
  const [batchCode, setBatchCode] = useState("");
  const [expirationDate, setExpirationDate] = useState("");
  const [noExpiration, setNoExpiration] = useState(false);
  const [errors, setErrors] = useState<FormErrors | null>(null);
  const [pending, setPending] = useState(false);
  useFocusOnError(formRef, errors);
  const available = kind === "EXPIRED" ? expired : product.stock;

  function close() {
    // After a failure the adjustment may have landed all the same (a lost response): show the truth.
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
    else if (kind !== "GAIN" && amount > available)
      fields.quantity =
        kind === "EXPIRED"
          ? `O saldo vencido é ${formatQuantity(available, product.unit)}.`
          : `O saldo é ${formatQuantity(available, product.unit)}.`;
    if (!reason.trim()) fields.reason = "Informe o motivo.";
    if (kind === "GAIN") {
      if (!batchCode.trim()) fields.batchCode = "Informe o código do lote.";
      if (!noExpiration && !expirationDate)
        fields.expirationDate =
          "Informe a validade ou marque que o item não vence.";
    }
    if (Object.keys(fields).length) return setErrors({ fields });

    setPending(true);
    setErrors(null);
    const result = await apiFetch("/api/admin/inventory/adjustments", {
      method: "POST",
      body: {
        id,
        kind,
        productId: product.id,
        quantity: amount,
        reason,
        ...(kind === "GAIN" && {
          batchCode,
          expirationDate: noExpiration ? null : expirationDate,
        }),
      },
    });
    setPending(false);
    if (!result.ok) {
      attempted.current = true;
      return setErrors(result.errors);
    }
    toast({
      title: "Ajuste registrado",
      message: `${product.name} · ${kind === "GAIN" ? "+" : "−"}${formatQuantity(amount ?? 0, product.unit)}`,
      tone: "success",
    });
    onClose();
    onSaved();
  }

  return (
    <Dialog
      open
      // An adjustment in flight cannot be taken back, so the dialog waits for its answer.
      onOpenChange={(open) => !open && !pending && close()}
      initialFocus={firstField}
      title="Ajuste de estoque"
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
            variant={kind === "GAIN" ? "brand" : "danger"}
            size="counter"
            loading={pending}
          >
            Registrar ajuste
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
        <Select
          ref={firstField}
          size="counter"
          label="Tipo de ajuste"
          name="kind"
          options={Object.entries(ADJUSTMENT_KINDS).map(([value, label]) => ({
            value,
            label,
          }))}
          value={kind}
          onChange={(event) => {
            setKind(event.target.value as Kind);
            setErrors(null);
          }}
        />
        <Input
          required
          size="counter"
          label="Quantidade"
          name="quantity"
          suffix={unitSuffix(product.unit)}
          numeric
          inputMode={product.unit === "UN" ? "numeric" : "decimal"}
          autoComplete="off"
          hint={HINTS[kind]}
          value={quantity}
          onChange={(event) => setQuantity(event.target.value)}
          error={errors?.fields.quantity}
        />
        {kind === "GAIN" && (
          <>
            <Input
              required
              size="counter"
              label="Código do lote"
              name="batchCode"
              autoComplete="off"
              maxLength={60}
              value={batchCode}
              onChange={(event) => setBatchCode(event.target.value)}
              error={errors?.fields.batchCode}
            />
            <Input
              size="counter"
              label="Validade"
              name="expirationDate"
              type="date"
              min={EARLIEST_EXPIRATION}
              disabled={noExpiration}
              value={noExpiration ? "" : expirationDate}
              onChange={(event) => setExpirationDate(event.target.value)}
              error={errors?.fields.expirationDate}
            />
            <Checkbox
              // The whole row is the touch target, as tall as the counter fields.
              className="min-h-control-counter"
              label="Item não vence"
              checked={noExpiration}
              onCheckedChange={setNoExpiration}
            />
          </>
        )}
        <Input
          required
          size="counter"
          label="Motivo"
          name="reason"
          autoComplete="off"
          maxLength={200}
          placeholder="Ex.: contagem do mês, avaria na entrega"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          error={errors?.fields.reason}
        />
        <FormAlert message={errors?.error} />
      </form>
    </Dialog>
  );
}
