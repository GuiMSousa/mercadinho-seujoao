/**
 * KPI tile: label, big tabular value (R$ by default), optional delta vs previous period.
 * @startingPoint section="Display" subtitle="KPI tiles for faturamento, CMV, margem" viewport="700x200"
 */
export interface StatCardProps {
  label: React.ReactNode;
  value: number|string;
  /** render value through <Money>; false for counts (itens, lotes) */
  money?: boolean;
  /** percent, e.g. 8.2 or -3 */
  delta?: number;
  deltaLabel?: string;
  icon?: string;
  footer?: React.ReactNode;
  hidden?: boolean;
  action?: React.ReactNode;
  style?: React.CSSProperties;
}
export declare function StatCard(props: StatCardProps): JSX.Element;
