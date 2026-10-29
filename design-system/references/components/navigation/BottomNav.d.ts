export interface BottomNavItem { value: string; label: string; icon: string; }
/** Mobile/PWA floating tab bar: dark capsule, active item expands into a blue pill with its label (reference "Apps Components"). */
export interface BottomNavProps {
  items: BottomNavItem[];
  value: string;
  onSelect?: (value: string) => void;
  style?: React.CSSProperties;
}
export declare function BottomNav(props: BottomNavProps): JSX.Element;
