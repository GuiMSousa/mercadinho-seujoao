"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { FormAlert } from "@/app/(auth)/form-alert";
import { useFocusOnError, type FormErrors } from "@/app/(auth)/auth-client";
import { Button } from "@ds/components/button";
import { Dialog } from "@ds/components/dialog";
import { Input } from "@ds/components/input";
import { useToast } from "@ds/components/toast";
import { apiFetch } from "../_lib/api";

const FORM_ID = "category-form";

export function CategoryDialog({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const firstField = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [errors, setErrors] = useState<FormErrors | null>(null);
  const [pending, setPending] = useState(false);
  useFocusOnError(formRef, errors);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) return setErrors({ fields: { name: "Informe o nome." } });
    setPending(true);
    setErrors(null);
    const result = await apiFetch("/api/admin/categories", {
      method: "POST",
      body: { name },
    });
    setPending(false);
    if (!result.ok) return setErrors(result.errors);
    toast({
      title: "Categoria criada",
      message: name.trim(),
      tone: "success",
    });
    onClose();
    router.refresh();
  }

  return (
    <Dialog
      open
      // A save in flight cannot be taken back, so the dialog waits for its answer.
      onOpenChange={(open) => !open && !pending && onClose()}
      initialFocus={firstField}
      title="Nova categoria"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={pending}>
            Cancelar
          </Button>
          <Button type="submit" form={FORM_ID} loading={pending}>
            Criar categoria
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
          autoComplete="off"
          maxLength={120}
          value={name}
          onChange={(event) => setName(event.target.value)}
          error={errors?.fields.name}
        />
        <FormAlert message={errors?.error} />
      </form>
    </Dialog>
  );
}
