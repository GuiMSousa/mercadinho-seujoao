import type { Metadata, Viewport } from "next";
import { fontSans } from "@ds/fonts";
import { ToastProvider } from "@ds/components/toast";
import { ServiceWorker } from "./_components/service-worker";
import { getTheme } from "./theme";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mkt Control",
  description: "Controle de vendas e estoque para pequenos comércios.",
  manifest: "/manifest.json",
  icons: { apple: "/icons/apple-touch-icon.png" },
  appleWebApp: { capable: true, title: "Mkt Control" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Meta tags cannot read CSS tokens: these repeat --bg-app of each theme.
  themeColor: [
    // eslint-disable-next-line no-restricted-syntax
    { media: "(prefers-color-scheme: light)", color: "#f5f7fa" },
    // eslint-disable-next-line no-restricted-syntax
    { media: "(prefers-color-scheme: dark)", color: "#0a0d14" },
  ],
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      data-theme={await getTheme()}
      className={`${fontSans.variable} h-full`}
    >
      <body className="flex min-h-full flex-col">
        <ServiceWorker />
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
