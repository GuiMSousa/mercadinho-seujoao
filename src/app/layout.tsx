import type { Metadata } from "next";
import { fontSans } from "@ds/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mkt Control",
  description: "Controle de vendas e estoque para pequenos comércios.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${fontSans.variable} h-full`}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
