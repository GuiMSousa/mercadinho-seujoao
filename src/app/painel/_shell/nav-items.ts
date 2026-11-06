import {
  ChartColumn,
  LayoutDashboard,
  Package,
  Settings,
  Truck,
  ShoppingCart,
  Wallet,
  Warehouse,
  Users,
  type LucideIcon,
} from "lucide-react";

export type NavItem = { href: string; label: string; icon: LucideIcon };

/** Future subprojects add their entries here. */
export const NAV_ITEMS: NavItem[] = [
  { href: "/painel", label: "Painel", icon: LayoutDashboard },
  // Outside the panel shell: the sale screen is full-screen and open to operators too.
  { href: "/caixa", label: "Frente de caixa", icon: ShoppingCart },
  { href: "/painel/produtos", label: "Produtos", icon: Package },
  { href: "/painel/estoque", label: "Estoque", icon: Warehouse },
  { href: "/painel/fornecedores", label: "Fornecedores", icon: Truck },
  { href: "/painel/caixa", label: "Caixa diário", icon: Wallet },
  { href: "/painel/relatorios", label: "Relatórios", icon: ChartColumn },
  { href: "/painel/usuarios", label: "Usuários", icon: Users },
  { href: "/painel/configuracoes", label: "Configurações", icon: Settings },
];

/** Exact match for the panel home so it is not active on every sub-page. */
export const isActive = (href: string, pathname: string) =>
  href === "/painel"
    ? pathname === href
    : pathname === href || pathname.startsWith(`${href}/`);
