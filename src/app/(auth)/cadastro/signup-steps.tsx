"use client";

import { Button } from "@ds/components/button";
import { Checkbox } from "@ds/components/checkbox";
import { Input } from "@ds/components/input";
import { Select } from "@ds/components/select";
import { STORE_KINDS } from "@/contracts/auth";
import { formatDocument } from "@/lib/document";
import { PasswordField } from "../password-field";
import { PasswordStrength } from "../password-strength";

export type SignupValues = {
  name: string;
  email: string;
  password: string;
  confirm: string;
  storeName: string;
  document: string;
  phone: string;
  kind: string;
  terms: boolean;
  code: string;
};

export const initialValues: SignupValues = {
  name: "",
  email: "",
  password: "",
  confirm: "",
  storeName: "",
  document: "",
  phone: "",
  kind: STORE_KINDS[0],
  terms: false,
  code: "",
};

type StepProps = {
  values: SignupValues;
  set: <K extends keyof SignupValues>(key: K, value: SignupValues[K]) => void;
  errors: Record<string, string>;
};

const kindOptions = STORE_KINDS.map((value) => ({ value, label: value }));

export function AccountStep({ values, set, errors }: StepProps) {
  return (
    <>
      <Input
        name="name"
        label="Nome completo"
        size="lg"
        autoComplete="name"
        maxLength={120}
        value={values.name}
        onChange={(event) => set("name", event.target.value)}
        error={errors.name}
      />
      <Input
        name="email"
        type="email"
        label="E-mail"
        size="lg"
        autoComplete="email"
        maxLength={254}
        value={values.email}
        onChange={(event) => set("email", event.target.value)}
        error={errors.email}
      />
      <div className="flex flex-col gap-2">
        <PasswordField
          name="password"
          label="Senha"
          autoComplete="new-password"
          maxLength={256}
          hint="Mínimo de 8 caracteres, com letras e números."
          value={values.password}
          onChange={(event) => set("password", event.target.value)}
          error={errors.password}
        />
        <PasswordStrength password={values.password} />
      </div>
      <PasswordField
        name="confirm"
        label="Confirmar senha"
        autoComplete="new-password"
        maxLength={256}
        value={values.confirm}
        onChange={(event) => set("confirm", event.target.value)}
        error={errors.confirm}
      />
    </>
  );
}

export function StoreStep({ values, set, errors }: StepProps) {
  return (
    <>
      <Input
        name="storeName"
        label="Nome da loja"
        size="lg"
        placeholder="Mercadinho Bom Preço"
        maxLength={80}
        value={values.storeName}
        onChange={(event) => set("storeName", event.target.value)}
        error={errors.storeName}
      />
      <div className="grid grid-cols-[repeat(auto-fit,minmax(10rem,1fr))] gap-4">
        <Input
          name="document"
          label="CNPJ ou CPF"
          size="lg"
          inputMode="numeric"
          placeholder="00.000.000/0000-00"
          value={values.document}
          onChange={(event) =>
            set("document", formatDocument(event.target.value))
          }
          error={errors.document}
        />
        <Input
          name="phone"
          type="tel"
          label="Telefone"
          size="lg"
          autoComplete="tel"
          placeholder="(11) 90000-0000"
          maxLength={20}
          value={values.phone}
          onChange={(event) => set("phone", event.target.value)}
          error={errors.phone}
        />
      </div>
      <Select
        name="kind"
        label="Tipo de comércio"
        size="lg"
        options={kindOptions}
        value={values.kind}
        onChange={(event) => set("kind", event.target.value)}
        error={errors.kind}
      />
      <div className="flex flex-col gap-1.5">
        <Checkbox
          label="Li e aceito os termos de uso e a política de privacidade"
          checked={values.terms}
          onCheckedChange={(checked) => set("terms", checked)}
          aria-invalid={errors.terms ? true : undefined}
          aria-describedby={errors.terms ? "terms-error" : undefined}
        />
        {errors.terms && (
          <span id="terms-error" className="text-caption text-danger-fg">
            {errors.terms}
          </span>
        )}
      </div>
    </>
  );
}

export function CodeStep({
  values,
  set,
  errors,
  secondsLeft,
  onResend,
  resending,
}: StepProps & {
  secondsLeft: number;
  onResend: () => void;
  resending: boolean;
}) {
  return (
    <>
      <Input
        name="code"
        label="Código de verificação"
        size="lg"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        placeholder="000000"
        className="[&_input]:text-counter [&_input]:tabular-nums"
        style={{ letterSpacing: "0.5em" }}
        value={values.code}
        onChange={(event) => set("code", event.target.value.replace(/\D/g, ""))}
        error={errors.code}
      />
      <div className="flex flex-wrap items-center gap-2 text-body-md text-sub">
        Não recebeu?
        <Button
          type="button"
          variant="ghost"
          size="sm"
          loading={resending}
          disabled={secondsLeft > 0}
          onClick={onResend}
        >
          {secondsLeft > 0
            ? `Reenviar código em ${secondsLeft} s`
            : "Reenviar código"}
        </Button>
      </div>
    </>
  );
}
