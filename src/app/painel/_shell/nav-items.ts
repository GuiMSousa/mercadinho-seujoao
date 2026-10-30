import {
  LayoutDashboard,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react";

export type NavItem = { href: string; label: string; icon: LucideIcon };

/** Future subprojects add their entries here. */
export const NAV_ITEMS: NavItem[] = [
  { href: "/painel", label: "Painel", icon: LayoutDashboard },
  { href: "/painel/usuarios", label: "Usuários", icon: Users },
  { href: "/painel/configuracoes", label: "Configurações", icon: Settings },
];

/** Exact match for the panel home so it is not active on every sub-page. */
export const isActive = (href: string, pathname: string) =>
  href === "/painel"
    ? pathname === href
    : pathname === href || pathname.startsWith(`${href}/`);
