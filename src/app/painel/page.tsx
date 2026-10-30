import type { Metadata } from "next";
import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/contracts/auth";
import { readSession } from "@/domains/auth/sessions";
import { Card } from "@ds/components/card";
import { greeting, longDate } from "./_lib/greeting";

export const metadata: Metadata = { title: "Painel — Mkt Control" };

export default async function PanelHome() {
  const session = await readSession(
    (await cookies()).get(SESSION_COOKIE)?.value,
  );
  const now = new Date();
  return (
    <div className="mx-auto flex max-w-350 flex-col gap-6">
      <div className="flex flex-col gap-1">
        <p className="text-body-sm text-sub first-letter:uppercase">
          {longDate(now)}
        </p>
        <h2 className="text-h1 font-medium tracking-tight text-strong">
          {greeting(now, session?.user.name ?? "")}
        </h2>
      </div>
      <Card
        title="Em construção"
        subtitle="Vendas, estoque e caixa chegam nas próximas entregas."
      >
        <p className="text-body-md text-sub">
          Por enquanto, gerencie a equipe em Usuários e os dados da loja em
          Configurações.
        </p>
      </Card>
    </div>
  );
}
