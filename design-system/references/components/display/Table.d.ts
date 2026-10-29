export interface TableColumn<T=any> {
  key: string;
  label: React.ReactNode;
  align?: 'left'|'right'|'center';
  width?: number|string;
  wrap?: boolean;
  render?: (row: T) => React.ReactNode;
}
/** Data table: grey rounded header strip, hairline row dividers, tabular figures, hover tint. */
export interface TableProps<T=any> {
  columns: TableColumn<T>[];
  rows: T[];
  rowKey?: string;
  onRowClick?: (row: T) => void;
  dense?: boolean;
  empty?: React.ReactNode;
  caption?: string;
  style?: React.CSSProperties;
}
export declare function Table(props: TableProps): JSX.Element;
