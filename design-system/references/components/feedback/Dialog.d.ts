/** Modal over a blurred dark scrim. Esc and scrim-click close; first field gets focus. */
export interface DialogProps {
  open: boolean;
  onClose?: () => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  /** buttons, right-aligned */
  footer?: React.ReactNode;
  width?: number;
  style?: React.CSSProperties;
}
export declare function Dialog(props: DialogProps): JSX.Element|null;
