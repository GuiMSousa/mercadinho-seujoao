import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { SESSION_COOKIE } from "@/contracts/auth";
import { readSession } from "@/domains/auth/sessions";
import { getStore } from "@/domains/store/service";
import { getTheme } from "../../theme";
import { SecurityCard } from "./security-card";
import { StoreForm } from "./store-form";

export const metadata: Metadata = { title: "Configurações — Mkt Control" };

export default async function SettingsPage() {
  const [session, store] = await Promise.all([
    cookies().then((jar) => readSession(jar.get(SESSION_COOKIE)?.value)),
    getStore(),
  ]);
  if (!session || !store) notFound();
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
