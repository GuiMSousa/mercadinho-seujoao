/** White surface with 16px radius, hairline border and soft shadow; optional header row with title + actions. */
export interface CardProps {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  /** right side of header, e.g. <IconButton icon="more-horizontal"/> */
  actions?: React.ReactNode;
  padding?: string|number;
  as?: 'section'|'div'|'article'|'aside';
  children?: React.ReactNode;
  style?: React.CSSProperties;
  bodyStyle?: React.CSSProperties;
}
export declare function Card(props: CardProps): JSX.Element;
