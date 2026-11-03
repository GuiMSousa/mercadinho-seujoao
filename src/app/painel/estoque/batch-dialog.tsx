"use client";

import { useRef, useState, type FormEvent } from "react";
import { EARLIEST_EXPIRATION, type ProductRow } from "@/contracts/inventory";
import { FormAlert } from "@/app/(auth)/form-alert";
import { useFocusOnError, type FormErrors } from "@/app/(auth)/auth-client";
import { Button } from "@ds/components/button";
import { Checkbox } from "@ds/components/checkbox";
import { Dialog } from "@ds/components/dialog";
import { Input } from "@ds/components/input";
import { useToast } from "@ds/components/toast";
import { apiFetch } from "../_lib/api";
import { newId } from "../_lib/new-id";
import { parseQuantity, unitSuffix } from "../produtos/product-form";

const FORM_ID = "batch-form";

/** Goods received: creates the batch and its IN movement. */
export function BatchDialog({
  product,
  onClose,
  onSaved,
}: {
  product: Pick<ProductRow, "id" | "name" | "unit">;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const firstField = useRef<HTMLInputElement>(null);
  // One id per opening: pressing again after a lost response is the same entry.
  const [id] = useState(newId);
  const attempted = useRef(false);
  const [batchCode, setBatchCode] = useState("");
  const [expirationDate, setExpirationDate] = useState("");
  const [noExpiration, setNoExpiration] = useState(false);
  const [quantity, setQuantity] = useState("");
  const [errors, setErrors] = useState<FormErrors | null>(null);
  const [pending, setPending] = useState(false);
  useFocusOnError(formRef, errors);

  function close() {
    // After a failure the entry may have landed all the same (a lost response): show the truth.
    if (attempted.current) onSaved();
    onClose();
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const amount = parseQuantity(quantity, product.unit);
    const fields: Record<string, string> = {};
    if (!batchCode.trim()) fields.batchCode = "Informe o código do lote.";
    if (!noExpiration && !expirationDate)
      fields.expirationDate =
        "Informe a validade ou marque que o item não vence.";
    if (!amount)
      fields.quantity =
        product.unit === "UN"
          ? "Informe um número inteiro maior que zero."
          : "Informe uma quantidade maior que zero, com até 3 casas. Ex.: 1,250";
    if (Object.keys(fields).length) return setErrors({ fields });

    setPending(true);
    setErrors(null);
    const result = await apiFetch(`/api/admin/products/${product.id}/batches`, {
      method: "POST",
      body: {
        id,
        batchCode,
        expirationDate: noExpiration ? null : expirationDate,
        quantity: amount,
      },
    });
    setPending(false);
    if (!result.ok) {
      attempted.current = true;
      return setErrors(result.errors);
    }
    toast({
      title: "Entrada registrada",
      message: `${product.name} · lote ${batchCode.trim()}`,
      tone: "success",
    });
    onClose();
    onSaved();
  }

  return (
    <Dialog
      open
      // A save in flight cannot be taken back, so the dialog waits for its answer.
      onOpenChange={(open) => !open && !pending && close()}
      initialFocus={firstField}
      title="Entrada de lote"
      description={product.name}
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
          <Button type="submit" form={FORM_ID} size="counter" loading={pending}>
            Registrar entrada
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
          label="Item não vence"
          checked={noExpiration}
          onCheckedChange={(checked) => {
            setNoExpiration(checked);
            setErrors((current) => {
              if (!current) return current;
              const fields = { ...current.fields };
              delete fields.expirationDate;
              return { ...current, fields };
            });
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
          value={quantity}
          onChange={(event) => setQuantity(event.target.value)}
          error={errors?.fields.quantity}
        />
        <FormAlert message={errors?.error} />
      </form>
    </Dialog>
  );
}
