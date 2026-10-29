/** Brazilian Real amount with tabular figures, small "R$" and muted cents (the reference "$32,940.093" motif). */
export interface MoneyProps {
  /** amount in reais (already rounded to the cent upstream) */
  value: number;
  size?: 'sm'|'md'|'lg'|'xl'|'display'|'counter';
  currency?: boolean;
  /** prefix "+" for positive values */
  signed?: boolean;
  /** in = entrada (blue), out = saída (red), margin = lucro (green) */
  tone?: 'in'|'out'|'margin';
  mutedCents?: boolean;
  /** shows R$ •••••• (eye toggle in topbar) */
  hidden?: boolean;
  style?: React.CSSProperties;
}
export declare function Money(props: MoneyProps): JSX.Element;
