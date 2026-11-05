"use client";

import Link from "next/link";
import { LayoutDashboard, Wallet } from "lucide-react";
import type { OpenCashSession } from "@/contracts/cash";
import { ThemeControl } from "@/app/_components/theme-control";
import { formatDateTime } from "@/app/painel/_lib/format";
import { LogoutButton } from "@/app/painel/_shell/logout-button";
import { Button } from "@ds/components/button";

export function PdvHeader({
  storeName,
  userName,
  isAdmin,
  initialTheme,
  cash,
  onCash,
}: {
  storeName: string;
  userName: string;
  isAdmin: boolean;
  initialTheme?: "light" | "dark";
  cash: OpenCashSession | null;
  onCash: () => void;
}) {
  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border bg-surface-card px-4 sm:px-6">
      <div className="flex min-w-0 flex-1 flex-col">
        <h1 className="truncate text-h3 font-medium tracking-tight text-strong">
          Frente de caixa
        </h1>
        <p className="truncate text-body-md text-sub">
          {storeName} · {userName} ·{" "}
          {cash
            ? `Caixa aberto em ${formatDateTime(cash.openedAt)}`
            : "Caixa fechado"}
        </p>
      </div>
      {cash && (
        <Button variant="secondary" onClick={onCash}>
          <Wallet aria-hidden="true" />
          Caixa
        </Button>
      )}
      {isAdmin && (
        <Button
          variant="ghost"
          nativeButton={false}
          render={<Link href="/painel" />}
        >
          <LayoutDashboard aria-hidden="true" />
          Painel
        </Button>
      )}
      <ThemeControl variant="icon" initialTheme={initialTheme} />
      <LogoutButton />
    </header>
  );
}
