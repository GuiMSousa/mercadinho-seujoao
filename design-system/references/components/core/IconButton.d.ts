/** Square icon-only button. Always pass `label` (used as aria-label and tooltip). */
export interface IconButtonProps {
  icon: string;
  label: string;
  variant?: 'secondary'|'ghost'|'primary'|'brand'|'danger';
  size?: 'sm'|'md'|'lg'|'counter';
  disabled?: boolean;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  style?: React.CSSProperties;
}
export declare function IconButton(props: IconButtonProps): JSX.Element;
