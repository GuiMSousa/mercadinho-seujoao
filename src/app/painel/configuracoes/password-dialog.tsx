"use client";

import { useRef, useState, type FormEvent } from "react";
import { PasswordField } from "@/app/(auth)/password-field";
import { FormAlert } from "@/app/(auth)/form-alert";
import { useFocusOnError, type FormErrors } from "@/app/(auth)/auth-client";
import { Button } from "@ds/components/button";
import { Dialog } from "@ds/components/dialog";
import { useToast } from "@ds/components/toast";
import { apiFetch } from "../_lib/api";
import { passwordFormErrors } from "./password-form";

const FORM_ID = "password-form";

/** Mount only while open so the fields start empty every time. */
export function PasswordDialog({ onClose }: { onClose: () => void }) {
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<FormErrors | null>(null);
  const [pending, setPending] = useState(false);
  useFocusOnError(formRef, errors);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const fields = passwordFormErrors({ current, next, confirm });
    if (Object.keys(fields).length) return setErrors({ fields });
    setPending(true);
    setErrors(null);
    const result = await apiFetch("/api/account/password", {
      method: "POST",
      body: { current, next },
    });
    setPending(false);
    if (!result.ok) return setErrors(result.errors);
    toast({
      title: "Senha alterada",
      message: "Use a nova senha no próximo acesso.",
      tone: "success",
    });
    onClose();
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => !open && onClose()}
      title="Alterar senha"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form={FORM_ID} loading={pending}>
            Salvar senha
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
        <PasswordField
          size="md"
          label="Senha atual"
          name="current"
          autoComplete="current-password"
          maxLength={256}
          value={current}
          onChange={(event) => setCurrent(event.target.value)}
          error={errors?.fields.current}
        />
        <PasswordField
          size="md"
          label="Nova senha"
          name="next"
          autoComplete="new-password"
          maxLength={256}
          hint="Mínimo de 8 caracteres, com letras e números."
          value={next}
          onChange={(event) => setNext(event.target.value)}
          error={errors?.fields.next}
        />
        <PasswordField
          size="md"
          label="Confirmar nova senha"
          name="confirm"
          autoComplete="new-password"
          maxLength={256}
          value={confirm}
          onChange={(event) => setConfirm(event.target.value)}
          error={errors?.fields.confirm}
        />
        <FormAlert message={errors?.error} />
      </form>
    </Dialog>
  );
}
