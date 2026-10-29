/**
 * Touch numeric keypad (72px keys) for amounts on the counter. Value is a digit string in cents ("1250" = R$ 12,50).
 * @startingPoint section="Counter" subtitle="Touch keypad for troco, sangria and fechamento cego" viewport="700x380"
 */
export interface KeypadProps {
  /** digits only, interpreted as cents */
  value: string;
  onChange: (digits: string) => void;
  maxLength?: number;
  style?: React.CSSProperties;
}
export declare function Keypad(props: KeypadProps): JSX.Element;
