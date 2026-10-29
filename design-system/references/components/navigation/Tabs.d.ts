export interface TabItem { value: string; label: React.ReactNode; icon?: string; count?: number; }
/** Segmented control: grey track, near-black active pill (reference "All / Chats / Reports"). Arrow keys move selection. */
export interface TabsProps {
  items: TabItem[];
  value: string;
  onChange?: (value: string) => void;
  /** "counter" = 60px, for payment method on the PDV */
  size?: 'sm'|'md'|'counter';
  fullWidth?: boolean;
  ariaLabel?: string;
  style?: React.CSSProperties;
}
export declare function Tabs(props: TabsProps): JSX.Element;
