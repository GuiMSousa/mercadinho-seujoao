/** Square checkbox, blue when checked. Controlled (`checked`) or uncontrolled (`defaultChecked`). */
export interface CheckboxProps {
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean, e: React.ChangeEvent<HTMLInputElement>) => void;
  label?: React.ReactNode;
  disabled?: boolean;
  /** box size in px, default 16; use 24 on counter screens */
  size?: number;
  id?: string;
  style?: React.CSSProperties;
}
export declare function Checkbox(props: CheckboxProps): JSX.Element;
