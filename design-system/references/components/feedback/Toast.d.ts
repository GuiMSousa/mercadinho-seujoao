/** Dark floating notification with colored status icon. Place bottom-center on mobile, bottom-right on desktop. */
export interface ToastProps {
  tone?: 'success'|'danger'|'warning'|'info';
  title: React.ReactNode;
  message?: React.ReactNode;
  action?: React.ReactNode;
  onClose?: () => void;
  style?: React.CSSProperties;
}
export declare function Toast(props: ToastProps): JSX.Element;
