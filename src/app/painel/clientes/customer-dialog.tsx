"use client";

import { useRef, useState, type FormEvent } from "react";
import type { CustomerRow } from "@/contracts/customers";
import { FormAlert } from "@/app/(auth)/form-alert";
import { useFocusOnError, type FormErrors } from "@/app/(auth)/auth-client";
import { formatDocument } from "@/lib/document";
import { Button } from "@ds/components/button";
import { Checkbox } from "@ds/components/checkbox";
import { Dialog } from "@ds/components/dialog";
import { Input } from "@ds/components/input";
import { useToast } from "@ds/components/toast";
import { apiFetch } from "../_lib/api";
import { centsToInput, parseCents } from "../produtos/product-form";

const FORM_ID = "customer-form";

type Values = Pick<
  CustomerRow,
  "name" | "document" | "phone" | "creditLimit" | "active"
>;

/** Only what changed, so the activity log names just those fields. */
function changes(customer: CustomerRow, next: Values) {
  return Object.fromEntries(
    Object.entries(next).filter(
      ([key, value]) => customer[key as keyof Values] !== value,
    ),
  ) as Partial<Values>;
}

/** New customer (customer = null) or edit, with the credit limit and deactivation. */
export function CustomerDialog({
  customer,
  onClose,
  onSaved,
}: {
  customer: CustomerRow | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const firstField = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(customer?.name ?? "");
  const [document, setDocument] = useState(
    formatDocument(customer?.document ?? ""),
  );
  const [phone, setPhone] = useState(customer?.phone ?? "");
  const [limit, setLimit] = useState(centsToInput(customer?.creditLimit ?? 0));
  const [active, setActive] = useState(customer?.active ?? true);
  const [errors, setErrors] = useState<FormErrors | null>(null);
  const [pending, setPending] = useState(false);
  useFocusOnError(formRef, errors);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const creditLimit = parseCents(limit);
    const fields: Record<string, string> = {};
    if (!name.trim()) fields.name = "Informe o nome.";
    if (creditLimit === null)
      fields.creditLimit = "Informe o limite em reais. Ex.: 200,00";
    if (creditLimit === null || Object.keys(fields).length)
      return setErrors({ fields });
    // The server validates and keeps only digits; these are compared in the same form.
    const values: Values = {
      name: name.trim(),
      document: document.replace(/\D/g, ""),
      phone: phone.replace(/\D/g, ""),
      creditLimit,
      active,
    };
    const patch = customer && changes(customer, values);
    if (patch && Object.keys(patch).length === 0) return onClose();
    setPending(true);
    setErrors(null);
    const result = customer
      ? await apiFetch(`/api/admin/customers/${customer.id}`, {
          method: "PATCH",
          body: patch,
        })
      : await apiFetch("/api/admin/customers", {
          method: "POST",
          body: values,
        });
    setPending(false);
    if (!result.ok) return setErrors(result.errors);
    toast({
      title: customer ? "Cliente atualizado" : "Cliente cadastrado",
      message: values.name,
      tone: "success",
    });
    onClose();
    onSaved();
  }

  return (
    <Dialog
      open
      // A save in flight cannot be taken back, so the dialog waits for its answer.
      onOpenChange={(open) => !open && !pending && onClose()}
      initialFocus={firstField}
      title={customer ? "Editar cliente" : "Novo cliente"}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={pending}>
            Cancelar
          </Button>
          <Button type="submit" form={FORM_ID} loading={pending}>
            {customer ? "Salvar alterações" : "Cadastrar cliente"}
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
          label="Nome"
          name="name"
          autoComplete="name"
          maxLength={120}
          value={name}
          onChange={(event) => setName(event.target.value)}
          error={errors?.fields.name}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="CPF ou CNPJ (opcional)"
            name="document"
            inputMode="numeric"
            autoComplete="off"
            maxLength={18}
            value={document}
            onChange={(event) =>
              setDocument(formatDocument(event.target.value))
            }
            error={errors?.fields.document}
          />
          <Input
            label="WhatsApp (opcional)"
            name="phone"
            type="tel"
            autoComplete="tel"
            hint="Com DDD. Recebe o comprovante de pagamento."
            maxLength={20}
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            error={errors?.fields.phone}
          />
        </div>
        <Input
          label="Limite de crédito"
          name="creditLimit"
          prefix="R$"
          numeric
          inputMode="decimal"
          autoComplete="off"
          hint="Quanto o cliente pode dever no fiado. Zero não permite fiado."
          maxLength={13}
          value={limit}
          onChange={(event) => setLimit(event.target.value)}
          error={errors?.fields.creditLimit}
        />
        {customer && (
          <Checkbox
            label="Cliente ativo"
            checked={active}
            onCheckedChange={setActive}
          />
        )}
        <FormAlert message={errors?.error} />
      </form>
    </Dialog>
  );
}
