/** Small dark label shown on hover/focus of its child. Desktop helper only — never hide essential info in it (touch has no hover). */
export interface TooltipProps {
  content: React.ReactNode;
  placement?: 'top'|'bottom';
  children: React.ReactNode;
}
export declare function Tooltip(props: TooltipProps): JSX.Element;
