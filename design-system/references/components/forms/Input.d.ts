/** Text / number field with optional label, prefix (R$), leading icon, hint and error. */
export interface InputProps {
  label?: string;
  hint?: string;
  error?: string;
  /** e.g. "R$" */
  prefix?: string;
  /** e.g. "un", "kg" */
  suffix?: string;
  leadingIcon?: string;
  size?: 'sm'|'md'|'lg'|'counter';
  /** right-aligned tabular figures, for money and quantities */
  numeric?: boolean;
  id?: string;
  value?: string|number;
  defaultValue?: string|number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: string;
  inputMode?: 'text'|'decimal'|'numeric'|'search';
  disabled?: boolean;
  readOnly?: boolean;
  autoFocus?: boolean;
  style?: React.CSSProperties;
  inputStyle?: React.CSSProperties;
}
export declare function Input(props: InputProps): JSX.Element;
