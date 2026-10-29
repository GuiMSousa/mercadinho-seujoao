export interface SidebarItem { value: string; label: string; icon: string; badge?: number|string; badgeTone?: 'default'|'danger'; }
export interface SidebarSection { title?: string; items: SidebarItem[]; }
/** Desktop left navigation: white column, grouped items, grey pill for the active page. */
export interface SidebarNavProps {
  sections: SidebarSection[];
  value: string;
  onSelect?: (value: string) => void;
  /** store switcher / brand row */
  header?: React.ReactNode;
  /** user + caixa status */
  footer?: React.ReactNode;
  style?: React.CSSProperties;
}
export declare function SidebarNav(props: SidebarNavProps): JSX.Element;
