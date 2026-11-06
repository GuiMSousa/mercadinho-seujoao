import { getStore } from "@/domains/store/service";
import { countStockAlerts } from "@/domains/suppliers/service";
import { getTheme } from "../theme";
import { requireAdmin } from "./_lib/require-admin";
import { Sidebar } from "./_shell/sidebar";
import { Topbar } from "./_shell/topbar";

export default async function PanelLayout({
  children,
}: LayoutProps<"/painel">) {
  const session = await requireAdmin();
  const [store, stockAlerts, theme] = await Promise.all([
    getStore(),
    countStockAlerts(),
    getTheme(),
  ]);
  const shell = {
    storeName: store?.name ?? "Minha loja",
    userName: session.user.name,
  };
  return (
    <div className="flex h-dvh overflow-hidden bg-app">
      <Sidebar {...shell} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar {...shell} initialTheme={theme} stockAlerts={stockAlerts} />
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
