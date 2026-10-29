/** Single radio option; group several with the same `name` and drive `checked` from parent state. */
export interface RadioProps {
  name: string;
  value: string;
  checked?: boolean;
  onChange?: (value: string, e: React.ChangeEvent<HTMLInputElement>) => void;
  label?: React.ReactNode;
  description?: React.ReactNode;
  disabled?: boolean;
  size?: number;
  style?: React.CSSProperties;
}
export declare function Radio(props: RadioProps): JSX.Element;
