import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { SESSION_COOKIE } from "@/contracts/auth";
import { readSession } from "@/domains/auth/sessions";
import { getStore } from "@/domains/store/service";
import { getTheme } from "../../theme";
import { SecurityCard } from "./security-card";
import { Card } from "@ds/components/card";
import { StoreForm } from "./store-form";

export const metadata: Metadata = { title: "Configurações — Mkt Control" };

export default async function SettingsPage() {
  const [session, store] = await Promise.all([
    cookies().then((jar) => readSession(jar.get(SESSION_COOKIE)?.value)),
    getStore(),
  ]);
  if (!session) notFound();
  if (!store) return <NoStore />;
  return (
    <div className="mx-auto grid max-w-350 grid-cols-[repeat(auto-fit,minmax(min(100%,25rem),1fr))] items-start gap-6">
      <StoreForm store={store} />
      <SecurityCard
        email={session.user.email}
        store={store}
        initialTheme={await getTheme()}
      />
    </div>
  );
}

/** Accounts made from the command line have no store; the store is created by the first sign-up. */
export function NoStore() {
  return (
    <div className="mx-auto max-w-350">
      <Card
        title="Dados da loja"
        subtitle="Cadastre os dados da loja para continuar."
      >
        <p className="text-pretty text-sub">
          Ainda não há uma loja neste sistema. Saia da conta e use “Criar conta
          da loja” na tela de entrada; em desenvolvimento, rode npm run db:seed.
        </p>
      </Card>
    </div>
  );
}
