"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@ds/components/button";
import { Input } from "@ds/components/input";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          username: form.get("username"),
          password: form.get("password"),
        }),
      });
      if (response.ok) {
        router.replace("/");
        router.refresh();
        return;
      }
      const body = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;
      setError(body?.error ?? "Não foi possível entrar.");
    } catch {
      setError("Sem conexão com o servidor.");
    } finally {
      setPending(false);
    }
  }

  return (
    // method/action matter only if JS has not hydrated: credentials then go in a POST body,
    // never in the URL (a bare <form> would GET /login?username=...&password=...).
    <form
      method="post"
      action="/api/auth/login"
      onSubmit={(event) => void submit(event)}
      className="flex flex-col gap-4"
      aria-describedby={error ? "login-error" : undefined}
    >
      <Input
        id="username"
        name="username"
        label="Usuário"
        size="lg"
        autoComplete="username"
        required
        maxLength={64}
      />
      <Input
        id="password"
        name="password"
        type="password"
        label="Senha"
        size="lg"
        autoComplete="current-password"
        required
        maxLength={256}
      />
      {error && (
        <p id="login-error" role="alert" className="text-danger-fg">
          {error}
        </p>
      )}
      <Button type="submit" size="lg" loading={pending}>
        {pending ? "Entrando…" : "Entrar"}
      </Button>
    </form>
  );
}
