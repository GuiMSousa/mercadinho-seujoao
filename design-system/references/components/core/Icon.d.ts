/** Hugeicons stroke-rounded glyph. Names match files in assets/icons (e.g. "shopping-cart-01"). */
export interface IconProps {
  name: 'home-01'|'search-01'|'view'|'view-off'|'notification-01'|'add-01'|'remove-01'|'cancel-01'|'arrow-down-01'|'arrow-up-01'|'arrow-right-01'|'arrow-left-01'|'arrow-up-right-01'|'arrow-down-left-01'|'settings-01'|'alert-02'|'alert-circle'|'information-circle'|'invoice-01'|'invoice-03'|'calendar-03'|'credit-card'|'money-01'|'money-03'|'money-bag-02'|'wallet-01'|'logout-01'|'filter-horizontal'|'pencil-edit-01'|'delete-02'|'download-01'|'upload-01'|'package'|'shopping-cart-01'|'shopping-basket-01'|'store-01'|'bar-code-01'|'qr-code'|'chart-line-data-01'|'chart-histogram'|'analytics-01'|'user'|'user-group'|'lock-key'|'tick-02'|'checkmark-circle-02'|'clock-01'|'delivery-truck-01'|'coins-01'|'cash-01'|'money-receive-01'|'money-send-01'|'menu-01'|'more-horizontal'|'unfold-more'|'file-import'|'printer'|'calculator-01'|'percent'|'tag-01'|'dashboard-square-01'|'archive-01'|'arrow-data-transfer-horizontal'|'exchange-01'|'sorting-05'|'note-01'|'moon-02'|'sun-03'|'wifi-01'|'wifi-off-01'|'calendar-01'|'time-04'|'dollar-01'|'package-out-of-stock'|'package-receive'|'layers-01'|'clipboard';
  /** px, default 20 */
  size?: number;
  color?: string;
  /** Accessible label; omit for decorative icons */
  title?: string;
  style?: React.CSSProperties;
}
export declare function Icon(props: IconProps): JSX.Element;
