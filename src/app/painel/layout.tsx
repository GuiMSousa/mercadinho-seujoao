import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE } from "@/contracts/auth";
import { readSession } from "@/domains/auth/sessions";
import { getStore } from "@/domains/store/service";
import { getTheme } from "../theme";
import { Sidebar } from "./_shell/sidebar";
import { Topbar } from "./_shell/topbar";

export default async function PanelLayout({
  children,
}: LayoutProps<"/painel">) {
  const session = await readSession(
    (await cookies()).get(SESSION_COOKIE)?.value,
  );
  if (session?.user.role !== "ADMIN") redirect("/login");
  const shell = {
    storeName: (await getStore())?.name ?? "Minha loja",
    userName: session.user.name,
  };
  return (
    <div className="flex h-dvh overflow-hidden bg-app">
      <Sidebar {...shell} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar {...shell} initialTheme={await getTheme()} />
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
