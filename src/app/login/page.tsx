import type { Metadata } from "next";
import { Store } from "lucide-react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE } from "@/contracts/auth";
import { readSessionToken } from "@/domains/auth/session";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Entrar — Mkt Control" };

export default async function LoginPage() {
  // Already signed in: go to the app instead of showing the form again.
  if (await readSessionToken((await cookies()).get(SESSION_COOKIE)?.value))
    redirect("/");
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-8 px-4 py-12">
      <header className="flex flex-col gap-2">
        <p className="flex items-center gap-2 font-medium text-sub">
          <Store aria-hidden="true" className="size-5" />
          Mkt Control
        </p>
        <h1 className="text-h2 font-medium tracking-tight text-strong">
          Entrar
        </h1>
      </header>
      <LoginForm />
    </main>
  );
}
