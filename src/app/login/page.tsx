import type { Metadata } from "next";
import { Store } from "lucide-react";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Entrar — Mkt Control" };

export default function LoginPage() {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-8 px-4 py-12">
      <header className="flex flex-col gap-2">
        <p className="flex items-center gap-2 font-medium text-muted-foreground">
          <Store aria-hidden="true" className="size-5" />
          Mkt Control
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">Entrar</h1>
      </header>
      <LoginForm />
    </main>
  );
}
