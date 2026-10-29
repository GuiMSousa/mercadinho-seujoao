/** Status pill: tinted background + darker text of the same hue. Text must always state the status (never color alone). */
export interface BadgeProps {
  tone?: 'success'|'danger'|'warning'|'info'|'neutral';
  dot?: boolean;
  size?: 'sm'|'md';
  children: React.ReactNode;
  style?: React.CSSProperties;
}
export declare function Badge(props: BadgeProps): JSX.Element;
