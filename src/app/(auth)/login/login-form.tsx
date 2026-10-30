"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { Button } from "@ds/components/button";
import { Checkbox } from "@ds/components/checkbox";
import { Input } from "@ds/components/input";
import { postJson, useFocusOnError, type FormErrors } from "../auth-client";
import { FormAlert } from "../form-alert";
import { PasswordField } from "../password-field";

const DEMO_PASSWORD = "mkt12345";
const demoUsers = [
  { label: "Administrador", email: "ana@bompreco.com.br" },
  { label: "Operador de caixa", email: "carlos@bompreco.com.br" },
];

export function LoginForm({
  canSignup,
  showDemo,
}: {
  canSignup: boolean;
  showDemo: boolean;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [errors, setErrors] = useState<FormErrors | null>(null);
  const [pending, setPending] = useState(false);
  const [remember, setRemember] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  useFocusOnError(formRef, errors);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const fields: Record<string, string> = {};
    if (!email.trim()) fields.email = "Informe seu e-mail.";
    if (!password) fields.password = "Informe sua senha.";
    if (Object.keys(fields).length) return setErrors({ fields });
    setPending(true);
    setErrors(null);
    const result = await postJson("/api/auth/login", {
      email,
      password,
      remember,
    });
    if (result.ok) {
      router.replace("/painel");
      router.refresh();
      return;
    }
    setErrors(result.errors);
    setPending(false);
  }

  return (
    // method/action matter only if JS has not hydrated: credentials then go in a POST body,
    // never in the URL (a bare <form> would GET /login?email=...&password=...).
    <form
      ref={formRef}
      method="post"
      action="/api/auth/login"
      noValidate
      onSubmit={(event) => void submit(event)}
      className="flex flex-col gap-5"
    >
      <div className="flex flex-col gap-1.5">
        <h1 className="text-h2 font-medium tracking-tight text-strong">
          Entrar no painel
        </h1>
        <p className="text-sub">Acesso do administrador da loja.</p>
      </div>
      <Input
        name="email"
        type="email"
        label="E-mail"
        size="lg"
        autoComplete="username"
        placeholder="voce@sualoja.com.br"
        maxLength={254}
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        error={errors?.fields.email}
      />
      <PasswordField
        name="password"
        label="Senha"
        autoComplete="current-password"
        maxLength={256}
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        error={errors?.fields.password}
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Checkbox
          label="Manter conectado"
          checked={remember}
          onCheckedChange={setRemember}
        />
        <Link
          href="/recuperar"
          className="text-body-md font-medium text-link underline underline-offset-4"
        >
          Esqueci minha senha
        </Link>
      </div>
      <FormAlert message={errors?.error} />
      <Button type="submit" size="lg" fullWidth loading={pending}>
        {pending ? "Entrando…" : "Entrar"}
      </Button>
      {canSignup && (
        <>
          <div
            aria-hidden="true"
            className="flex items-center gap-3 text-caption text-soft"
          >
            <span className="h-px flex-1 bg-border" />
            ou
            <span className="h-px flex-1 bg-border" />
          </div>
          <Button
            render={<Link href="/cadastro" />}
            nativeButton={false}
            variant="secondary"
            size="lg"
            fullWidth
          >
            Criar conta da loja
          </Button>
        </>
      )}
      {showDemo && (
        <div className="flex flex-wrap justify-center gap-2 text-caption text-sub">
          <span>Demonstração:</span>
          {demoUsers.map((demo) => (
            <button
              key={demo.email}
              type="button"
              className="cursor-pointer text-link underline underline-offset-4"
              onClick={() => {
                setEmail(demo.email);
                setPassword(DEMO_PASSWORD);
              }}
            >
              {demo.label}
            </button>
          ))}
        </div>
      )}
    </form>
  );
}
