"use client";

import { useRef, useState, type FormEvent } from "react";
import type { SupplierRow } from "@/contracts/suppliers";
import { FormAlert } from "@/app/(auth)/form-alert";
import { useFocusOnError, type FormErrors } from "@/app/(auth)/auth-client";
import { formatDocument } from "@/lib/document";
import { Button } from "@ds/components/button";
import { Checkbox } from "@ds/components/checkbox";
import { Dialog } from "@ds/components/dialog";
import { Input } from "@ds/components/input";
import { useToast } from "@ds/components/toast";
import { apiFetch } from "../_lib/api";

const FORM_ID = "supplier-form";

type Values = Omit<SupplierRow, "id">;

/** Only what changed, so the activity log names just those fields. */
function changes(supplier: SupplierRow, next: Values) {
  return Object.fromEntries(
    Object.entries(next).filter(
      ([key, value]) => supplier[key as keyof Values] !== value,
    ),
  ) as Partial<Values>;
}

/** New supplier (supplier = null) or edit, including deactivation. */
export function SupplierDialog({
  supplier,
  onClose,
  onSaved,
}: {
  supplier: SupplierRow | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const firstField = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(supplier?.name ?? "");
  const [document, setDocument] = useState(
    formatDocument(supplier?.document ?? ""),
  );
  const [phone, setPhone] = useState(supplier?.phone ?? "");
  const [email, setEmail] = useState(supplier?.email ?? "");
  const [contactPerson, setContactPerson] = useState(
    supplier?.contactPerson ?? "",
  );
  const [active, setActive] = useState(supplier?.active ?? true);
  const [errors, setErrors] = useState<FormErrors | null>(null);
  const [pending, setPending] = useState(false);
  useFocusOnError(formRef, errors);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) return setErrors({ fields: { name: "Informe o nome." } });
    // The server validates and keeps only digits; these are compared in the same form.
    const values: Values = {
      name: name.trim(),
      document: document.replace(/\D/g, ""),
      phone: phone.replace(/\D/g, ""),
      email: email.trim().toLowerCase(),
      contactPerson: contactPerson.trim(),
      active,
    };
    const patch = supplier && changes(supplier, values);
    if (patch && Object.keys(patch).length === 0) return onClose();
    setPending(true);
    setErrors(null);
    const result = supplier
      ? await apiFetch(`/api/admin/suppliers/${supplier.id}`, {
          method: "PATCH",
          body: patch,
        })
      : await apiFetch("/api/admin/suppliers", {
          method: "POST",
          body: values,
        });
    setPending(false);
    if (!result.ok) return setErrors(result.errors);
    toast({
      title: supplier ? "Fornecedor atualizado" : "Fornecedor cadastrado",
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
      title={supplier ? "Editar fornecedor" : "Novo fornecedor"}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={pending}>
            Cancelar
          </Button>
          <Button type="submit" form={FORM_ID} loading={pending}>
            {supplier ? "Salvar alterações" : "Cadastrar fornecedor"}
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
          autoComplete="organization"
          maxLength={120}
          value={name}
          onChange={(event) => setName(event.target.value)}
          error={errors?.fields.name}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="CNPJ ou CPF (opcional)"
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
            label="WhatsApp"
            name="phone"
            type="tel"
            autoComplete="tel"
            hint="Com DDD. Recebe o pedido de reposição."
            maxLength={20}
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            error={errors?.fields.phone}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Contato"
            name="contactPerson"
            autoComplete="name"
            maxLength={120}
            value={contactPerson}
            onChange={(event) => setContactPerson(event.target.value)}
            error={errors?.fields.contactPerson}
          />
          <Input
            label="E-mail (opcional)"
            name="email"
            type="email"
            autoComplete="email"
            maxLength={254}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            error={errors?.fields.email}
          />
        </div>
        {supplier && (
          <Checkbox
            label="Fornecedor ativo"
            checked={active}
            onCheckedChange={setActive}
          />
        )}
        <FormAlert message={errors?.error} />
      </form>
    </Dialog>
  );
}
