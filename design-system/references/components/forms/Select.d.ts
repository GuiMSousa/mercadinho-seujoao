/** Native select with Mkt Control styling (chevron, hairline border, blue focus halo). */
export interface SelectProps {
  label?: string;
  options: Array<string|{value:string;label:string}>;
  value?: string;
  defaultValue?: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  size?: 'sm'|'md'|'lg'|'counter';
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  style?: React.CSSProperties;
}
export declare function Select(props: SelectProps): JSX.Element;
