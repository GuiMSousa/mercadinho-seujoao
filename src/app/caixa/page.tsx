import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE } from "@/contracts/auth";
import { readSession } from "@/domains/auth/sessions";
import { getStore } from "@/domains/store/service";
import { getTheme } from "../theme";
import { PdvView } from "./pdv-view";

export const metadata: Metadata = { title: "Frente de caixa — Mkt Control" };

export default async function CashierPage() {
  // Both profiles sell. The proxy only saw the cookie, so the session is read again here.
  const session = await readSession(
    (await cookies()).get(SESSION_COOKIE)?.value,
  );
  if (!session) redirect("/login");
  const store = await getStore();
  return (
    <PdvView
      store={{
        name: store?.name ?? "Minha loja",
        document: store?.document ?? "",
      }}
      userName={session.user.name}
      isAdmin={session.user.role === "ADMIN"}
      initialTheme={await getTheme()}
    />
  );
}
