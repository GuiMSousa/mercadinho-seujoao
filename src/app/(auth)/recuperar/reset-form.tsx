"use client";

import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useRef, useState, type FormEvent } from "react";
import { Button } from "@ds/components/button";
import { Input } from "@ds/components/input";
import {
  RESEND_SECONDS,
  postJson,
  useCountdown,
  useFocusOnError,
  type FormErrors,
} from "../auth-client";
import { FormAlert } from "../form-alert";
import { PasswordField } from "../password-field";
import { isEmail } from "./reset-start";

const titles = ["Recuperar senha", "Defina uma nova senha", "Senha redefinida"];
const labels = ["Enviar código", "Redefinir senha"];

export function ResetForm({
  initialEmail = "",
  initialStep = 1,
}: {
  initialEmail?: string;
  initialStep?: 1 | 2;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [step, setStep] = useState<1 | 2 | 3>(initialStep);
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<FormErrors | null>(null);
  const [pending, setPending] = useState(false);
  const [resending, setResending] = useState(false);
  const countdown = useCountdown(RESEND_SECONDS);
  useFocusOnError(formRef, errors);

  // The invite code is still valid: asking for a new one here would replace it.
  function haveCode() {
    if (!isEmail(email))
      return setErrors({ fields: { email: "Informe um e-mail válido." } });
    setErrors(null);
    setStep(2);
  }

  async function resend() {
    setResending(true);
    setErrors(null);
    const result = await postJson("/api/auth/password-reset", { email });
    setResending(false);
    if (!result.ok) return setErrors(result.errors);
    countdown.restart();
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (step === 3) return;
    const fields: Record<string, string> = {};
    if (!/^\S+@\S+\.\S+$/.test(email.trim()))
      fields.email = "Informe um e-mail válido.";
    if (step === 2) {
      if (!/^\d{6}$/.test(code)) fields.code = "Digite os 6 números do código.";
      if (
        password.length < 8 ||
        !/\p{L}/u.test(password) ||
        !/\d/.test(password)
      )
        fields.password = "Use 8 caracteres ou mais, com letras e números.";
    }
    if (Object.keys(fields).length) return setErrors({ fields });
    setPending(true);
    setErrors(null);
    const result =
      step === 1
        ? await postJson("/api/auth/password-reset", { email })
        : await postJson("/api/auth/password-reset/confirm", {
            email,
            code,
            password,
          });
    setPending(false);
    if (!result.ok) return setErrors(result.errors);
    setStep((step + 1) as 2 | 3);
  }

  const subtitle = [
    "Informe o e-mail da conta. Enviaremos um código de verificação.",
    `Digite o código enviado para ${email.trim()} e a nova senha.`,
    "Use a nova senha para entrar no painel.",
  ][step - 1];

  return (
    <form
      ref={formRef}
      noValidate
      onSubmit={(event) => void submit(event)}
      className="flex flex-col gap-5"
    >
      {step === 3 && (
        <span className="flex size-12 items-center justify-center rounded-lg bg-success-bg text-success-fg">
          <CheckCircle2 aria-hidden="true" className="size-6" />
        </span>
      )}
      <div className="flex flex-col gap-1.5">
        <h1 className="text-h2 font-medium tracking-tight text-strong">
          {titles[step - 1]}
        </h1>
        <p className="text-pretty text-sub">{subtitle}</p>
      </div>
      {step === 1 && (
        <Input
          name="email"
          type="email"
          label="E-mail"
          size="lg"
          autoComplete="username"
          maxLength={254}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          error={errors?.fields.email}
        />
      )}
      {step === 2 && (
        <div className="flex flex-col gap-4">
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
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
            error={errors?.fields.code}
          />
          <PasswordField
            name="password"
            label="Nova senha"
            autoComplete="new-password"
            maxLength={256}
            hint="Mínimo de 8 caracteres, com letras e números."
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            error={errors?.fields.password}
          />
        </div>
      )}
      <FormAlert message={errors?.error} />
      {step === 3 ? (
        <Button
          render={<Link href="/login" />}
          nativeButton={false}
          size="lg"
          fullWidth
        >
          Ir para o login
        </Button>
      ) : (
        <Button type="submit" size="lg" fullWidth loading={pending}>
          {pending ? "Aguarde…" : labels[step - 1]}
        </Button>
      )}
      {step === 1 && (
        <Button type="button" variant="ghost" onClick={haveCode}>
          Já tenho um código
        </Button>
      )}
      {step === 2 && (
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setErrors(null);
              setStep(1);
            }}
          >
            Voltar
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            loading={resending}
            disabled={countdown.left > 0}
            onClick={() => void resend()}
          >
            {countdown.left > 0
              ? `Reenviar código em ${countdown.left} s`
              : "Reenviar código"}
          </Button>
        </div>
      )}
      {step !== 3 && (
        <Link
          href="/login"
          className="self-center text-body-md font-medium text-link underline underline-offset-4"
        >
          Voltar para entrar
        </Link>
      )}
    </form>
  );
}
