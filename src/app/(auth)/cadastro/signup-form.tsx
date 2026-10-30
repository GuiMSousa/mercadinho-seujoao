"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { Button } from "@ds/components/button";
import { useToast } from "@ds/components/toast";
import { cn } from "@ds/lib/cn";
import {
  postJson,
  RESEND_SECONDS,
  useCountdown,
  useFocusOnError,
  useFocusOnStep,
  type FormErrors,
} from "../auth-client";
import { FormAlert } from "../form-alert";
import {
  AccountStep,
  CodeStep,
  initialValues,
  StoreStep,
} from "./signup-steps";
import {
  signupPayload,
  validateAccount,
  validateCode,
  validateStore,
} from "./signup-validation";

const titles = ["Crie sua conta", "Dados da loja", "Confirme seu e-mail"];
const submitLabels = ["Continuar", "Enviar código", "Criar conta"];
const STEP_OF_FIELD: Record<string, 1 | 2 | 3> = {
  name: 1,
  email: 1,
  password: 1,
  confirm: 1,
  code: 3,
};

export function SignupForm() {
  const router = useRouter();
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<FormErrors | null>(null);
  const [pending, setPending] = useState(false);
  const [resending, setResending] = useState(false);
  const countdown = useCountdown(RESEND_SECONDS);
  const heading = useFocusOnStep(step);
  useFocusOnError(formRef, errors);
  // Payload of the last accepted POST /signup: going back and forward unchanged must not repeat it.
  const sentPayload = useRef<string | null>(null);

  const set: React.ComponentProps<typeof AccountStep>["set"] = (key, value) =>
    setValues((current) => ({ ...current, [key]: value }));

  function fail(result: FormErrors, current: 1 | 2 | 3) {
    // The server validates every signup field at step 2; send the user back to the offending step.
    const back = Math.min(
      current,
      ...Object.keys(result.fields).map((field) => STEP_OF_FIELD[field] ?? 2),
    ) as 1 | 2 | 3;
    setStep(back);
    setErrors(result);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (step === 1) {
      const fields = validateAccount(values);
      if (Object.keys(fields).length) return setErrors({ fields });
      setErrors(null);
      return setStep(2);
    }
    if (step === 2) {
      const fields = validateStore(values);
      if (Object.keys(fields).length) return setErrors({ fields });
      if (sentPayload.current === JSON.stringify(signupPayload(values))) {
        setErrors(null);
        return setStep(3);
      }
    }
    if (step === 3) {
      const code = validateCode(values.code);
      if (code) return setErrors({ fields: { code } });
    }
    setPending(true);
    setErrors(null);
    const result =
      step === 2
        ? await postJson("/api/auth/signup", signupPayload(values))
        : await postJson("/api/auth/signup/verify", {
            email: values.email,
            code: values.code,
          });
    if (!result.ok) {
      fail(result.errors, step);
      return setPending(false);
    }
    if (step === 2) {
      sentPayload.current = JSON.stringify(signupPayload(values));
      countdown.restart();
      setStep(3);
      return setPending(false);
    }
    router.replace("/painel");
    router.refresh();
  }

  async function resend() {
    setResending(true);
    const result = await postJson("/api/auth/signup/resend", {
      email: values.email,
    });
    setResending(false);
    if (!result.ok) return setErrors(result.errors);
    countdown.restart();
    setErrors(null);
    toast({
      title: "Código reenviado",
      message: "Confira também a caixa de spam.",
      tone: "info",
    });
  }

  const subtitle = [
    "Você será o administrador da loja.",
    "Usados no cupom e nos relatórios. Dá para alterar depois.",
    `Digite o código de 6 números enviado para ${values.email || "seu e-mail"}.`,
  ][step - 1];
  const fieldErrors = errors?.fields ?? {};

  return (
    <form
      ref={formRef}
      noValidate
      onSubmit={(event) => void submit(event)}
      className="flex flex-col gap-5"
    >
      <div className="flex flex-col gap-3">
        <div aria-hidden="true" className="grid grid-cols-3 gap-1.5">
          {[1, 2, 3].map((n) => (
            <span
              key={n}
              className={cn(
                "h-1 rounded-xs",
                n <= step ? "bg-brand" : "bg-border",
              )}
            />
          ))}
        </div>
        <span className="text-caption text-sub">Etapa {step} de 3</span>
        <h1
          ref={heading}
          tabIndex={-1}
          className="text-h2 font-medium tracking-tight text-strong"
        >
          {titles[step - 1]}
        </h1>
        <p className="text-pretty text-sub">{subtitle}</p>
      </div>
      <div className="flex flex-col gap-4">
        {step === 1 && (
          <AccountStep values={values} set={set} errors={fieldErrors} />
        )}
        {step === 2 && (
          <StoreStep values={values} set={set} errors={fieldErrors} />
        )}
        {step === 3 && (
          <CodeStep
            values={values}
            set={set}
            errors={fieldErrors}
            secondsLeft={countdown.left}
            onResend={() => void resend()}
            resending={resending}
          />
        )}
      </div>
      <FormAlert message={errors?.error} />
      <div className="flex gap-3">
        {step > 1 && (
          <Button
            type="button"
            variant="secondary"
            size="lg"
            onClick={() => {
              setErrors(null);
              setStep((step - 1) as 1 | 2);
            }}
          >
            <ArrowLeft aria-hidden="true" />
            Voltar
          </Button>
        )}
        <Button type="submit" size="lg" fullWidth loading={pending}>
          {pending ? "Aguarde…" : submitLabels[step - 1]}
        </Button>
      </div>
      <p className="text-center text-body-md text-sub">
        Já tem conta?{" "}
        <Link
          href="/login"
          className="font-medium text-link underline underline-offset-4"
        >
          Entrar
        </Link>
      </p>
    </form>
  );
}
