/**
 * Text button. "primary" is the near-black default; "brand" (blue) is reserved for the single most important action on a screen (Finalizar venda, Abrir caixa).
 * @startingPoint section="Core" subtitle="Buttons in every variant and the 60px counter size" viewport="700x320"
 */
export interface ButtonProps {
  variant?: 'primary'|'brand'|'secondary'|'soft'|'ghost'|'danger';
  /** "counter" = 60px tall, 22px text — required on Vendas, Caixa and Entrada */
  size?: 'sm'|'md'|'lg'|'counter';
  leadingIcon?: string;
  trailingIcon?: string;
  fullWidth?: boolean;
  disabled?: boolean;
  type?: 'button'|'submit'|'reset';
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}
export declare function Button(props: ButtonProps): JSX.Element;
