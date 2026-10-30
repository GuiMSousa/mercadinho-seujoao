"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import type { UserRow } from "@/contracts/users";
import { FormAlert } from "@/app/(auth)/form-alert";
import { useFocusOnError, type FormErrors } from "@/app/(auth)/auth-client";
import { Button } from "@ds/components/button";
import { Checkbox } from "@ds/components/checkbox";
import { Dialog } from "@ds/components/dialog";
import { Input } from "@ds/components/input";
import { Select } from "@ds/components/select";
import { useToast } from "@ds/components/toast";
import { apiFetch } from "../_lib/api";
import { ROLE_LABEL } from "./team-table";
import { userPatch } from "./user-state";

const FORM_ID = "user-form";
const roleOptions = [
  { value: "CASHIER", label: ROLE_LABEL.CASHIER },
  { value: "ADMIN", label: ROLE_LABEL.ADMIN },
];

/** Invite (user = null) or edit. Mount it only while open so each opening starts from fresh state. */
export function UserDialog({
  user,
  onClose,
}: {
  user: UserRow | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [role, setRole] = useState<string>(user?.role ?? "CASHIER");
  const [active, setActive] = useState(user?.active ?? true);
  const [errors, setErrors] = useState<FormErrors | null>(null);
  const [pending, setPending] = useState(false);
  useFocusOnError(formRef, errors);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const fields: Record<string, string> = {};
    if (!name.trim()) fields.name = "Informe o nome.";
    if (!user && !email.trim()) fields.email = "Informe um e-mail válido.";
    if (Object.keys(fields).length) return setErrors({ fields });
    const patch = user && userPatch(user, { name, role, active });
    // Nothing changed: the server would refuse an empty edit, so there is nothing to send.
    if (user && patch && Object.keys(patch).length === 0) return onClose();
    setPending(true);
    setErrors(null);
    const result = user
      ? await apiFetch(`/api/admin/users/${user.id}`, {
          method: "PATCH",
          body: patch,
        })
      : await apiFetch("/api/admin/users", {
          method: "POST",
          body: { name, email, role },
        });
    setPending(false);
    if (!result.ok) return setErrors(result.errors);
    toast({
      title: user ? "Usuário atualizado" : "Convite enviado",
      message: user ? user.email : email.trim().toLowerCase(),
      tone: "success",
    });
    onClose();
    router.refresh();
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => !open && onClose()}
      title={user ? "Editar usuário" : "Adicionar usuário"}
      description={
        user
          ? undefined
          : "O usuário recebe um convite por e-mail para criar a senha."
      }
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form={FORM_ID} loading={pending}>
            {user ? "Salvar" : "Enviar convite"}
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
          label="Nome"
          name="name"
          autoComplete="off"
          maxLength={120}
          value={name}
          onChange={(event) => setName(event.target.value)}
          error={errors?.fields.name}
        />
        <Input
          label="E-mail"
          name="email"
          type="email"
          autoComplete="off"
          maxLength={254}
          value={email}
          readOnly={Boolean(user)}
          onChange={(event) => setEmail(event.target.value)}
          error={errors?.fields.email}
        />
        <Select
          label="Perfil"
          name="role"
          options={roleOptions}
          value={role}
          onChange={(event) => setRole(event.target.value)}
          error={errors?.fields.role}
        />
        {user && (
          <Checkbox
            label="Acesso ativo"
            checked={active}
            onCheckedChange={setActive}
          />
        )}
        <FormAlert message={errors?.error} />
      </form>
    </Dialog>
  );
}
