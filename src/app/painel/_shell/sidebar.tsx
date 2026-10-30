"use client";

import { Store } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@ds/lib/cn";
import { LogoutButton } from "./logout-button";
import { NAV_ITEMS, isActive } from "./nav-items";

export type ShellProps = { storeName: string; userName: string };

const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

/** Brand, navigation and user footer; shared by the desktop sidebar and the mobile drawer. */
export function SidebarContent({
  storeName,
  userName,
  onNavigate,
}: ShellProps & { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <div className="flex h-full flex-col gap-4 p-3">
      <div className="flex items-center gap-2.5 rounded-lg border border-border px-2 py-1.5">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-sm bg-primary text-primary-foreground">
          <Store aria-hidden="true" className="size-4.5" />
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="text-caption text-sub">Mkt Control</span>
          <span className="truncate text-body-sm font-medium text-strong">
            {storeName}
          </span>
        </span>
      </div>
      <nav aria-label="Principal" className="min-h-0 flex-1">
        <ul className="flex flex-col gap-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = isActive(href, pathname);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  onClick={onNavigate}
                  className={cn(
                    "flex h-control-md items-center gap-3 rounded-md px-3 text-body-lg font-medium text-sub transition-colors duration-(--dur-fast) hover:bg-surface-hover",
                    active &&
                      "bg-selected-bg text-selected-fg hover:bg-selected-bg",
                  )}
                >
                  <Icon aria-hidden="true" className="size-5" />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="flex items-center gap-2.5 rounded-lg bg-surface-sunken p-3">
        <span
          aria-hidden="true"
          className="flex size-8 shrink-0 items-center justify-center rounded-full bg-selected-bg text-body-sm font-semibold text-selected-fg"
        >
          {initials(userName)}
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-body-sm font-medium text-strong">
            {userName}
          </span>
          <span className="text-caption text-sub">Administrador</span>
        </span>
        <LogoutButton />
      </div>
    </div>
  );
}

export function Sidebar(props: ShellProps) {
  return (
    <aside className="hidden w-62 shrink-0 border-r border-border bg-surface-card shell:block">
      <SidebarContent {...props} />
    </aside>
  );
}
