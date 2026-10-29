/** Small bordered label/filter chip (categoria, lote, filtro ativo). Becomes a toggle button when `onClick` is passed. */
export interface TagProps {
  icon?: string;
  selected?: boolean;
  onClick?: () => void;
  onRemove?: () => void;
  children: React.ReactNode;
  style?: React.CSSProperties;
}
export declare function Tag(props: TagProps): JSX.Element;
