"use client";

import { usePathname } from "next/navigation";
import { ThemeControl } from "@/app/_components/theme-control";
import { MobileDrawer } from "./mobile-drawer";
import { NAV_ITEMS, isActive } from "./nav-items";
import type { ShellProps } from "./sidebar";

export function Topbar({
  initialTheme,
  ...shell
}: ShellProps & { initialTheme?: "light" | "dark" }) {
  const pathname = usePathname();
  const title =
    NAV_ITEMS.find((item) => isActive(item.href, pathname))?.label ?? "Painel";
  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border bg-surface-card px-6">
      <MobileDrawer {...shell} />
      <h1 className="min-w-0 flex-1 truncate text-h3 font-medium tracking-tight text-strong">
        {title}
      </h1>
      <ThemeControl variant="icon" initialTheme={initialTheme} />
    </header>
  );
}
