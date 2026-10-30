"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import type { z } from "zod";
import type { storeResponseSchema } from "@/contracts/store";
import { FormAlert } from "@/app/(auth)/form-alert";
import { useFocusOnError, type FormErrors } from "@/app/(auth)/auth-client";
import { formatDocument } from "@/lib/document";
import { Button } from "@ds/components/button";
import { Card } from "@ds/components/card";
import { Input } from "@ds/components/input";
import { useToast } from "@ds/components/toast";
import { apiFetch } from "../_lib/api";

export type StoreData = z.infer<typeof storeResponseSchema>;

const FIELDS = ["name", "document", "phone", "address"] as const;
const toValues = (store: StoreData) => ({
  name: store.name,
  document: formatDocument(store.document),
  phone: store.phone,
  address: store.address,
});

export function StoreForm({ store }: { store: StoreData }) {
  const router = useRouter();
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const [values, setValues] = useState(() => toValues(store));
  const [saved, setSaved] = useState(store);
  // Resync when the saved store changes (another tab or admin), keeping fields the user is editing.
  if (store !== saved) {
    const before = toValues(saved);
    const after = toValues(store);
    setSaved(store);
    setValues((current) => {
      const next = { ...current };
      for (const key of FIELDS)
        if (before[key] !== after[key]) next[key] = after[key];
      return next;
    });
  }
  const [errors, setErrors] = useState<FormErrors | null>(null);
  const [pending, setPending] = useState(false);
  useFocusOnError(formRef, errors);

  const bind = (key: keyof typeof values) => ({
    value: values[key],
    onChange: (event: { target: { value: string } }) =>
      setValues((current) => ({ ...current, [key]: event.target.value })),
    error: errors?.fields[key],
  });

  async function submit(event: FormEvent) {
    event.preventDefault();
    const base = toValues(store);
    const changes = Object.fromEntries(
      FIELDS.filter((key) => values[key] !== base[key]).map((key) => [
        key,
        values[key],
      ]),
    );
    if (Object.keys(changes).length === 0)
      return toast({ title: "Nenhuma alteração para salvar.", tone: "info" });
    setPending(true);
    setErrors(null);
    const result = await apiFetch("/api/store", {
      method: "PATCH",
      body: changes,
    });
    setPending(false);
    if (!result.ok) return setErrors(result.errors);
    toast({ title: "Dados da loja salvos", tone: "success" });
    router.refresh();
  }

  return (
    <Card title="Dados da loja" subtitle="Aparecem no cupom e nos relatórios.">
      <form
        ref={formRef}
        noValidate
        onSubmit={(event) => void submit(event)}
        className="flex flex-col gap-4"
      >
        <Input
          label="Nome da loja"
          name="name"
          autoComplete="organization"
          maxLength={80}
          {...bind("name")}
        />
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,9.5rem),1fr))] gap-4">
          <Input
            label="CNPJ ou CPF"
            name="document"
            inputMode="numeric"
            {...bind("document")}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                document: formatDocument(event.target.value),
              }))
            }
          />
          <Input
            label="Telefone"
            name="phone"
            type="tel"
            maxLength={20}
            {...bind("phone")}
          />
        </div>
        <Input
          label="Endereço"
          name="address"
          autoComplete="street-address"
          maxLength={200}
          {...bind("address")}
        />
        <FormAlert message={errors?.error} />
        <div className="flex justify-end">
          <Button type="submit" loading={pending}>
            Salvar alterações
          </Button>
        </div>
      </form>
    </Card>
  );
}
