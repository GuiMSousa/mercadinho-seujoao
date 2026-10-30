import type { Metadata } from "next";
import { fontSans } from "@ds/fonts";
import { ToastProvider } from "@ds/components/toast";
import { getTheme } from "./theme";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mkt Control",
  description: "Controle de vendas e estoque para pequenos comércios.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      data-theme={await getTheme()}
      className={`${fontSans.variable} h-full`}
    >
      <body className="flex min-h-full flex-col">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
