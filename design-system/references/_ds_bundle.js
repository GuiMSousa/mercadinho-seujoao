/* @ds-bundle: {"format":4,"namespace":"MktControlDesignSystem_295891","components":[{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"Icon","sourcePath":"components/core/Icon.jsx"},{"name":"ICON_NAMES","sourcePath":"components/core/Icon.jsx"},{"name":"IconButton","sourcePath":"components/core/IconButton.jsx"},{"name":"ICONS","sourcePath":"components/core/iconData.js"},{"name":"Keypad","sourcePath":"components/counter/Keypad.jsx"},{"name":"Badge","sourcePath":"components/display/Badge.jsx"},{"name":"Card","sourcePath":"components/display/Card.jsx"},{"name":"Money","sourcePath":"components/display/Money.jsx"},{"name":"StatCard","sourcePath":"components/display/StatCard.jsx"},{"name":"Table","sourcePath":"components/display/Table.jsx"},{"name":"Tag","sourcePath":"components/display/Tag.jsx"},{"name":"Dialog","sourcePath":"components/feedback/Dialog.jsx"},{"name":"Toast","sourcePath":"components/feedback/Toast.jsx"},{"name":"Tooltip","sourcePath":"components/feedback/Tooltip.jsx"},{"name":"Checkbox","sourcePath":"components/forms/Checkbox.jsx"},{"name":"Input","sourcePath":"components/forms/Input.jsx"},{"name":"Radio","sourcePath":"components/forms/Radio.jsx"},{"name":"Select","sourcePath":"components/forms/Select.jsx"},{"name":"Switch","sourcePath":"components/forms/Switch.jsx"},{"name":"BottomNav","sourcePath":"components/navigation/BottomNav.jsx"},{"name":"SidebarNav","sourcePath":"components/navigation/SidebarNav.jsx"},{"name":"Tabs","sourcePath":"components/navigation/Tabs.jsx"}],"sourceHashes":{"components/core/Button.jsx":"a9d6cdf20247","components/core/Icon.jsx":"5c4726ed0c77","components/core/IconButton.jsx":"45fbe6cbf8b4","components/core/iconData.js":"67572b05a19d","components/core/useInteraction.js":"d00d3e0e5011","components/counter/Keypad.jsx":"36b22c7b4bd9","components/display/Badge.jsx":"46f8daa8124b","components/display/Card.jsx":"f70be022b0f6","components/display/Money.jsx":"9f72f0b6002f","components/display/StatCard.jsx":"bd7b39068c25","components/display/Table.jsx":"b26c62af0347","components/display/Tag.jsx":"6a63e7d70adb","components/feedback/Dialog.jsx":"184ede5aef75","components/feedback/Toast.jsx":"a6e728a8c0c3","components/feedback/Tooltip.jsx":"a9733cc443c3","components/forms/Checkbox.jsx":"1111d40e8a53","components/forms/Input.jsx":"414140f6fdf9","components/forms/Radio.jsx":"91e13b49c4e8","components/forms/Select.jsx":"48dd12f583d7","components/forms/Switch.jsx":"ff875180eeff","components/navigation/BottomNav.jsx":"7a79e6068694","components/navigation/SidebarNav.jsx":"0dc86ee05dc5","components/navigation/Tabs.jsx":"d757f9ca23e2","ui_kits/mkt-control/App.jsx":"3db695f3cd3c","ui_kits/mkt-control/Caixa.jsx":"afc40154539c","ui_kits/mkt-control/Estoque.jsx":"ac783782c946","ui_kits/mkt-control/Login.jsx":"86265e674075","ui_kits/mkt-control/Painel.jsx":"8de92e0420ed","ui_kits/mkt-control/Shell.jsx":"80a92e9d4ae3","ui_kits/mkt-control/Vendas.jsx":"b84f6a276789","ui_kits/mkt-control/data.js":"bacd8944e0b7","ui_kits/mkt-control/helpers.jsx":"a936df0ebd31"},"inlinedExternals":[],"unexposedExports":[{"name":"centsToBRL","sourcePath":"components/counter/Keypad.jsx"},{"name":"formatBRL","sourcePath":"components/display/Money.jsx"},{"name":"useInteraction","sourcePath":"components/core/useInteraction.js"}]} */

(() => {

const __ds_ns = (window.MktControlDesignSystem_295891 = window.MktControlDesignSystem_295891 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/core/iconData.js
try { (() => {
// Hugeicons free stroke-rounded set (24px grid, 1.5 stroke). Source: @hugeicons/core-free-icons@4.3.5
const ICONS = {
  "add-01": "<path d=\"M12.001 5.00003V19.002\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path><path d=\"M19.002 12.002L4.99998 12.002\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path>",
  "alert-02": "<path d=\"M13.9248 21H10.0752C5.44476 21 3.12955 21 2.27636 19.4939C1.42317 17.9879 2.60736 15.9914 4.97574 11.9985L6.90057 8.75333C9.17559 4.91778 10.3131 3 12 3C13.6869 3 14.8244 4.91777 17.0994 8.75332L19.0243 11.9985C21.3926 15.9914 22.5768 17.9879 21.7236 19.4939C20.8704 21 18.5552 21 13.9248 21Z\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path><path d=\"M12 9V13\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path><path d=\"M12.125 16.75H12M12.25 16.75C12.25 16.8881 12.1381 17 12 17C11.8619 17 11.75 16.8881 11.75 16.75C11.75 16.6119 11.8619 16.5 12 16.5C12.1381 16.5 12.25 16.6119 12.25 16.75Z\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path>",
  "alert-circle": "<circle cx=\"12\" cy=\"12\" r=\"10\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></circle><path d=\"M12 8V12\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path><path d=\"M12.125 15.75H12M12.25 15.75C12.25 15.8881 12.1381 16 12 16C11.8619 16 11.75 15.8881 11.75 15.75C11.75 15.6119 11.8619 15.5 12 15.5C12.1381 15.5 12.25 15.6119 12.25 15.75Z\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path>",
  "analytics-01": "<path d=\"M7 17L7 13\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-width=\"1.5\"></path><path d=\"M12 17L12 7\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-width=\"1.5\"></path><path d=\"M17 17L17 11\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-width=\"1.5\"></path><path d=\"M2.5 12C2.5 7.52166 2.5 5.28249 3.89124 3.89124C5.28249 2.5 7.52166 2.5 12 2.5C16.4783 2.5 18.7175 2.5 20.1088 3.89124C21.5 5.28249 21.5 7.52166 21.5 12C21.5 16.4783 21.5 18.7175 20.1088 20.1088C18.7175 21.5 16.4783 21.5 12 21.5C7.52166 21.5 5.28249 21.5 3.89124 20.1088C2.5 18.7175 2.5 16.4783 2.5 12Z\" stroke=\"currentColor\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path>",
  "archive-01": "<path d=\"M10.0001 17V7C10.0001 5.11438 10.0001 4.17157 9.41427 3.58579C8.82849 3 7.88568 3 6.00005 3C4.11444 3 3.17163 3 2.58584 3.58578C2.00006 4.17157 2.00005 5.11437 2.00004 6.99998L2 17C1.99999 18.8856 1.99999 19.8284 2.58577 20.4142C3.17156 21 4.11438 21 6.00003 21C7.88567 21 8.82849 21 9.41427 20.4142C10.0001 19.8284 10.0001 18.8856 10.0001 17Z\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path><path d=\"M21.4558 15.7091L19.0473 7.19224C18.572 5.51165 18.3343 4.67135 17.6838 4.2617C17.6312 4.22861 17.5772 4.19796 17.5218 4.16986C16.8358 3.82199 15.9877 4.04691 14.2916 4.49674C12.5529 4.95783 11.6836 5.18838 11.2632 5.84738C11.2293 5.90053 11.198 5.95524 11.1693 6.01134C10.8134 6.70684 11.057 7.5682 11.5442 9.2909L13.9527 17.8078C14.428 19.4884 14.6657 20.3287 15.3162 20.7383C15.3688 20.7714 15.4228 20.802 15.4782 20.8301C16.1642 21.178 17.0123 20.9531 18.7084 20.5033C20.4471 20.0422 21.3164 19.8116 21.7368 19.1526C21.7707 19.0995 21.802 19.0448 21.8307 18.9887C22.1866 18.2932 21.943 17.4318 21.4558 15.7091Z\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path><path d=\"M2 7H10\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path><path d=\"M12 9.00019L19 7\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path><path d=\"M6.125 17H6M6.25 17C6.25 17.1381 6.13807 17.25 6 17.25C5.86193 17.25 5.75 17.1381 5.75 17C5.75 16.8619 5.86193 16.75 6 16.75C6.13807 16.75 6.25 16.8619 6.25 17Z\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path><path d=\"M17.7307 16.75H17.6057M17.8557 16.75C17.8557 16.8881 17.7437 17 17.6057 17C17.4676 17 17.3557 16.8881 17.3557 16.75C17.3557 16.6119 17.4676 16.5 17.6057 16.5C17.7437 16.5 17.8557 16.6119 17.8557 16.75Z\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path>",
  "arrow-data-transfer-horizontal": "<path d=\"M19 9H6.65856C5.65277 9 5.14987 9 5.02472 8.69134C4.89957 8.38268 5.25517 8.01942 5.96637 7.29289L8.21091 5\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path><path d=\"M5 15H17.3414C18.3472 15 18.8501 15 18.9753 15.3087C19.1004 15.6173 18.7448 15.9806 18.0336 16.7071L15.7891 19\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path>",
  "arrow-down-01": "<path d=\"M18 9.00005C18 9.00005 13.5811 15 12 15C10.4188 15 6 9 6 9\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path>",
  "arrow-down-left-01": "<path d=\"M15 17.3497C15 17.3497 8.06166 17.8924 7.08461 16.9154C6.10755 15.9383 6.65037 9 6.65037 9M7.5 16.5L17.5 6.5\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path>",
  "arrow-left-01": "<path d=\"M15 6C15 6 9.00001 10.4189 9 12C8.99999 13.5812 15 18 15 18\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path>",
  "arrow-right-01": "<path d=\"M9.00005 6C9.00005 6 15 10.4189 15 12C15 13.5812 9 18 9 18\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path>",
  "arrow-up-01": "<path d=\"M17.9998 15C17.9998 15 13.5809 9.00001 11.9998 9C10.4187 8.99999 5.99985 15 5.99985 15\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path>",
  "arrow-up-right-01": "<path d=\"M9 6.65032C9 6.65032 15.9383 6.10759 16.9154 7.08463C17.8924 8.06167 17.3496 15 17.3496 15M16.5 7.5L6.5 17.5\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path>",
  "bar-code-01": "<path d=\"M3 4.5V20.5\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path><path d=\"M7.5 4.5V16.5\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path><path d=\"M12 4.5V16.5\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path><path d=\"M16.5 4.5V16.5\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path><path d=\"M21 4.5V20.5\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path><path d=\"M7.625 20.25H7.5M7.75 20.25C7.75 20.3881 7.63807 20.5 7.5 20.5C7.36193 20.5 7.25 20.3881 7.25 20.25C7.25 20.1119 7.36193 20 7.5 20C7.63807 20 7.75 20.1119 7.75 20.25Z\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path><path d=\"M12.125 20.25H12M12.25 20.25C12.25 20.3881 12.1381 20.5 12 20.5C11.8619 20.5 11.75 20.3881 11.75 20.25C11.75 20.1119 11.8619 20 12 20C12.1381 20 12.25 20.1119 12.25 20.25Z\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path><path d=\"M16.625 20.25H16.5M16.75 20.25C16.75 20.3881 16.6381 20.5 16.5 20.5C16.3619 20.5 16.25 20.3881 16.25 20.25C16.25 20.1119 16.3619 20 16.5 20C16.6381 20 16.75 20.1119 16.75 20.25Z\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path>",
  "calculator-01": "<path d=\"M3 10H21\" stroke=\"currentColor\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path><path d=\"M15 6L17 6\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path><path d=\"M21 13V11C21 6.75736 21 4.63604 19.682 3.31802C18.364 2 16.2426 2 12 2C7.75736 2 5.63604 2 4.31802 3.31802C3 4.63604 3 6.75736 3 11V13C3 17.2426 3 19.364 4.31802 20.682C5.63604 22 7.75736 22 12 22C16.2426 22 18.364 22 19.682 20.682C21 19.364 21 17.2426 21 13Z\" stroke=\"currentColor\" stroke-width=\"1.5\"></path><path d=\"M7 14H7.52632M11.7368 14H12.2632M16.4737 14H17\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path><path d=\"M7 18H7.52632M11.7368 18H12.2632M16.4737 18H17\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path>",
  "calendar-01": "<path d=\"M16 2V6M8 2V6\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path><path d=\"M13 4H11C7.22876 4 5.34315 4 4.17157 5.17157C3 6.34315 3 8.22876 3 12V14C3 17.7712 3 19.6569 4.17157 20.8284C5.34315 22 7.22876 22 11 22H13C16.7712 22 18.6569 22 19.8284 20.8284C21 19.6569 21 17.7712 21 14V12C21 8.22876 21 6.34315 19.8284 5.17157C18.6569 4 16.7712 4 13 4Z\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path><path d=\"M3 10H21\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path><path d=\"M10 18.5002L9.99999 13.8474C9.99999 13.6557 9.86325 13.5002 9.69458 13.5002H9M14 18.4983L15.4855 13.8923C15.4951 13.8626 15.5 13.8315 15.5 13.8002C15.5 13.6346 15.3657 13.5002 15.2 13.5002L13 13.5\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path>",
  "calendar-03": "<path d=\"M16 2V6M8 2V6\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path><path d=\"M13 4H11C7.22876 4 5.34315 4 4.17157 5.17157C3 6.34315 3 8.22876 3 12V14C3 17.7712 3 19.6569 4.17157 20.8284C5.34315 22 7.22876 22 11 22H13C16.7712 22 18.6569 22 19.8284 20.8284C21 19.6569 21 17.7712 21 14V12C21 8.22876 21 6.34315 19.8284 5.17157C18.6569 4 16.7712 4 13 4Z\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path><path d=\"M3 10H21\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path><path d=\"M12.1258 14H12.0008M12.1258 18H12.0008M7.625 14H7.5M7.625 18H7.5M16.625 14H16.5M12.2508 14C12.2508 14.1381 12.1389 14.25 12.0008 14.25C11.8628 14.25 11.7508 14.1381 11.7508 14C11.7508 13.8619 11.8628 13.75 12.0008 13.75C12.1389 13.75 12.2508 13.8619 12.2508 14ZM12.2508 18C12.2508 18.1381 12.1389 18.25 12.0008 18.25C11.8628 18.25 11.7508 18.1381 11.7508 18C11.7508 17.8619 11.8628 17.75 12.0008 17.75C12.1389 17.75 12.2508 17.8619 12.2508 18ZM7.75 14C7.75 14.1381 7.63807 14.25 7.5 14.25C7.36193 14.25 7.25 14.1381 7.25 14C7.25 13.8619 7.36193 13.75 7.5 13.75C7.63807 13.75 7.75 13.8619 7.75 14ZM7.75 18C7.75 18.1381 7.63807 18.25 7.5 18.25C7.36193 18.25 7.25 18.1381 7.25 18C7.25 17.8619 7.36193 17.75 7.5 17.75C7.63807 17.75 7.75 17.8619 7.75 18ZM16.75 14C16.75 14.1381 16.6381 14.25 16.5 14.25C16.3619 14.25 16.25 14.1381 16.25 14C16.25 13.8619 16.3619 13.75 16.5 13.75C16.6381 13.75 16.75 13.8619 16.75 14Z\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path>",
  "cancel-01": "<path d=\"M18 6L6.00081 17.9992M17.9992 18L6 6.00085\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path>",
  "cash-01": "<path d=\"M2.01709 13.5C4.21666 13.5 5.99977 15.2831 5.99977 17.4827\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path><path d=\"M18 17.4827V17.3908C18 15.242 19.742 13.5 21.8908 13.5\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path><path d=\"M5.99977 3.51562C5.99977 5.7152 4.21666 7.4983 2.01709 7.4983\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path><path d=\"M18 3.51562C18 5.69594 19.769 7.46705 21.9423 7.49789\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path><path d=\"M16 3.5H8C5.17157 3.5 3.75736 3.5 2.87868 4.37868C2 5.25736 2 6.67157 2 9.5V11.5C2 14.3284 2 15.7426 2.87868 16.6213C3.75736 17.5 5.17157 17.5 8 17.5H16C18.8284 17.5 20.2426 17.5 21.1213 16.6213C22 15.7426 22 14.3284 22 11.5V9.5C22 6.67157 22 5.25736 21.1213 4.37868C20.2426 3.5 18.8284 3.5 16 3.5Z\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path><path d=\"M5 20.5H19\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path><path d=\"M15 10.5C15 12.1569 13.6569 13.5 12 13.5C10.3431 13.5 9 12.1569 9 10.5C9 8.84315 10.3431 7.5 12 7.5C13.6569 7.5 15 8.84315 15 10.5Z\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path>",
  "chart-histogram": "<path d=\"M21 21H10C6.70017 21 5.05025 21 4.02513 19.9749C3 18.9497 3 17.2998 3 14V3\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-width=\"1.5\"></path><path d=\"M13 10L13 21\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path><path d=\"M18 13L18 21\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path><path d=\"M8 13L8 20\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path><path d=\"M21 7.98693C19.16 7.98693 17.1922 8.24252 15.8771 6.49346C14.3798 4.50218 11.6202 4.50218 10.1229 6.49346C8.80782 8.24252 6.84003 7.98693 5 7.98693H3\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path>",
  "chart-line-data-01": "<path d=\"M21 21H10C6.70017 21 5.05025 21 4.02513 19.9749C3 18.9497 3 17.2998 3 14V3\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-width=\"1.5\"></path><path d=\"M5 20C5.43938 16.8438 7.67642 8.7643 10.4282 8.7643C12.3301 8.7643 12.8226 12.6353 14.6864 12.6353C17.8931 12.6353 17.4282 4 21 4\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path>",
  "checkmark-circle-02": "<path d=\"M22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12Z\" stroke=\"currentColor\" stroke-width=\"1.5\"></path><path d=\"M8 12.5L10.5 15L16 9\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path>",
  "clipboard": "<path d=\"M17.0235 3.03358L16.0689 2.77924C13.369 2.05986 12.019 1.70018 10.9555 2.31074C9.89196 2.9213 9.53023 4.26367 8.80678 6.94841L7.78366 10.7452C7.0602 13.4299 6.69848 14.7723 7.3125 15.8298C7.92652 16.8874 9.27651 17.247 11.9765 17.9664L12.9311 18.2208C15.631 18.9401 16.981 19.2998 18.0445 18.6893C19.108 18.0787 19.4698 16.7363 20.1932 14.0516L21.2163 10.2548C21.9398 7.57005 22.3015 6.22768 21.6875 5.17016C21.0735 4.11264 19.7235 3.75295 17.0235 3.03358Z\" stroke=\"currentColor\" stroke-width=\"1.5\"></path><path d=\"M16.8538 7.43306C16.8538 8.24714 16.1901 8.90709 15.3714 8.90709C14.5527 8.90709 13.889 8.24714 13.889 7.43306C13.889 6.61898 14.5527 5.95904 15.3714 5.95904C16.1901 5.95904 16.8538 6.61898 16.8538 7.43306Z\" stroke=\"currentColor\" stroke-width=\"1.5\"></path><path d=\"M12 20.9463L11.0477 21.2056C8.35403 21.9391 7.00722 22.3059 5.94619 21.6833C4.88517 21.0608 4.52429 19.6921 3.80253 16.9547L2.78182 13.0834C2.06006 10.346 1.69918 8.97731 2.31177 7.89904C2.84167 6.96631 4 7.00027 5.5 7.00015\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-width=\"1.5\"></path>",
  "clock-01": "<circle cx=\"12\" cy=\"12\" r=\"10\" stroke=\"currentColor\" stroke-width=\"1.5\"></circle><path d=\"M12 8V12L14 14\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path>",
  "coins-01": "<ellipse cx=\"15.5\" cy=\"11\" rx=\"6.5\" ry=\"2\" stroke=\"currentColor\" stroke-width=\"1.5\"></ellipse><path d=\"M22 15.5C22 16.6046 19.0899 17.5 15.5 17.5C11.9101 17.5 9 16.6046 9 15.5\" stroke=\"currentColor\" stroke-width=\"1.5\"></path><path d=\"M22 11V19.8C22 21.015 19.0899 22 15.5 22C11.9101 22 9 21.015 9 19.8V11\" stroke=\"currentColor\" stroke-width=\"1.5\"></path><ellipse cx=\"8.5\" cy=\"4\" rx=\"6.5\" ry=\"2\" stroke=\"currentColor\" stroke-width=\"1.5\"></ellipse><path d=\"M6 11C4.10819 10.7698 2.36991 10.1745 2 9M6 16C4.10819 15.7698 2.36991 15.1745 2 14\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-width=\"1.5\"></path><path d=\"M6 21C4.10819 20.7698 2.36991 20.1745 2 19L2 4\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-width=\"1.5\"></path><path d=\"M15 6V4\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-width=\"1.5\"></path>",
  "credit-card": "<path d=\"M2 12C2 8.46252 2 6.69377 3.0528 5.5129C3.22119 5.32403 3.40678 5.14935 3.60746 4.99087C4.86213 4 6.74142 4 10.5 4H13.5C17.2586 4 19.1379 4 20.3925 4.99087C20.5932 5.14935 20.7788 5.32403 20.9472 5.5129C22 6.69377 22 8.46252 22 12C22 15.5375 22 17.3062 20.9472 18.4871C20.7788 18.676 20.5932 18.8506 20.3925 19.0091C19.1379 20 17.2586 20 13.5 20H10.5C6.74142 20 4.86213 20 3.60746 19.0091C3.40678 18.8506 3.22119 18.676 3.0528 18.4871C2 17.3062 2 15.5375 2 12Z\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path><path d=\"M10 16H11.5\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path><path d=\"M14.5 16L18 16\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path><path d=\"M2 9H22\" stroke=\"currentColor\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path>",
  "dashboard-square-01": "<path d=\"M13.6903 19.4567C13.5 18.9973 13.5 18.4149 13.5 17.25C13.5 16.0851 13.5 15.5027 13.6903 15.0433C13.944 14.4307 14.4307 13.944 15.0433 13.6903C15.5027 13.5 16.0851 13.5 17.25 13.5C18.4149 13.5 18.9973 13.5 19.4567 13.6903C20.0693 13.944 20.556 14.4307 20.8097 15.0433C21 15.5027 21 16.0851 21 17.25C21 18.4149 21 18.9973 20.8097 19.4567C20.556 20.0693 20.0693 20.556 19.4567 20.8097C18.9973 21 18.4149 21 17.25 21C16.0851 21 15.5027 21 15.0433 20.8097C14.4307 20.556 13.944 20.0693 13.6903 19.4567Z\" stroke=\"currentColor\" stroke-linecap=\"square\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path><path d=\"M13.6903 8.95671C13.5 8.49728 13.5 7.91485 13.5 6.75C13.5 5.58515 13.5 5.00272 13.6903 4.54329C13.944 3.93072 14.4307 3.44404 15.0433 3.1903C15.5027 3 16.0851 3 17.25 3C18.4149 3 18.9973 3 19.4567 3.1903C20.0693 3.44404 20.556 3.93072 20.8097 4.54329C21 5.00272 21 5.58515 21 6.75C21 7.91485 21 8.49728 20.8097 8.95671C20.556 9.56928 20.0693 10.056 19.4567 10.3097C18.9973 10.5 18.4149 10.5 17.25 10.5C16.0851 10.5 15.5027 10.5 15.0433 10.3097C14.4307 10.056 13.944 9.56928 13.6903 8.95671Z\" stroke=\"currentColor\" stroke-linecap=\"square\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path><path d=\"M3.1903 19.4567C3 18.9973 3 18.4149 3 17.25C3 16.0851 3 15.5027 3.1903 15.0433C3.44404 14.4307 3.93072 13.944 4.54329 13.6903C5.00272 13.5 5.58515 13.5 6.75 13.5C7.91485 13.5 8.49728 13.5 8.95671 13.6903C9.56928 13.944 10.056 14.4307 10.3097 15.0433C10.5 15.5027 10.5 16.0851 10.5 17.25C10.5 18.4149 10.5 18.9973 10.3097 19.4567C10.056 20.0693 9.56928 20.556 8.95671 20.8097C8.49728 21 7.91485 21 6.75 21C5.58515 21 5.00272 21 4.54329 20.8097C3.93072 20.556 3.44404 20.0693 3.1903 19.4567Z\" stroke=\"currentColor\" stroke-linecap=\"square\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path><path d=\"M3.1903 8.95671C3 8.49728 3 7.91485 3 6.75C3 5.58515 3 5.00272 3.1903 4.54329C3.44404 3.93072 3.93072 3.44404 4.54329 3.1903C5.00272 3 5.58515 3 6.75 3C7.91485 3 8.49728 3 8.95671 3.1903C9.56928 3.44404 10.056 3.93072 10.3097 4.54329C10.5 5.00272 10.5 5.58515 10.5 6.75C10.5 7.91485 10.5 8.49728 10.3097 8.95671C10.056 9.56928 9.56928 10.056 8.95671 10.3097C8.49728 10.5 7.91485 10.5 6.75 10.5C5.58515 10.5 5.00272 10.5 4.54329 10.3097C3.93072 10.056 3.44404 9.56928 3.1903 8.95671Z\" stroke=\"currentColor\" stroke-linecap=\"square\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path>",
  "delete-02": "<path d=\"M19.5 5.5L18.8803 15.5251C18.7219 18.0864 18.6428 19.3671 18.0008 20.2879C17.6833 20.7431 17.2747 21.1273 16.8007 21.416C15.8421 22 14.559 22 11.9927 22C9.42312 22 8.1383 22 7.17905 21.4149C6.7048 21.1257 6.296 20.7408 5.97868 20.2848C5.33688 19.3626 5.25945 18.0801 5.10461 15.5152L4.5 5.5\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-width=\"1.5\"></path><path d=\"M3 5.5H21M16.0557 5.5L15.3731 4.09173C14.9196 3.15626 14.6928 2.68852 14.3017 2.39681C14.215 2.3321 14.1231 2.27454 14.027 2.2247C13.5939 2 13.0741 2 12.0345 2C10.9688 2 10.436 2 9.99568 2.23412C9.8981 2.28601 9.80498 2.3459 9.71729 2.41317C9.32164 2.7167 9.10063 3.20155 8.65861 4.17126L8.05292 5.5\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-width=\"1.5\"></path><path d=\"M9.5 16.5L9.5 10.5\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-width=\"1.5\"></path><path d=\"M14.5 16.5L14.5 10.5\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-width=\"1.5\"></path>",
  "delivery-truck-01": "<path d=\"M19.5 17.5C19.5 18.8807 18.3807 20 17 20C15.6193 20 14.5 18.8807 14.5 17.5C14.5 16.1193 15.6193 15 17 15C18.3807 15 19.5 16.1193 19.5 17.5Z\" stroke=\"currentColor\" stroke-width=\"1.5\"></path><path d=\"M9.5 17.5C9.5 18.8807 8.38071 20 7 20C5.61929 20 4.5 18.8807 4.5 17.5C4.5 16.1193 5.61929 15 7 15C8.38071 15 9.5 16.1193 9.5 17.5Z\" stroke=\"currentColor\" stroke-width=\"1.5\"></path><path d=\"M14.5 17.5H9.5M19.5 17.5H20.2632C20.4831 17.5 20.5931 17.5 20.6855 17.4885C21.3669 17.4036 21.9036 16.8669 21.9885 16.1855C22 16.0931 22 15.9831 22 15.7632V13C22 9.41015 19.0899 6.5 15.5 6.5M2 4H12C13.4142 4 14.1213 4 14.5607 4.43934C15 4.87868 15 5.58579 15 7V15.5M2 12.75V15C2 15.9346 2 16.4019 2.20096 16.75C2.33261 16.978 2.52197 17.1674 2.75 17.299C3.09808 17.5 3.56538 17.5 4.5 17.5\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path><path d=\"M2 7H8M2 10H6\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path>",
  "dollar-01": "<path d=\"M17.9583 8.38889C17.9583 6.24111 15.2907 4.5 12 4.5C8.7093 4.5 6.04167 6.24111 6.04167 8.38889C6.04167 10.5367 7.66667 11.7222 12 11.7222C16.3333 11.7222 18.5 12.8333 18.5 15.6111C18.5 18.3889 15.5899 19.5 12 19.5C8.41015 19.5 5.5 17.7589 5.5 15.6111\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-width=\"1.5\"></path><path d=\"M12.5 2.5V4.21M12.5 21.5V19.79\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path>",
  "download-01": "<path d=\"M2.99969 17.0002C2.99969 17.9302 2.99969 18.3952 3.10192 18.7767C3.37932 19.8119 4.18796 20.6206 5.22324 20.898C5.60474 21.0002 6.06972 21.0002 6.99969 21.0002L16.9997 21.0002C17.9297 21.0002 18.3947 21.0002 18.7762 20.898C19.8114 20.6206 20.6201 19.8119 20.8975 18.7767C20.9997 18.3952 20.9997 17.9302 20.9997 17.0002\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path><path d=\"M16.4998 11.5002C16.4998 11.5002 13.1856 16.0002 11.9997 16.0002C10.8139 16.0002 7.49976 11.5002 7.49976 11.5002M11.9997 15.0002V3.00016\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path>",
  "exchange-01": "<path d=\"M16.9767 19.5C19.4017 17.8876 21 15.1305 21 12C21 7.02944 16.9706 3 12 3C11.3126 3 10.6432 3.07706 10 3.22302M16.9767 19.5V16M16.9767 19.5H20.5M7 4.51555C4.58803 6.13007 3 8.87958 3 12C3 16.9706 7.02944 21 12 21C12.6874 21 13.3568 20.9229 14 20.777M7 4.51555V8M7 4.51555H3.5\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path>",
  "file-import": "<path d=\"M20 15.0057V10.6606C20 9.84276 20 9.43383 19.8478 9.06613C19.6955 8.69843 19.4065 8.40927 18.8284 7.83096L14.0919 3.09236C13.593 2.59325 13.3436 2.3437 13.0345 2.19583C12.9702 2.16508 12.9044 2.13778 12.8372 2.11406C12.5141 2 12.1614 2 11.4558 2C8.21082 2 6.58831 2 5.48933 2.88646C5.26731 3.06554 5.06508 3.26787 4.88607 3.48998C4 4.58943 4 6.21265 4 9.45908V14.0052C4 17.7781 4 19.6645 5.17157 20.8366C6.11466 21.7801 7.52043 21.9641 10 22M13 2.50022V3.00043C13 5.83009 13 7.24492 13.8787 8.12398C14.7574 9.00304 16.1716 9.00304 19 9.00304H19.5\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path><path d=\"M15 22C14.3932 21.4102 12 19.8403 12 19C12 18.1597 14.3932 16.5898 15 16M13 19H20\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path>",
  "filter-horizontal": "<path d=\"M3 7H6\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path><path d=\"M3 17H9\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path><path d=\"M18 17L21 17\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path><path d=\"M15 7L21 7\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path><path d=\"M6 7C6 6.06812 6 5.60218 6.15224 5.23463C6.35523 4.74458 6.74458 4.35523 7.23463 4.15224C7.60218 4 8.06812 4 9 4C9.93188 4 10.3978 4 10.7654 4.15224C11.2554 4.35523 11.6448 4.74458 11.8478 5.23463C12 5.60218 12 6.06812 12 7C12 7.93188 12 8.39782 11.8478 8.76537C11.6448 9.25542 11.2554 9.64477 10.7654 9.84776C10.3978 10 9.93188 10 9 10C8.06812 10 7.60218 10 7.23463 9.84776C6.74458 9.64477 6.35523 9.25542 6.15224 8.76537C6 8.39782 6 7.93188 6 7Z\" stroke=\"currentColor\" stroke-width=\"1.5\"></path><path d=\"M12 17C12 16.0681 12 15.6022 12.1522 15.2346C12.3552 14.7446 12.7446 14.3552 13.2346 14.1522C13.6022 14 14.0681 14 15 14C15.9319 14 16.3978 14 16.7654 14.1522C17.2554 14.3552 17.6448 14.7446 17.8478 15.2346C18 15.6022 18 16.0681 18 17C18 17.9319 18 18.3978 17.8478 18.7654C17.6448 19.2554 17.2554 19.6448 16.7654 19.8478C16.3978 20 15.9319 20 15 20C14.0681 20 13.6022 20 13.2346 19.8478C12.7446 19.6448 12.3552 19.2554 12.1522 18.7654C12 18.3978 12 17.9319 12 17Z\" stroke=\"currentColor\" stroke-width=\"1.5\"></path>",
  "home-01": "<path d=\"M3 11.9896V14.5C3 17.7998 3 19.4497 4.02513 20.4749C5.05025 21.5 6.70017 21.5 10 21.5H14C17.2998 21.5 18.9497 21.5 19.9749 20.4749C21 19.4497 21 17.7998 21 14.5V11.9896C21 10.3083 21 9.46773 20.6441 8.74005C20.2882 8.01237 19.6247 7.49628 18.2976 6.46411L16.2976 4.90855C14.2331 3.30285 13.2009 2.5 12 2.5C10.7991 2.5 9.76689 3.30285 7.70242 4.90855L5.70241 6.46411C4.37533 7.49628 3.71179 8.01237 3.3559 8.74005C3 9.46773 3 10.3083 3 11.9896Z\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path>",
  "information-circle": "<circle cx=\"12\" cy=\"12\" r=\"10\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></circle><path d=\"M12 16V12\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path><path d=\"M12.125 8.25H12M12.25 8.25C12.25 8.11193 12.1381 8 12 8C11.8619 8 11.75 8.11193 11.75 8.25C11.75 8.38807 11.8619 8.5 12 8.5C12.1381 8.5 12.25 8.38807 12.25 8.25Z\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path>",
  "invoice-01": "<path d=\"M4 18.6458V8.05426C4 5.20025 4 3.77325 4.87868 2.88663C5.75736 2 7.17157 2 10 2H14C16.8284 2 18.2426 2 19.1213 2.88663C20 3.77325 20 5.20025 20 8.05426V18.6458C20 20.1575 20 20.9133 19.538 21.2108C18.7831 21.6971 17.6161 20.6774 17.0291 20.3073C16.5441 20.0014 16.3017 19.8485 16.0325 19.8397C15.7417 19.8301 15.4949 19.9768 14.9709 20.3073L13.06 21.5124C12.5445 21.8374 12.2868 22 12 22C11.7132 22 11.4555 21.8374 10.94 21.5124L9.02913 20.3073C8.54415 20.0014 8.30166 19.8485 8.03253 19.8397C7.74172 19.8301 7.49493 19.9768 6.97087 20.3073C6.38395 20.6774 5.21687 21.6971 4.46195 21.2108C4 20.9133 4 20.1575 4 18.6458Z\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path><path d=\"M11 11H8\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path><path d=\"M14 7L8 7\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path>",
  "invoice-03": "<path d=\"M20.016 2C18.9026 2 18 4.68629 18 8H20.016C20.9876 8 21.4734 8 21.7741 7.66455C22.0749 7.32909 22.0225 6.88733 21.9178 6.00381C21.6414 3.67143 20.8943 2 20.016 2Z\" stroke=\"currentColor\" stroke-width=\"1.5\"></path><path d=\"M18 8.05426V18.6458C18 20.1575 18 20.9133 17.538 21.2108C16.7831 21.6971 15.6161 20.6774 15.0291 20.3073C14.5441 20.0014 14.3017 19.8485 14.0325 19.8397C13.7417 19.8301 13.4949 19.9768 12.9709 20.3073L11.06 21.5124C10.5445 21.8374 10.2868 22 10 22C9.71321 22 9.45546 21.8374 8.94 21.5124L7.02913 20.3073C6.54415 20.0014 6.30166 19.8485 6.03253 19.8397C5.74172 19.8301 5.49493 19.9768 4.97087 20.3073C4.38395 20.6774 3.21687 21.6971 2.46195 21.2108C2 20.9133 2 20.1575 2 18.6458V8.05426C2 5.20025 2 3.77325 2.87868 2.88663C3.75736 2 5.17157 2 8 2H20\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path><path d=\"M6 6H14\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path><path d=\"M8 10H6\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path><path d=\"M12.5 10.875C11.6716 10.875 11 11.4626 11 12.1875C11 12.9124 11.6716 13.5 12.5 13.5C13.3284 13.5 14 14.0876 14 14.8125C14 15.5374 13.3284 16.125 12.5 16.125M12.5 10.875C13.1531 10.875 13.7087 11.2402 13.9146 11.75M12.5 10.875V10M12.5 16.125C11.8469 16.125 11.2913 15.7598 11.0854 15.25M12.5 16.125V17\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-width=\"1.5\"></path>",
  "layers-01": "<path d=\"M8.64298 3.14559L6.93816 3.93362C4.31272 5.14719 3 5.75397 3 6.75C3 7.74603 4.31272 8.35281 6.93817 9.56638L8.64298 10.3544C10.2952 11.1181 11.1214 11.5 12 11.5C12.8786 11.5 13.7048 11.1181 15.357 10.3544L17.0618 9.56638C19.6873 8.35281 21 7.74603 21 6.75C21 5.75397 19.6873 5.14719 17.0618 3.93362L15.357 3.14559C13.7048 2.38186 12.8786 2 12 2C11.1214 2 10.2952 2.38186 8.64298 3.14559Z\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path><path d=\"M20.788 11.0972C20.9293 11.2959 21 11.5031 21 11.7309C21 12.7127 19.6873 13.3109 17.0618 14.5072L15.357 15.284C13.7048 16.0368 12.8786 16.4133 12 16.4133C11.1214 16.4133 10.2952 16.0368 8.64298 15.284L6.93817 14.5072C4.31272 13.3109 3 12.7127 3 11.7309C3 11.5031 3.07067 11.2959 3.212 11.0972\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path><path d=\"M20.3767 16.2661C20.7922 16.5971 21 16.927 21 17.3176C21 18.2995 19.6873 18.8976 17.0618 20.0939L15.357 20.8707C13.7048 21.6236 12.8786 22 12 22C11.1214 22 10.2952 21.6236 8.64298 20.8707L6.93817 20.0939C4.31272 18.8976 3 18.2995 3 17.3176C3 16.927 3.20778 16.5971 3.62334 16.2661\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path>",
  "lock-key": "<path d=\"M18 10.9971C17.6078 10.1968 16.5481 9.02153 14.3703 9.07154C14.3703 9.07154 12.6431 8.99652 10.6906 8.99652C8.73815 8.99652 7.82408 9.04224 6.25999 9.07154C5.25872 9.04653 3.35629 9.2716 2.48017 11.3472C1.90444 13.0976 1.87941 16.7736 2.22986 18.6241C2.30495 19.5744 2.80559 20.8998 4.35757 21.6C5.30878 22.1001 6.83573 21.9 7.98719 22.0001M5.98464 8.1963C5.93458 5.82065 5.83445 3.94514 8.58796 2.39472C9.51414 2.01962 10.8909 1.69453 12.5931 2.49475C14.3703 3.57004 14.5917 4.70802 14.7458 4.99543C15.1713 6.12074 14.9461 7.72117 14.9961 8.37135\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-width=\"1.5\"></path><path d=\"M15.5 19.7351C15.5 20.9792 14.4911 21.9656 13.2552 21.9656C12.0194 21.9656 11 20.9792 11 19.7351C11 18.4911 12.0194 17.4915 13.2552 17.4915C14.4911 17.4915 15.5 18.4911 15.5 19.7351Z\" stroke=\"currentColor\" stroke-width=\"1.5\"></path><path d=\"M22 15.8482L20.3731 14.3089C19.6 13.5692 18.95 14.2149 18.6264 14.4906L17.2156 15.8482L15.225 17.7909M17.2156 15.8482L18.825 17.3936\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-width=\"1.5\"></path>",
  "logout-01": "<path d=\"M15.5 8.04045C15.4588 6.87972 15.3216 6.15451 14.8645 5.58671C14.2114 4.77536 13.0944 4.52064 10.8605 4.01121L9.85915 3.78286C6.4649 3.00882 4.76777 2.6218 3.63388 3.51317C2.5 4.40454 2.5 6.1257 2.5 9.56803V14.432C2.5 17.8743 2.5 19.5955 3.63388 20.4868C4.76777 21.3782 6.4649 20.9912 9.85915 20.2171L10.8605 19.9888C13.0944 19.4794 14.2114 19.2246 14.8645 18.4133C15.3216 17.8455 15.4588 17.1203 15.5 15.9595\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path><path d=\"M18.5 9.01172C18.5 9.01172 21.5 11.2212 21.5 12.0117C21.5 12.8023 18.5 15.0117 18.5 15.0117M21 12.0117H8.49998\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path>",
  "menu-01": "<path d=\"M4 5L20 5\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path><path d=\"M4 12L20 12\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path><path d=\"M4 19L20 19\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path>",
  "money-01": "<path d=\"M2.01733 15C4.2169 15 6.00001 16.7831 6.00001 18.9827\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path><path d=\"M18 18.9827V18.8908C18 16.742 19.742 15 21.8908 15\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path><path d=\"M6.00001 5.01733C6.00001 7.2169 4.2169 9.00001 2.01733 9.00001\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path><path d=\"M18 5.01733C18 7.19765 19.769 8.96876 21.9423 8.9996\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path><path d=\"M16 5H8C5.17157 5 3.75736 5 2.87868 5.87868C2 6.75736 2 8.17157 2 11V13C2 15.8284 2 17.2426 2.87868 18.1213C3.75736 19 5.17157 19 8 19H16C18.8284 19 20.2426 19 21.1213 18.1213C22 17.2426 22 15.8284 22 13V11C22 8.17157 22 6.75736 21.1213 5.87868C20.2426 5 18.8284 5 16 5Z\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path><path d=\"M15 12C15 13.6569 13.6569 15 12 15C10.3431 15 9 13.6569 9 12C9 10.3431 10.3431 9 12 9C13.6569 9 15 10.3431 15 12Z\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path>",
  "money-03": "<path d=\"M14.4998 12.001C14.4998 13.3817 13.3805 14.501 11.9998 14.501C10.6191 14.501 9.49982 13.3817 9.49982 12.001C9.49982 10.6203 10.6191 9.50098 11.9998 9.50098C13.3805 9.50098 14.4998 10.6203 14.4998 12.001Z\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path><path d=\"M16 5.00098C18.4794 5.00098 20.1903 5.38518 21.1329 5.6773C21.6756 5.84549 22 6.35987 22 6.92803V16.6833C22 17.7984 20.7719 18.6374 19.6762 18.4305C18.7361 18.253 17.5107 18.1104 16 18.1104C11.2491 18.1104 10.1096 19.9161 3.1448 18.3802C2.47265 18.232 2 17.6275 2 16.9392V6.92214C2 5.94628 2.92079 5.23464 3.87798 5.42458C10.1967 6.67844 11.4209 5.00098 16 5.00098Z\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path><path d=\"M2 9.00098C3.95133 9.00098 5.70483 7.40605 5.92901 5.75514M18.5005 5.50098C18.5005 7.54062 20.2655 9.46997 22 9.46997M22 15.001C20.1009 15.001 18.2601 16.3112 18.102 18.0993M6.00049 18.4971C6.00049 16.2879 4.20963 14.4971 2.00049 14.4971\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path>",
  "money-bag-02": "<path d=\"M20.9427 16.8354C20.2864 12.8866 18.2432 9.94613 16.467 8.219C15.9501 7.71642 15.6917 7.46513 15.1208 7.23257C14.5499 7 14.0592 7 13.0778 7H10.9222C9.94081 7 9.4501 7 8.87922 7.23257C8.30834 7.46513 8.04991 7.71642 7.53304 8.219C5.75682 9.94613 3.71361 12.8866 3.05727 16.8354C2.56893 19.7734 5.27927 22 8.30832 22H15.6917C18.7207 22 21.4311 19.7734 20.9427 16.8354Z\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path><path d=\"M7.25662 4.44287C7.05031 4.14258 6.75128 3.73499 7.36899 3.64205C8.00392 3.54651 8.66321 3.98114 9.30855 3.97221C9.89237 3.96413 10.1898 3.70519 10.5089 3.33548C10.8449 2.94617 11.3652 2 12 2C12.6348 2 13.1551 2.94617 13.4911 3.33548C13.8102 3.70519 14.1076 3.96413 14.6914 3.97221C15.3368 3.98114 15.9961 3.54651 16.631 3.64205C17.2487 3.73499 16.9497 4.14258 16.7434 4.44287L15.8105 5.80064C15.4115 6.38146 15.212 6.67187 14.7944 6.83594C14.3769 7 13.8373 7 12.7582 7H11.2418C10.1627 7 9.6231 7 9.20556 6.83594C8.78802 6.67187 8.5885 6.38146 8.18945 5.80064L7.25662 4.44287Z\" stroke=\"currentColor\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path><path d=\"M13.6267 12.9186C13.4105 12.1205 12.3101 11.4003 10.9892 11.9391C9.66829 12.4778 9.45847 14.2113 11.4565 14.3955C12.3595 14.4787 12.9483 14.2989 13.4873 14.8076C14.0264 15.3162 14.1265 16.7308 12.7485 17.112C11.3705 17.4932 10.006 16.8976 9.85742 16.0517M11.8417 10.9927V11.7531M11.8417 17.2293V17.9927\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path>",
  "money-receive-01": "<path d=\"M2.01733 17.4993C4.2169 17.4993 6.00001 19.2824 6.00001 21.4819\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path><path d=\"M18 21.4819V21.39C18 19.2412 19.742 17.4993 21.8908 17.4993\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path><path d=\"M6.00001 7.5166C6.00001 9.71617 4.2169 11.4993 2.01733 11.4993\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path><path d=\"M18 7.5166C18 9.69692 19.769 11.468 21.9423 11.4989\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path><path d=\"M17 7.50098C19.175 7.51308 20.3529 7.60953 21.1213 8.37792C22 9.2566 22 10.6708 22 13.4992V15.4992C22 18.3277 22 19.7419 21.1213 20.6206C20.2426 21.4992 18.8284 21.4992 16 21.4992H8C5.17157 21.4992 3.75736 21.4992 2.87868 20.6206C2 19.7419 2 18.3277 2 15.4992V13.4992C2 10.6708 2 9.2566 2.87868 8.37792C3.64706 7.60953 4.82497 7.51308 7 7.50098\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path><path d=\"M15 14.4993C15 16.1561 13.6569 17.4993 12 17.4993C10.3431 17.4993 9 16.1561 9 14.4993C9 12.8424 10.3431 11.4993 12 11.4993C13.6569 11.4993 15 12.8424 15 14.4993Z\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path><path d=\"M14.5 5.50195C14.5 5.50195 12.7002 8.00195 12 8.00195C11.2998 8.00195 9.5 5.50195 9.5 5.50195M12 7.50195V2.50195\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path>",
  "money-send-01": "<path d=\"M2.01733 17.4993C4.2169 17.4993 6.00001 19.2824 6.00001 21.4819\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path><path d=\"M18 21.4819V21.39C18 19.2412 19.742 17.4993 21.8908 17.4993\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path><path d=\"M6.00001 7.5166C6.00001 9.71617 4.2169 11.4993 2.01733 11.4993\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path><path d=\"M18 7.5166C18 9.69692 19.769 11.468 21.9423 11.4989\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path><path d=\"M17 7.50098C19.175 7.51308 20.3529 7.60953 21.1213 8.37792C22 9.2566 22 10.6708 22 13.4992V15.4992C22 18.3277 22 19.7419 21.1213 20.6206C20.2426 21.4992 18.8284 21.4992 16 21.4992H8C5.17157 21.4992 3.75736 21.4992 2.87868 20.6206C2 19.7419 2 18.3277 2 15.4992V13.4992C2 10.6708 2 9.2566 2.87868 8.37792C3.64706 7.60953 4.82497 7.51308 7 7.50098\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path><path d=\"M15 14.4993C15 16.1561 13.6569 17.4993 12 17.4993C10.3431 17.4993 9 16.1561 9 14.4993C9 12.8424 10.3431 11.4993 12 11.4993C13.6569 11.4993 15 12.8424 15 14.4993Z\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path><path d=\"M9.5 5.00098C9.5 5.00098 11.2998 2.50098 12 2.50098C12.7002 2.50098 14.5 5.00098 14.5 5.00098M12 8.00098V3.00098\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path>",
  "moon-02": "<path d=\"M21.5 14.0784C20.3003 14.7189 18.9301 15.0821 17.4751 15.0821C12.7491 15.0821 8.91792 11.2509 8.91792 6.52485C8.91792 5.06986 9.28105 3.69968 9.92163 2.5C5.66765 3.49698 2.5 7.31513 2.5 11.8731C2.5 17.1899 6.8101 21.5 12.1269 21.5C16.6849 21.5 20.503 18.3324 21.5 14.0784Z\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path>",
  "more-horizontal": "<path d=\"M6.00449 12.5V12M18.0045 12.5V12M12.0045 12.5V12M7.00449 12.5C7.00449 11.9477 6.55677 11.5 6.00449 11.5C5.4522 11.5 5.00449 11.9477 5.00449 12.5C5.00449 13.0523 5.4522 13.5 6.00449 13.5C6.55677 13.5 7.00449 13.0523 7.00449 12.5ZM19.0045 12.5C19.0045 11.9477 18.5568 11.5 18.0045 11.5C17.4522 11.5 17.0045 11.9477 17.0045 12.5C17.0045 13.0523 17.4522 13.5 18.0045 13.5C18.5568 13.5 19.0045 13.0523 19.0045 12.5ZM13.0045 12.5C13.0045 11.9477 12.5568 11.5 12.0045 11.5C11.4522 11.5 11.0045 11.9477 11.0045 12.5C11.0045 13.0523 11.4522 13.5 12.0045 13.5C12.5568 13.5 13.0045 13.0523 13.0045 12.5Z\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path>",
  "note-01": "<path d=\"M16.5 2V5M7.5 2V5M12 2V5\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path><path d=\"M13 3.5H11C7.70017 3.5 6.05025 3.5 5.02513 4.52513C4 5.55025 4 7.20017 4 10.5V15C4 18.2998 4 19.9497 5.02513 20.9749C6.05025 22 7.70017 22 11 22H13C16.2998 22 17.9497 22 18.9749 20.9749C20 19.9497 20 18.2998 20 15V10.5C20 7.20017 20 5.55025 18.9749 4.52512C17.9497 3.5 16.2998 3.5 13 3.5Z\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path><path d=\"M8 15H12M8 11H16\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path>",
  "notification-01": "<path d=\"M15.5 18C15.5 19.933 13.933 21.5 12 21.5C10.067 21.5 8.5 19.933 8.5 18\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path><path d=\"M19.2311 18H4.76887C3.79195 18 3 17.208 3 16.2311C3 15.762 3.18636 15.3121 3.51809 14.9803L4.12132 14.3771C4.68393 13.8145 5 13.0514 5 12.2558V9.5C5 5.63401 8.13401 2.5 12 2.5C15.866 2.5 19 5.634 19 9.5V12.2558C19 13.0514 19.3161 13.8145 19.8787 14.3771L20.4819 14.9803C20.8136 15.3121 21 15.762 21 16.2311C21 17.208 20.208 18 19.2311 18Z\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path>",
  "package-out-of-stock": "<path d=\"M12 22C11.1818 22 10.4002 21.6708 8.83693 21.0123C4.94564 19.3734 3 18.5539 3 17.1754V7.54234M12 22C12.8182 22 13.5998 21.6708 15.1631 21.0123C19.0544 19.3734 21 18.5539 21 17.1754V7.54234M12 22V12.0292M21 7.54234C21 8.15478 20.1984 8.54152 18.5953 9.315L15.6741 10.7244C13.8712 11.5943 12.9697 12.0292 12 12.0292M21 7.54234C21 6.9299 20.1984 6.54316 18.5953 5.76969L17 5M3 7.54234C3 8.15478 3.80157 8.54152 5.40472 9.315L8.32592 10.7244C10.1288 11.5943 11.0303 12.0292 12 12.0292M3 7.54234C3 6.9299 3.80157 6.54317 5.40472 5.76969L7 5M6 13.0263L8 14.0234\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path><path d=\"M10 2L12 4M12 4L14 6M12 4L10 6M12 4L14 2\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-width=\"1.5\"></path>",
  "package-receive": "<path d=\"M12 22C11.1818 22 10.4002 21.6754 8.83693 21.0262C4.94564 19.4101 3 18.6021 3 17.2429V7.74463M12 22C12.8182 22 13.5998 21.6754 15.1631 21.0262C19.0544 19.4101 21 18.6021 21 17.2429V7.74463M12 22V12.1687M3 7.74463C3 8.3485 3.80157 8.72983 5.40472 9.49248L8.32592 10.8822C10.1288 11.7399 11.0303 12.1687 12 12.1687M3 7.74463C3 7.14076 3.80157 6.75944 5.40472 5.99678L7.5 5M21 7.74463C21 8.3485 20.1984 8.72983 18.5953 9.49248L15.6741 10.8822C13.8712 11.7399 12.9697 12.1687 12 12.1687M21 7.74463C21 7.14076 20.1984 6.75944 18.5953 5.99678L16.5 5M6 13.1518L8 14.135\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path><path d=\"M12.0037 2L12.0037 8.99995M12.0037 8.99995C12.2668 9.00351 12.5263 8.81972 12.7178 8.59534L14 7.06174M12.0037 8.99995C11.7499 8.99652 11.4929 8.81368 11.2897 8.59534L10 7.06174\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-width=\"1.5\"></path>",
  "package": "<path d=\"M12 22C11.1818 22 10.4002 21.6698 8.83693 21.0095C4.94564 19.3657 3 18.5438 3 17.1613C3 16.7742 3 10.0645 3 7M12 22C12.8182 22 13.5998 21.6698 15.1631 21.0095C19.0544 19.3657 21 18.5438 21 17.1613V7M12 22L12 11.3548\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path><path d=\"M8.32592 9.69138L5.40472 8.27785C3.80157 7.5021 3 7.11423 3 6.5C3 5.88577 3.80157 5.4979 5.40472 4.72215L8.32592 3.30862C10.1288 2.43621 11.0303 2 12 2C12.9697 2 13.8712 2.4362 15.6741 3.30862L18.5953 4.72215C20.1984 5.4979 21 5.88577 21 6.5C21 7.11423 20.1984 7.5021 18.5953 8.27785L15.6741 9.69138C13.8712 10.5638 12.9697 11 12 11C11.0303 11 10.1288 10.5638 8.32592 9.69138Z\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path><path d=\"M6 12L8 13\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path><path d=\"M17 4L7 9\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path>",
  "pencil-edit-01": "<path d=\"M15.2141 5.98239L16.6158 4.58063C17.39 3.80646 18.6452 3.80646 19.4194 4.58063C20.1935 5.3548 20.1935 6.60998 19.4194 7.38415L18.0176 8.78591M15.2141 5.98239L6.98023 14.2163C5.93493 15.2616 5.41226 15.7842 5.05637 16.4211C4.70047 17.058 4.3424 18.5619 4 20C5.43809 19.6576 6.94199 19.2995 7.57889 18.9436C8.21579 18.5877 8.73844 18.0651 9.78375 17.0198L18.0176 8.78591M15.2141 5.98239L18.0176 8.78591\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path><path d=\"M11 20H17\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-width=\"1.5\"></path>",
  "percent": "<path d=\"M4 20L20 4\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-width=\"1.5\"></path><path d=\"M8.26777 4.73223C9.24408 5.70854 9.24408 7.29146 8.26777 8.26777C7.29146 9.24408 5.70854 9.24408 4.73223 8.26777C3.75592 7.29146 3.75592 5.70854 4.73223 4.73223C5.70854 3.75592 7.29146 3.75592 8.26777 4.73223Z\" stroke=\"currentColor\" stroke-width=\"1.5\"></path><path d=\"M19.2678 15.7322C20.2441 16.7085 20.2441 18.2915 19.2678 19.2678C18.2915 20.2441 16.7085 20.2441 15.7322 19.2678C14.7559 18.2915 14.7559 16.7085 15.7322 15.7322C16.7085 14.7559 18.2915 14.7559 19.2678 15.7322Z\" stroke=\"currentColor\" stroke-width=\"1.5\"></path>",
  "printer": "<path d=\"M17 17H18.6667C19.9128 17 20.5359 17 21 16.7321C21.304 16.5565 21.5565 16.304 21.732 16C22 15.5359 22 14.9128 22 13.6667C22 11.1744 22 9.9282 21.4641 9C21.113 8.39192 20.6081 7.88697 20 7.5359C19.0718 7 17.8256 7 15.3333 7H8.66667C6.17436 7 4.9282 7 4 7.5359C3.39192 7.88697 2.88697 8.39192 2.5359 9C2 9.9282 2 11.1744 2 13.6667C2 14.9128 2 15.5359 2.26795 16C2.44349 16.304 2.69596 16.5565 3 16.7321C3.4641 17 4.08718 17 5.33333 17H7\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path><path d=\"M17 7V5C17 3.58579 17 2.87868 16.5607 2.43934C16.1213 2 15.4142 2 14 2H10C8.58579 2 7.87868 2 7.43934 2.43934C7 2.87868 7 3.58579 7 5V7\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path><path d=\"M17 14V19C17 20.4142 17 21.1213 16.5607 21.5607C16.1213 22 15.4142 22 14 22H10C8.58579 22 7.87868 22 7.43934 21.5607C7 21.1213 7 20.4142 7 19V14H17Z\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path><path d=\"M18.8748 10.25H18.7498M18.9998 10.25C18.9998 10.3881 18.8879 10.5 18.7498 10.5C18.6117 10.5 18.4998 10.3881 18.4998 10.25C18.4998 10.1119 18.6117 10 18.7498 10C18.8879 10 18.9998 10.1119 18.9998 10.25Z\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path>",
  "qr-code": "<path d=\"M3 6C3 4.58579 3 3.87868 3.43934 3.43934C3.87868 3 4.58579 3 6 3C7.41421 3 8.12132 3 8.56066 3.43934C9 3.87868 9 4.58579 9 6C9 7.41421 9 8.12132 8.56066 8.56066C8.12132 9 7.41421 9 6 9C4.58579 9 3.87868 9 3.43934 8.56066C3 8.12132 3 7.41421 3 6Z\" stroke=\"currentColor\" stroke-width=\"1.5\"></path><path d=\"M3 18C3 16.5858 3 15.8787 3.43934 15.4393C3.87868 15 4.58579 15 6 15C7.41421 15 8.12132 15 8.56066 15.4393C9 15.8787 9 16.5858 9 18C9 19.4142 9 20.1213 8.56066 20.5607C8.12132 21 7.41421 21 6 21C4.58579 21 3.87868 21 3.43934 20.5607C3 20.1213 3 19.4142 3 18Z\" stroke=\"currentColor\" stroke-width=\"1.5\"></path><path d=\"M3 12L9 12\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path><path d=\"M12 3V8\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path><path d=\"M15 6C15 4.58579 15 3.87868 15.4393 3.43934C15.8787 3 16.5858 3 18 3C19.4142 3 20.1213 3 20.5607 3.43934C21 3.87868 21 4.58579 21 6C21 7.41421 21 8.12132 20.5607 8.56066C20.1213 9 19.4142 9 18 9C16.5858 9 15.8787 9 15.4393 8.56066C15 8.12132 15 7.41421 15 6Z\" stroke=\"currentColor\" stroke-width=\"1.5\"></path><path d=\"M21 12H15C13.5858 12 12.8787 12 12.4393 12.4393C12 12.8787 12 13.5858 12 15M12 17.7692V20.5385M15 15V16.5C15 17.9464 15.7837 18 17 18C17.5523 18 18 18.4477 18 19M16 21H15M18 15C19.4142 15 20.1213 15 20.5607 15.44C21 15.8799 21 16.5881 21 18.0043C21 19.4206 21 20.1287 20.5607 20.5687C20.24 20.8898 19.7767 20.9766 19 21\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-width=\"1.5\"></path>",
  "remove-01": "<path d=\"M19.002 12L5.00001 12\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path>",
  "search-01": "<path d=\"M17 17L21 21\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path><path d=\"M19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19C15.4183 19 19 15.4183 19 11Z\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path>",
  "settings-01": "<path d=\"M21.3175 7.14139L20.8239 6.28479C20.4506 5.63696 20.264 5.31305 19.9464 5.18388C19.6288 5.05472 19.2696 5.15664 18.5513 5.36048L17.3311 5.70418C16.8725 5.80994 16.3913 5.74994 15.9726 5.53479L15.6357 5.34042C15.2766 5.11043 15.0004 4.77133 14.8475 4.37274L14.5136 3.37536C14.294 2.71534 14.1842 2.38533 13.9228 2.19657C13.6615 2.00781 13.3143 2.00781 12.6199 2.00781H11.5051C10.8108 2.00781 10.4636 2.00781 10.2022 2.19657C9.94085 2.38533 9.83106 2.71534 9.61149 3.37536L9.27753 4.37274C9.12465 4.77133 8.84845 5.11043 8.48937 5.34042L8.15249 5.53479C7.73374 5.74994 7.25259 5.80994 6.79398 5.70418L5.57375 5.36048C4.85541 5.15664 4.49625 5.05472 4.17867 5.18388C3.86109 5.31305 3.67445 5.63696 3.30115 6.28479L2.80757 7.14139C2.45766 7.74864 2.2827 8.05227 2.31666 8.37549C2.35061 8.69871 2.58483 8.95918 3.05326 9.48012L4.0843 10.6328C4.3363 10.9518 4.51521 11.5078 4.51521 12.0077C4.51521 12.5078 4.33636 13.0636 4.08433 13.3827L3.05326 14.5354C2.58483 15.0564 2.35062 15.3168 2.31666 15.6401C2.2827 15.9633 2.45766 16.2669 2.80757 16.8741L3.30114 17.7307C3.67443 18.3785 3.86109 18.7025 4.17867 18.8316C4.49625 18.9608 4.85542 18.8589 5.57377 18.655L6.79394 18.3113C7.25263 18.2055 7.73387 18.2656 8.15267 18.4808L8.4895 18.6752C8.84851 18.9052 9.12464 19.2442 9.2775 19.6428L9.61149 20.6403C9.83106 21.3003 9.94085 21.6303 10.2022 21.8191C10.4636 22.0078 10.8108 22.0078 11.5051 22.0078H12.6199C13.3143 22.0078 13.6615 22.0078 13.9228 21.8191C14.1842 21.6303 14.294 21.3003 14.5136 20.6403L14.8476 19.6428C15.0004 19.2442 15.2765 18.9052 15.6356 18.6752L15.9724 18.4808C16.3912 18.2656 16.8724 18.2055 17.3311 18.3113L18.5513 18.655C19.2696 18.8589 19.6288 18.9608 19.9464 18.8316C20.264 18.7025 20.4506 18.3785 20.8239 17.7307L21.3175 16.8741C21.6674 16.2669 21.8423 15.9633 21.8084 15.6401C21.7744 15.3168 21.5402 15.0564 21.0718 14.5354L20.0407 13.3827C19.7887 13.0636 19.6098 12.5078 19.6098 12.0077C19.6098 11.5078 19.7888 10.9518 20.0407 10.6328L21.0718 9.48012C21.5402 8.95918 21.7744 8.69871 21.8084 8.37549C21.8423 8.05227 21.6674 7.74864 21.3175 7.14139Z\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-width=\"1.5\"></path><path d=\"M15.5195 12C15.5195 13.933 13.9525 15.5 12.0195 15.5C10.0865 15.5 8.51953 13.933 8.51953 12C8.51953 10.067 10.0865 8.5 12.0195 8.5C13.9525 8.5 15.5195 10.067 15.5195 12Z\" stroke=\"currentColor\" stroke-width=\"1.5\"></path>",
  "shopping-basket-01": "<path d=\"M8 7H16C17.8856 7 18.8284 7 19.4142 7.58579C20 8.17157 20 9.11438 20 11V15C20 18.2998 20 19.9497 18.9749 20.9749C17.9497 22 16.2998 22 13 22H11C7.70017 22 6.05025 22 5.02513 20.9749C4 19.9497 4 18.2998 4 15V11C4 9.11438 4 8.17157 4.58579 7.58579C5.17157 7 6.11438 7 8 7Z\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path><path d=\"M16 9.5C16 5.63401 14.2091 2 12 2C9.79086 2 8 5.63401 8 9.5\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path>",
  "shopping-cart-01": "<path d=\"M10.5 20.25C10.5 20.6642 10.1642 21 9.75 21C9.33579 21 9 20.6642 9 20.25C9 19.8358 9.33579 19.5 9.75 19.5C10.1642 19.5 10.5 19.8358 10.5 20.25Z\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path><path d=\"M19 20.25C19 20.6642 18.6642 21 18.25 21C17.8358 21 17.5 20.6642 17.5 20.25C17.5 19.8358 17.8358 19.5 18.25 19.5C18.6642 19.5 19 19.8358 19 20.25Z\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path><path d=\"M2 3H2.20664C3.53124 3 4.19354 3 4.6255 3.40221C5.05746 3.80441 5.10464 4.46503 5.19902 5.78626L5.45035 9.30496C5.5924 11.2936 5.66342 12.2879 5.96476 13.0961C6.62531 14.8677 8.08229 16.2244 9.89648 16.757C10.7241 17 11.7267 17 13.7317 17C15.8373 17 16.89 17 17.7417 16.7416C19.6593 16.1599 21.1599 14.6593 21.7416 12.7417C22 11.89 22 10.8433 22 8.75C22 8.05222 22 7.70333 21.9139 7.41943C21.72 6.78023 21.2198 6.28002 20.5806 6.08612C20.2967 6 19.9478 6 19.25 6H5.5\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path><path d=\"M16 10V13M11 10V13\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path>",
  "sorting-05": "<path d=\"M11 10L18 10\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path><path d=\"M11 14H16\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path><path d=\"M11 18H14\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path><path d=\"M11 6H21\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path><path d=\"M7 18.8125C6.60678 19.255 5.56018 21 5 21M3 18.8125C3.39322 19.255 4.43982 21 5 21M5 21L5 15\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path><path d=\"M3 5.1875C3.39322 4.74501 4.43982 3 5 3M7 5.1875C6.60678 4.74501 5.56018 3 5 3M5 3L5 9\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path>",
  "store-01": "<path d=\"M3.50002 10V15C3.50002 17.8284 3.50002 19.2426 4.37869 20.1213C5.25737 21 6.67159 21 9.50002 21H14.5C17.3284 21 18.7427 21 19.6213 20.1213C20.5 19.2426 20.5 17.8284 20.5 15V10\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path><path d=\"M17 7.50184C17 8.88255 15.8807 9.99997 14.5 9.99997C13.1193 9.99997 12 8.88068 12 7.49997C12 8.88068 10.8807 9.99997 9.50002 9.99997C8.1193 9.99997 7.00002 8.88068 7.00002 7.49997C7.00002 8.88068 5.82655 9.99997 4.37901 9.99997C3.59984 9.99997 2.90008 9.67567 2.42 9.16087C1.59462 8.2758 2.12561 6.97403 2.81448 5.98842L3.20202 5.45851C4.08386 4.2527 4.52478 3.6498 5.16493 3.32494C5.80508 3.00008 6.55201 3.00018 8.04587 3.00038L15.9551 3.00143C17.4485 3.00163 18.1952 3.00173 18.8351 3.32658C19.475 3.65143 19.9158 4.25414 20.7974 5.45957L21.1855 5.99029C21.8744 6.97589 22.4054 8.27766 21.58 9.16273C21.0999 9.67754 20.4002 10.0018 19.621 10.0018C18.1734 10.0018 17 8.88255 17 7.50184Z\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path><path d=\"M14.9971 17C14.3133 17.6072 13.2247 18 11.9985 18C10.7723 18 9.68376 17.6072 9 17\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path>",
  "sun-03": "<path d=\"M17 12C17 14.7614 14.7614 17 12 17C9.23858 17 7 14.7614 7 12C7 9.23858 9.23858 7 12 7C14.7614 7 17 9.23858 17 12Z\" stroke=\"currentColor\" stroke-width=\"1.5\"></path><path d=\"M12 2V3.5M12 20.5V22M19.0708 19.0713L18.0101 18.0106M5.98926 5.98926L4.9286 4.9286M22 12H20.5M3.5 12H2M19.0713 4.92871L18.0106 5.98937M5.98975 18.0107L4.92909 19.0714\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-width=\"1.5\"></path>",
  "tag-01": "<circle cx=\"1.5\" cy=\"1.5\" r=\"1.5\" transform=\"matrix(1 0 0 -1 16 8.00024)\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></circle><path d=\"M2.77423 11.1439C1.77108 12.2643 1.7495 13.9546 2.67016 15.1437C4.49711 17.5033 6.49674 19.5029 8.85633 21.3298C10.0454 22.2505 11.7357 22.2289 12.8561 21.2258C15.8979 18.5022 18.6835 15.6559 21.3719 12.5279C21.6377 12.2187 21.8039 11.8397 21.8412 11.4336C22.0062 9.63798 22.3452 4.46467 20.9403 3.05974C19.5353 1.65481 14.362 1.99377 12.5664 2.15876C12.1603 2.19608 11.7813 2.36233 11.472 2.62811C8.34412 5.31646 5.49781 8.10211 2.77423 11.1439Z\" stroke=\"currentColor\" stroke-width=\"1.5\"></path><path d=\"M7.00002 14.0002L10 17.0002\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path>",
  "tick-02": "<path d=\"M5 14L8.5 17.5L19 6.5\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path>",
  "time-04": "<circle cx=\"12\" cy=\"12\" r=\"10\" stroke=\"currentColor\" stroke-width=\"1.5\"></circle><path d=\"M9.5 9.5L12.9999 12.9996M16 8L11 13\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path>",
  "unfold-more": "<path d=\"M18 14C18 14 13.5811 19 12 19C10.4188 19 6 14 6 14\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path><path d=\"M18 9.99996C18 9.99996 13.5811 5.00001 12 5C10.4188 4.99999 6 10 6 10\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path>",
  "upload-01": "<path d=\"M2.99994 17C2.99994 17.93 2.99994 18.395 3.10216 18.7765C3.37956 19.8117 4.18821 20.6204 5.22348 20.8978C5.60498 21 6.06997 21 6.99994 21L16.9999 21C17.9299 21 18.3949 21 18.7764 20.8978C19.8117 20.6204 20.6203 19.8117 20.8977 18.7765C20.9999 18.395 20.9999 17.93 20.9999 17\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path><path d=\"M16.5 7.49993C16.5 7.49993 13.1858 2.99997 12 2.99996C10.8141 2.99995 7.50002 7.49996 7.50002 7.49996M12 3.99996V16\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path>",
  "user-group": "<path d=\"M18.4995 20.5C18.2663 17.5685 15.8417 15.2477 12.808 15.0521L11.9995 15C11.7107 15.0076 11.4416 15.0178 11.1877 15.0298C8.18075 15.1723 5.7304 17.5974 5.49951 20.5\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path><path d=\"M15.2495 9.25C15.2495 11.0449 13.7944 12.5 11.9995 12.5C10.2046 12.5 8.74952 11.0449 8.74952 9.25C8.74952 7.45507 10.2046 6 11.9995 6C13.7944 6 15.2495 7.45507 15.2495 9.25Z\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path><path d=\"M5.50249 8.5C5.17908 7.99485 4.99158 7.39432 4.99158 6.75C4.99158 4.95507 6.44665 3.5 8.24157 3.5C8.68752 3.5 9.1125 3.58982 9.49939 3.75235\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path><path d=\"M18.4963 8.5C18.8197 7.99485 19.0072 7.39432 19.0072 6.75C19.0072 4.95507 17.5521 3.5 15.7572 3.5C15.3113 3.5 14.8863 3.58982 14.4994 3.75235\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path><path d=\"M22.0007 17.9996C21.8208 15.7374 19.9995 13.5 17.9995 13\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path><path d=\"M1.99927 17.9996C2.17923 15.7374 4.00049 13.5 6.00049 13\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path>",
  "user": "<path d=\"M20 21.0001C19.713 17.269 16.7289 14.3151 12.995 14.0662L12 13.9999C11.6446 14.0096 11.3134 14.0225 11.0008 14.0378C7.3 14.2192 4.28417 17.3057 4 21.0001\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path><circle cx=\"12\" cy=\"6.99988\" r=\"4\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></circle>",
  "view-off": "<path d=\"M22 8C22 8 18 14 12 14C6 14 2 8 2 8\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-width=\"1.5\"></path><path d=\"M15 13.5L16.5 16\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path><path d=\"M20 11L22 13\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path><path d=\"M2 13L4 11\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path><path d=\"M9 13.5L7.5 16\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path>",
  "view": "<path d=\"M21.544 11.045C21.848 11.4713 22 11.6845 22 12C22 12.3155 21.848 12.5287 21.544 12.955C20.1779 14.8706 16.6892 19 12 19C7.31078 19 3.8221 14.8706 2.45604 12.955C2.15201 12.5287 2 12.3155 2 12C2 11.6845 2.15201 11.4713 2.45604 11.045C3.8221 9.12944 7.31078 5 12 5C16.6892 5 20.1779 9.12944 21.544 11.045Z\" stroke=\"currentColor\" stroke-width=\"1.5\"></path><path d=\"M15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15C13.6569 15 15 13.6569 15 12Z\" stroke=\"currentColor\" stroke-width=\"1.5\"></path>",
  "wallet-01": "<path d=\"M14 3H5C3.89543 3 3 3.89543 3 5C3 6.10457 3.89543 7 5 7H18C18 6.07003 18 5.60504 17.8978 5.22354C17.6204 4.18827 16.8117 3.37962 15.7765 3.10222C15.395 3 14.93 3 14 3Z\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path><path d=\"M3 5V15C3 17.8284 3 19.2426 3.87868 20.1213C4.75736 21 6.17157 21 9 21H15C17.8284 21 19.2426 21 20.1213 20.1213C21 19.2426 21 17.8284 21 15V13C21 10.1716 21 8.75736 20.1213 7.87868C19.2426 7 17.8284 7 15 7H7\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path><path d=\"M21 12H19C18.535 12 18.3025 12 18.1118 12.0511C17.5941 12.1898 17.1898 12.5941 17.0511 13.1118C17 13.3025 17 13.535 17 14C17 14.465 17 14.6975 17.0511 14.8882C17.1898 15.4059 17.5941 15.8102 18.1118 15.9489C18.3025 16 18.535 16 19 16H21\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path>",
  "wifi-01": "<path d=\"M8.25 14.5C10.25 12.5 13.75 12.5 15.75 14.5\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path><path d=\"M18.5 11.5C14.7324 8.16667 9.5 8.16667 5.5 11.5\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path><path d=\"M2 8.5C8.31579 3.16669 15.6842 3.16668 22 8.49989\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path><circle cx=\"12\" cy=\"18\" r=\"1.5\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></circle>",
  "wifi-off-01": "<path d=\"M8.5 14.5C9.62137 13.3944 10.9643 12.887 12.5 13.0212\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path><path d=\"M18.5 11.5C17.0073 10.1794 15.2848 9.27433 13.5 9.00012\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path><path d=\"M5.5 11.4999C6.59299 10.5891 7.778 9.91296 9 9.49989\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path><path d=\"M22 8.49989C18.0717 5.18273 13.7362 3.92879 9.5 4.73808\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path><path d=\"M2 8.5C3.22409 7.46632 4.5 6.5 5.5 6\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path><circle cx=\"12\" cy=\"18\" r=\"1.5\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></circle><path d=\"M2 2L22 22\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-width=\"1.5\"></path>"
};
Object.assign(__ds_scope, { ICONS });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/iconData.js", error: String((e && e.message) || e) }); }

// components/core/Icon.jsx
try { (() => {
function Icon({
  name,
  size = 20,
  color = 'currentColor',
  title,
  style,
  ...rest
}) {
  const inner = __ds_scope.ICONS[name];
  if (!inner) return null;
  return React.createElement('svg', {
    xmlns: 'http://www.w3.org/2000/svg',
    viewBox: '0 0 24 24',
    width: size,
    height: size,
    fill: 'none',
    style: {
      color,
      flexShrink: 0,
      display: 'block',
      ...style
    },
    role: title ? 'img' : undefined,
    'aria-label': title,
    'aria-hidden': title ? undefined : true,
    dangerouslySetInnerHTML: {
      __html: (title ? '<title>' + title + '</title>' : '') + inner
    },
    ...rest
  });
}
const ICON_NAMES = Object.keys(__ds_scope.ICONS);
Object.assign(__ds_scope, { Icon, ICON_NAMES });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Icon.jsx", error: String((e && e.message) || e) }); }

// components/core/useInteraction.js
try { (() => {
function useInteraction(disabled) {
  const [hover, setHover] = React.useState(false);
  const [press, setPress] = React.useState(false);
  const [focus, setFocus] = React.useState(false);
  const bind = disabled ? {} : {
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => {
      setHover(false);
      setPress(false);
    },
    onPointerDown: () => setPress(true),
    onPointerUp: () => setPress(false),
    onFocus: e => {
      try {
        setFocus(e.target.matches(':focus-visible'));
      } catch (_) {
        setFocus(true);
      }
    },
    onBlur: () => setFocus(false)
  };
  return {
    hover,
    press,
    focus,
    bind
  };
}
Object.assign(__ds_scope, { useInteraction });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/useInteraction.js", error: String((e && e.message) || e) }); }

// components/core/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const SIZES = {
  sm: {
    h: 'var(--control-sm)',
    px: 12,
    fs: 'var(--text-body-sm)',
    gap: 6,
    ic: 16,
    r: 'var(--radius-sm)'
  },
  md: {
    h: 'var(--control-md)',
    px: 16,
    fs: 'var(--text-body-md)',
    gap: 8,
    ic: 18,
    r: 'var(--radius-md)'
  },
  lg: {
    h: 'var(--control-lg)',
    px: 20,
    fs: 'var(--text-body-lg)',
    gap: 8,
    ic: 20,
    r: 'var(--radius-lg)'
  },
  counter: {
    h: 'var(--control-counter)',
    px: 24,
    fs: 'var(--text-counter)',
    gap: 10,
    ic: 24,
    r: 'var(--radius-lg)'
  }
};
const V = {
  primary: {
    bg: 'var(--action-primary)',
    hv: 'var(--action-primary-hover)',
    fg: 'var(--text-inverse)',
    bd: 'transparent',
    sh: 'var(--shadow-btn-dark)'
  },
  brand: {
    bg: 'var(--action-brand)',
    hv: 'var(--action-brand-hover)',
    fg: 'var(--text-on-color)',
    bd: 'transparent',
    sh: 'var(--shadow-btn-brand)'
  },
  secondary: {
    bg: 'var(--surface-card)',
    hv: 'var(--surface-hover)',
    fg: 'var(--text-strong)',
    bd: 'var(--border-default)',
    sh: 'var(--shadow-xs)'
  },
  soft: {
    bg: 'var(--control-soft)',
    hv: 'var(--control-soft-hover)',
    fg: 'var(--text-strong)',
    bd: 'transparent',
    sh: 'none'
  },
  ghost: {
    bg: 'transparent',
    hv: 'var(--surface-sunken)',
    fg: 'var(--text-body)',
    bd: 'transparent',
    sh: 'none'
  },
  danger: {
    bg: 'var(--action-danger)',
    hv: 'var(--action-danger-hover)',
    fg: 'var(--text-on-color)',
    bd: 'transparent',
    sh: 'none'
  }
};
function Button({
  variant = 'primary',
  size = 'md',
  leadingIcon,
  trailingIcon,
  fullWidth = false,
  disabled = false,
  type = 'button',
  onClick,
  children,
  style,
  ...rest
}) {
  const s = SIZES[size] || SIZES.md,
    v = V[variant] || V.primary;
  const {
    hover,
    press,
    focus,
    bind
  } = __ds_scope.useInteraction(disabled);
  return /*#__PURE__*/React.createElement("button", _extends({
    type: type,
    disabled: disabled,
    onClick: onClick
  }, bind, rest, {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: s.gap,
      height: s.h,
      minHeight: s.h,
      padding: '0 ' + s.px + 'px',
      width: fullWidth ? '100%' : undefined,
      fontFamily: 'var(--font-sans)',
      fontSize: s.fs,
      fontWeight: 'var(--weight-medium)',
      lineHeight: 1,
      letterSpacing: '-0.005em',
      whiteSpace: 'nowrap',
      color: disabled ? 'var(--text-disabled)' : v.fg,
      background: disabled ? 'var(--surface-sunken)' : hover ? v.hv : v.bg,
      border: '1px solid ' + (disabled ? 'transparent' : v.bd),
      borderRadius: s.r,
      boxShadow: focus ? 'var(--focus-ring)' : disabled ? 'none' : v.sh,
      cursor: disabled ? 'not-allowed' : 'pointer',
      outline: 'none',
      transform: press ? 'scale(.98)' : 'none',
      transition: 'background var(--dur-fast) var(--ease-out),transform var(--dur-fast) var(--ease-out)',
      touchAction: 'manipulation',
      ...style
    }
  }), leadingIcon && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: leadingIcon,
    size: s.ic
  }), children, trailingIcon && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: trailingIcon,
    size: s.ic
  }));
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/IconButton.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const SZ = {
  sm: [32, 16, 'var(--radius-sm)'],
  md: [40, 20, 'var(--radius-md)'],
  lg: [48, 22, 'var(--radius-lg)'],
  counter: [60, 24, 'var(--radius-lg)']
};
function IconButton({
  icon,
  label,
  variant = 'secondary',
  size = 'md',
  disabled = false,
  onClick,
  style,
  ...rest
}) {
  const [d, ic, r] = SZ[size] || SZ.md;
  const {
    hover,
    press,
    focus,
    bind
  } = __ds_scope.useInteraction(disabled);
  const map = {
    secondary: ['var(--surface-card)', 'var(--surface-hover)', 'var(--text-body)', 'var(--border-default)'],
    ghost: ['transparent', 'var(--surface-sunken)', 'var(--text-sub)', 'transparent'],
    primary: ['var(--action-primary)', 'var(--action-primary-hover)', 'var(--text-inverse)', 'transparent'],
    brand: ['var(--action-brand)', 'var(--action-brand-hover)', 'var(--text-on-color)', 'transparent'],
    danger: ['var(--danger-bg)', 'var(--danger-soft-hover)', 'var(--danger-fg)', 'transparent']
  };
  const [bg, hv, fg, bd] = map[variant] || map.secondary;
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    "aria-label": label,
    title: label,
    disabled: disabled,
    onClick: onClick
  }, bind, rest, {
    style: {
      width: d,
      height: d,
      minWidth: d,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 0,
      borderRadius: r,
      background: disabled ? 'var(--surface-sunken)' : hover ? hv : bg,
      color: disabled ? 'var(--text-disabled)' : fg,
      border: '1px solid ' + bd,
      boxShadow: focus ? 'var(--focus-ring)' : variant === 'secondary' ? 'var(--shadow-xs)' : 'none',
      cursor: disabled ? 'not-allowed' : 'pointer',
      outline: 'none',
      transform: press ? 'scale(.96)' : 'none',
      transition: 'background var(--dur-fast) var(--ease-out),transform var(--dur-fast)',
      touchAction: 'manipulation',
      ...style
    }
  }), /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: ic
  }));
}
Object.assign(__ds_scope, { IconButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/IconButton.jsx", error: String((e && e.message) || e) }); }

// components/counter/Keypad.jsx
try { (() => {
function Key({
  children,
  onPress,
  label,
  tone
}) {
  const [p, setP] = React.useState(false);
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    "aria-label": label,
    onClick: onPress,
    onPointerDown: () => setP(true),
    onPointerUp: () => setP(false),
    onPointerLeave: () => setP(false),
    style: {
      height: 'var(--control-counter-lg)',
      minHeight: 60,
      border: '1px solid var(--border-default)',
      borderRadius: 'var(--radius-lg)',
      fontFamily: 'var(--font-sans)',
      fontSize: 28,
      fontWeight: 500,
      fontVariantNumeric: 'tabular-nums',
      background: p ? 'var(--control-pressed)' : tone === 'soft' ? 'var(--surface-sunken)' : 'var(--surface-card)',
      color: 'var(--text-strong)',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: 'var(--shadow-xs)',
      transform: p ? 'scale(.97)' : 'none',
      transition: 'transform var(--dur-fast)',
      touchAction: 'manipulation'
    }
  }, children);
}
function Keypad({
  value = '',
  onChange,
  maxLength = 9,
  style
}) {
  const press = k => {
    let v = String(value);
    if (k === 'del') v = v.slice(0, -1);else if (k === '00') v = (v + '00').slice(0, maxLength);else v = (v + k).slice(0, maxLength);
    v = v.replace(/^0+(?=\d)/, '');
    onChange && onChange(v);
  };
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '00', '0', 'del'];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3,minmax(0,1fr))',
      gap: 8,
      ...style
    }
  }, keys.map(k => /*#__PURE__*/React.createElement(Key, {
    key: k,
    tone: k === 'del' || k === '00' ? 'soft' : undefined,
    label: k === 'del' ? 'Apagar' : k,
    onPress: () => press(k)
  }, k === 'del' ? /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "arrow-left-01",
    size: 26
  }) : k)));
}
function centsToBRL(digits) {
  const n = parseInt(digits || '0', 10) / 100;
  return n;
}
Object.assign(__ds_scope, { Keypad, centsToBRL });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/counter/Keypad.jsx", error: String((e && e.message) || e) }); }

// components/display/Badge.jsx
try { (() => {
const T = {
  success: ['var(--success-bg)', 'var(--success-fg)', 'var(--success-solid)'],
  danger: ['var(--danger-bg)', 'var(--danger-fg)', 'var(--danger-solid)'],
  warning: ['var(--warning-bg)', 'var(--warning-fg)', 'var(--warning-solid)'],
  info: ['var(--info-bg)', 'var(--info-fg)', 'var(--info-solid)'],
  neutral: ['var(--neutral-bg)', 'var(--neutral-fg)', 'var(--neutral-400)']
};
function Badge({
  tone = 'neutral',
  dot = false,
  size = 'md',
  children,
  style
}) {
  const [bg, fg, solid] = T[tone] || T.neutral;
  const sm = size === 'sm';
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      height: sm ? 20 : 24,
      padding: '0 ' + (sm ? 8 : 10) + 'px',
      borderRadius: 'var(--radius-full)',
      background: bg,
      color: fg,
      fontSize: sm ? 'var(--text-caption)' : 'var(--text-body-sm)',
      fontWeight: 'var(--weight-medium)',
      whiteSpace: 'nowrap',
      lineHeight: 1,
      ...style
    }
  }, dot && /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      width: 6,
      height: 6,
      borderRadius: '50%',
      background: solid
    }
  }), children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/display/Badge.jsx", error: String((e && e.message) || e) }); }

// components/display/Card.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Card({
  title,
  subtitle,
  actions,
  padding = 'var(--card-pad)',
  children,
  style,
  bodyStyle,
  as = 'section',
  ...rest
}) {
  const Tag = as;
  return /*#__PURE__*/React.createElement(Tag, _extends({}, rest, {
    style: {
      background: 'var(--surface-card)',
      border: '1px solid var(--border-soft)',
      borderRadius: 'var(--radius-card)',
      boxShadow: 'var(--shadow-sm)',
      display: 'flex',
      flexDirection: 'column',
      minWidth: 0,
      ...style
    }
  }), (title || actions) && /*#__PURE__*/React.createElement("header", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      padding: '16px ' + (padding === '0' || padding === 0 ? '20px' : padding) + ' 0'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 2,
      minWidth: 0
    }
  }, title && /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: 0,
      fontSize: 'var(--text-body-lg)',
      lineHeight: 'var(--lh-body-lg)',
      fontWeight: 'var(--weight-medium)',
      color: 'var(--text-strong)',
      letterSpacing: '-0.01em'
    }
  }, title), subtitle && /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: 'var(--text-body-sm)',
      color: 'var(--text-sub)'
    }
  }, subtitle)), actions && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      alignItems: 'center',
      flexShrink: 0
    }
  }, actions)), /*#__PURE__*/React.createElement("div", {
    style: {
      padding,
      flex: 1,
      minWidth: 0,
      ...bodyStyle
    }
  }, children));
}
Object.assign(__ds_scope, { Card });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/display/Card.jsx", error: String((e && e.message) || e) }); }

// components/display/Money.jsx
try { (() => {
const SZ = {
  sm: ['var(--text-body-md)', 500],
  md: ['var(--text-h3)', 500],
  lg: ['var(--text-h2)', 500],
  xl: ['var(--text-h1)', 500],
  display: ['var(--text-display)', 500],
  counter: ['var(--text-counter-total)', 600]
};
function formatBRL(v) {
  const n = Math.round((Number(v) || 0) * 100) / 100;
  return n.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}
function Money({
  value,
  size = 'md',
  currency = true,
  signed = false,
  tone,
  mutedCents = true,
  hidden = false,
  style
}) {
  const [fs, fw] = SZ[size] || SZ.md;
  const n = Number(value) || 0;
  const s = formatBRL(Math.abs(n));
  const i = s.lastIndexOf(',');
  const sign = n < 0 ? '−' : signed && n > 0 ? '+' : '';
  const color = tone === 'in' ? 'var(--money-in)' : tone === 'out' ? 'var(--money-out)' : tone === 'margin' ? 'var(--success-fg)' : 'var(--text-strong)';
  return /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: fs,
      fontWeight: fw,
      color,
      fontVariantNumeric: 'tabular-nums',
      letterSpacing: 'var(--tracking-tight)',
      whiteSpace: 'nowrap',
      lineHeight: 1.15,
      ...style
    }
  }, hidden ? /*#__PURE__*/React.createElement("span", {
    "aria-label": "valor oculto"
  }, "R$ \u2022\u2022\u2022\u2022\u2022\u2022") : /*#__PURE__*/React.createElement(React.Fragment, null, sign, currency && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: '0.62em',
      fontWeight: 500,
      marginRight: '0.18em',
      color: 'var(--text-sub)',
      letterSpacing: 0
    }
  }, "R$"), s.slice(0, i), /*#__PURE__*/React.createElement("span", {
    style: {
      color: mutedCents && !tone ? 'var(--text-soft)' : undefined,
      opacity: mutedCents && tone ? 0.6 : 1
    }
  }, s.slice(i))));
}
Object.assign(__ds_scope, { formatBRL, Money });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/display/Money.jsx", error: String((e && e.message) || e) }); }

// components/display/StatCard.jsx
try { (() => {
function StatCard({
  label,
  value,
  money = true,
  delta,
  deltaLabel,
  icon,
  footer,
  hidden = false,
  action,
  style
}) {
  const up = delta !== undefined && delta >= 0;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: 'var(--surface-card)',
      border: '1px solid var(--border-soft)',
      borderRadius: 'var(--radius-card)',
      boxShadow: 'var(--shadow-sm)',
      padding: 'var(--card-pad)',
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      minWidth: 0,
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      fontSize: 'var(--text-body-sm)',
      color: 'var(--text-sub)',
      fontWeight: 'var(--weight-medium)'
    }
  }, icon && /*#__PURE__*/React.createElement("span", {
    style: {
      width: 28,
      height: 28,
      borderRadius: 'var(--radius-sm)',
      background: 'var(--surface-sunken)',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'var(--text-body)'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 16
  })), label), action), /*#__PURE__*/React.createElement("div", null, money ? /*#__PURE__*/React.createElement(__ds_scope.Money, {
    value: value,
    size: "xl",
    hidden: hidden
  }) : /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--text-h1)',
      lineHeight: 'var(--lh-h1)',
      fontWeight: 500,
      color: 'var(--text-strong)',
      fontVariantNumeric: 'tabular-nums',
      letterSpacing: 'var(--tracking-tight)'
    }
  }, value)), (delta !== undefined || footer) && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      fontSize: 'var(--text-caption)',
      color: 'var(--text-sub)'
    }
  }, delta !== undefined && /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 2,
      color: up ? 'var(--success-fg)' : 'var(--danger-fg)',
      fontWeight: 'var(--weight-medium)'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: up ? 'arrow-up-right-01' : 'arrow-down-left-01',
    size: 14
  }), (up ? '+' : '') + String(delta).replace('.', ','), "%"), deltaLabel && /*#__PURE__*/React.createElement("span", null, deltaLabel), footer));
}
Object.assign(__ds_scope, { StatCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/display/StatCard.jsx", error: String((e && e.message) || e) }); }

// components/display/Table.jsx
try { (() => {
function Table({
  columns = [],
  rows = [],
  rowKey,
  onRowClick,
  dense = false,
  empty = 'Nada por aqui ainda.',
  caption,
  style
}) {
  const [hover, setHover] = React.useState(-1);
  const py = dense ? 8 : 12;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      overflowX: 'auto',
      minWidth: 0,
      ...style
    }
  }, /*#__PURE__*/React.createElement("table", {
    style: {
      width: '100%',
      borderCollapse: 'separate',
      borderSpacing: 0,
      fontSize: 'var(--text-body-sm)',
      fontVariantNumeric: 'tabular-nums'
    }
  }, caption && /*#__PURE__*/React.createElement("caption", {
    style: {
      position: 'absolute',
      width: 1,
      height: 1,
      overflow: 'hidden',
      clip: 'rect(0 0 0 0)'
    }
  }, caption), /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, columns.map((c, ci) => /*#__PURE__*/React.createElement("th", {
    key: c.key,
    scope: "col",
    style: {
      textAlign: c.align || 'left',
      padding: '8px 12px',
      fontWeight: 'var(--weight-medium)',
      fontSize: 'var(--text-caption)',
      color: 'var(--text-sub)',
      background: 'var(--surface-sunken)',
      whiteSpace: 'nowrap',
      width: c.width,
      borderTopLeftRadius: ci === 0 ? 'var(--radius-sm)' : 0,
      borderBottomLeftRadius: ci === 0 ? 'var(--radius-sm)' : 0,
      borderTopRightRadius: ci === columns.length - 1 ? 'var(--radius-sm)' : 0,
      borderBottomRightRadius: ci === columns.length - 1 ? 'var(--radius-sm)' : 0
    }
  }, c.label)))), /*#__PURE__*/React.createElement("tbody", null, rows.length === 0 && /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", {
    colSpan: columns.length,
    style: {
      padding: '32px 12px',
      textAlign: 'center',
      color: 'var(--text-sub)'
    }
  }, empty)), rows.map((r, i) => /*#__PURE__*/React.createElement("tr", {
    key: rowKey ? r[rowKey] : i,
    onClick: onRowClick ? () => onRowClick(r) : undefined,
    onMouseEnter: () => setHover(i),
    onMouseLeave: () => setHover(-1),
    style: {
      cursor: onRowClick ? 'pointer' : 'default',
      background: hover === i ? 'var(--surface-hover)' : 'transparent'
    }
  }, columns.map(c => /*#__PURE__*/React.createElement("td", {
    key: c.key,
    style: {
      textAlign: c.align || 'left',
      padding: py + 'px 12px',
      borderBottom: '1px solid var(--border-soft)',
      color: 'var(--text-strong)',
      whiteSpace: c.wrap ? 'normal' : 'nowrap'
    }
  }, c.render ? c.render(r) : r[c.key])))))));
}
Object.assign(__ds_scope, { Table });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/display/Table.jsx", error: String((e && e.message) || e) }); }

// components/display/Tag.jsx
try { (() => {
function Tag({
  icon,
  selected = false,
  onClick,
  onRemove,
  children,
  style
}) {
  const El = onClick ? 'button' : 'span';
  return /*#__PURE__*/React.createElement(El, {
    type: onClick ? 'button' : undefined,
    onClick: onClick,
    "aria-pressed": onClick ? selected : undefined,
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      height: 28,
      padding: '0 10px',
      borderRadius: 'var(--radius-sm)',
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--text-body-sm)',
      fontWeight: 'var(--weight-medium)',
      cursor: onClick ? 'pointer' : 'default',
      background: selected ? 'var(--selected-bg)' : 'var(--surface-card)',
      color: selected ? 'var(--selected-fg)' : 'var(--text-body)',
      border: '1px solid ' + (selected ? 'var(--selected-border)' : 'var(--border-default)'),
      ...style
    }
  }, icon && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 14
  }), children, onRemove && /*#__PURE__*/React.createElement("span", {
    role: "button",
    tabIndex: 0,
    "aria-label": "Remover",
    onClick: e => {
      e.stopPropagation();
      onRemove();
    },
    style: {
      display: 'inline-flex',
      color: 'var(--text-soft)',
      cursor: 'pointer'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "cancel-01",
    size: 14
  })));
}
Object.assign(__ds_scope, { Tag });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/display/Tag.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Dialog.jsx
try { (() => {
function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  width = 480,
  style
}) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (!open) return;
    const k = e => {
      if (e.key === 'Escape') onClose && onClose();
    };
    document.addEventListener('keydown', k);
    const f = ref.current && ref.current.querySelector('input,button:not([aria-label="Fechar"]),select,textarea');
    f && f.focus();
    return () => document.removeEventListener('keydown', k);
  }, [open]);
  if (!open) return null;
  return /*#__PURE__*/React.createElement("div", {
    onMouseDown: e => {
      if (e.target === e.currentTarget) onClose && onClose();
    },
    style: {
      position: 'fixed',
      inset: 0,
      zIndex: 100,
      background: 'var(--surface-overlay)',
      backdropFilter: 'blur(4px)',
      WebkitBackdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    ref: ref,
    role: "dialog",
    "aria-modal": "true",
    "aria-label": typeof title === 'string' ? title : undefined,
    style: {
      width: '100%',
      maxWidth: width,
      maxHeight: 'calc(100vh - 32px)',
      overflow: 'auto',
      background: 'var(--surface-card)',
      borderRadius: 'var(--radius-dialog)',
      boxShadow: 'var(--shadow-xl)',
      display: 'flex',
      flexDirection: 'column',
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: 12,
      padding: '20px 20px 0'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      gap: 4
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: 0,
      fontSize: 'var(--text-h3)',
      lineHeight: 'var(--lh-h3)',
      fontWeight: 'var(--weight-medium)',
      color: 'var(--text-strong)',
      letterSpacing: '-0.01em'
    }
  }, title), description && /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: 'var(--text-body-md)',
      color: 'var(--text-sub)'
    }
  }, description)), /*#__PURE__*/React.createElement(__ds_scope.IconButton, {
    icon: "cancel-01",
    label: "Fechar",
    variant: "ghost",
    size: "sm",
    onClick: onClose
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 20
    }
  }, children), footer && /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      justifyContent: 'flex-end',
      padding: '16px 20px',
      borderTop: '1px solid var(--border-soft)'
    }
  }, footer)));
}
Object.assign(__ds_scope, { Dialog });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Dialog.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Toast.jsx
try { (() => {
const IC = {
  success: ['checkmark-circle-02', 'var(--green-500)'],
  danger: ['alert-circle', 'var(--red-500)'],
  warning: ['alert-02', 'var(--orange-500)'],
  info: ['information-circle', 'var(--blue-400)']
};
function Toast({
  tone = 'success',
  title,
  message,
  action,
  onClose,
  style
}) {
  const [ic, c] = IC[tone] || IC.info;
  return /*#__PURE__*/React.createElement("div", {
    role: tone === 'danger' ? 'alert' : 'status',
    style: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: 12,
      padding: '12px 14px',
      minWidth: 280,
      maxWidth: 420,
      background: 'var(--surface-inverse)',
      color: 'var(--text-inverse)',
      borderRadius: 'var(--radius-lg)',
      boxShadow: 'var(--shadow-xl)',
      ...style
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: ic,
    size: 20,
    color: c,
    style: {
      marginTop: 1
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      gap: 2,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--text-body-md)',
      fontWeight: 'var(--weight-medium)'
    }
  }, title), message && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--text-body-sm)',
      color: 'var(--inverse-text-sub)'
    }
  }, message)), action, onClose && /*#__PURE__*/React.createElement("button", {
    type: "button",
    "aria-label": "Fechar",
    onClick: onClose,
    style: {
      border: 0,
      background: 'transparent',
      color: 'var(--inverse-text-sub)',
      cursor: 'pointer',
      padding: 0,
      display: 'flex'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "cancel-01",
    size: 16
  })));
}
Object.assign(__ds_scope, { Toast });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Toast.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Tooltip.jsx
try { (() => {
function Tooltip({
  content,
  placement = 'top',
  children
}) {
  const [open, setOpen] = React.useState(false);
  const pos = placement === 'bottom' ? {
    top: 'calc(100% + 6px)'
  } : {
    bottom: 'calc(100% + 6px)'
  };
  return /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'relative',
      display: 'inline-flex'
    },
    onMouseEnter: () => setOpen(true),
    onMouseLeave: () => setOpen(false),
    onFocus: () => setOpen(true),
    onBlur: () => setOpen(false)
  }, children, open && /*#__PURE__*/React.createElement("span", {
    role: "tooltip",
    style: {
      position: 'absolute',
      left: '50%',
      transform: 'translateX(-50%)',
      ...pos,
      zIndex: 50,
      whiteSpace: 'nowrap',
      padding: '6px 8px',
      borderRadius: 'var(--radius-sm)',
      background: 'var(--surface-inverse)',
      color: 'var(--text-inverse)',
      fontSize: 'var(--text-caption)',
      lineHeight: 'var(--lh-caption)',
      fontWeight: 'var(--weight-medium)',
      boxShadow: 'var(--shadow-md)',
      pointerEvents: 'none'
    }
  }, content));
}
Object.assign(__ds_scope, { Tooltip });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Tooltip.jsx", error: String((e && e.message) || e) }); }

// components/forms/Checkbox.jsx
try { (() => {
function Checkbox({
  checked,
  defaultChecked,
  onChange,
  label,
  disabled = false,
  size = 16,
  id,
  style
}) {
  const [inner, setInner] = React.useState(!!defaultChecked);
  const on = checked !== undefined ? checked : inner;
  const toggle = e => {
    if (disabled) return;
    if (checked === undefined) setInner(!on);
    onChange && onChange(!on, e);
  };
  return /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      cursor: disabled ? 'not-allowed' : 'pointer',
      fontSize: 'var(--text-body-md)',
      color: disabled ? 'var(--text-disabled)' : 'var(--text-body)',
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'relative',
      width: size,
      height: size,
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    id: id,
    checked: on,
    disabled: disabled,
    onChange: toggle,
    style: {
      position: 'absolute',
      inset: 0,
      margin: 0,
      opacity: 0,
      cursor: 'inherit'
    }
  }), /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      position: 'absolute',
      inset: 0,
      borderRadius: 4,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: on ? 'var(--action-brand)' : 'var(--surface-card)',
      border: on ? '1px solid var(--action-brand)' : '1.5px solid var(--border-strong)',
      color: 'var(--text-on-color)',
      transition: 'background var(--dur-fast)'
    }
  }, on && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "tick-02",
    size: size - 4
  }))), label);
}
Object.assign(__ds_scope, { Checkbox });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Checkbox.jsx", error: String((e && e.message) || e) }); }

// components/forms/Input.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const H = {
  sm: 'var(--control-sm)',
  md: 'var(--control-md)',
  lg: 'var(--control-lg)',
  counter: 'var(--control-counter)'
};
function Input({
  label,
  hint,
  error,
  prefix,
  suffix,
  leadingIcon,
  size = 'md',
  id,
  value,
  defaultValue,
  onChange,
  placeholder,
  type = 'text',
  inputMode,
  disabled = false,
  readOnly = false,
  autoFocus,
  numeric = false,
  style,
  inputStyle,
  ...rest
}) {
  const [focus, setFocus] = React.useState(false);
  const uid = React.useId ? React.useId() : undefined;
  const iid = id || uid;
  const big = size === 'counter';
  const fs = big ? 'var(--text-counter)' : size === 'lg' ? 'var(--text-body-lg)' : 'var(--text-body-md)';
  const bc = error ? 'var(--danger-solid)' : focus ? 'var(--border-focus)' : 'var(--border-default)';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      minWidth: 0,
      ...style
    }
  }, label && /*#__PURE__*/React.createElement("label", {
    htmlFor: iid,
    style: {
      fontSize: big ? 'var(--text-body-lg)' : 'var(--text-body-sm)',
      fontWeight: 'var(--weight-medium)',
      color: 'var(--text-strong)'
    }
  }, label), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      height: H[size] || H.md,
      padding: '0 ' + (big ? 16 : 12) + 'px',
      background: disabled ? 'var(--surface-sunken)' : 'var(--surface-card)',
      border: '1px solid ' + bc,
      borderRadius: big ? 'var(--radius-lg)' : 'var(--radius-md)',
      boxShadow: focus ? error ? '0 0 0 3px var(--focus-halo-danger)' : '0 0 0 3px var(--focus-halo)' : 'var(--shadow-xs)',
      transition: 'box-shadow var(--dur-fast),border-color var(--dur-fast)'
    }
  }, leadingIcon && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: leadingIcon,
    size: big ? 24 : 18,
    color: "var(--text-soft)"
  }), prefix && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: fs,
      color: 'var(--text-sub)',
      fontVariantNumeric: 'tabular-nums'
    }
  }, prefix), /*#__PURE__*/React.createElement("input", _extends({
    id: iid,
    type: type,
    inputMode: inputMode,
    value: value,
    defaultValue: defaultValue,
    onChange: onChange,
    placeholder: placeholder,
    disabled: disabled,
    readOnly: readOnly,
    autoFocus: autoFocus,
    "aria-invalid": !!error,
    "aria-describedby": error || hint ? iid + '-d' : undefined,
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false)
  }, rest, {
    style: {
      flex: 1,
      minWidth: 0,
      border: 0,
      outline: 'none',
      background: 'transparent',
      fontFamily: 'var(--font-sans)',
      fontSize: fs,
      fontWeight: big ? 'var(--weight-medium)' : 'var(--weight-regular)',
      color: 'var(--text-strong)',
      textAlign: numeric ? 'right' : 'left',
      fontVariantNumeric: numeric ? 'tabular-nums' : undefined,
      height: '100%',
      padding: 0,
      ...inputStyle
    }
  })), suffix && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--text-body-sm)',
      color: 'var(--text-sub)'
    }
  }, suffix)), (error || hint) && /*#__PURE__*/React.createElement("span", {
    id: iid + '-d',
    style: {
      fontSize: 'var(--text-caption)',
      lineHeight: 'var(--lh-caption)',
      color: error ? 'var(--danger-fg)' : 'var(--text-sub)',
      display: 'flex',
      gap: 4,
      alignItems: 'center'
    }
  }, error && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "alert-circle",
    size: 14
  }), error || hint));
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Input.jsx", error: String((e && e.message) || e) }); }

// components/forms/Radio.jsx
try { (() => {
function Radio({
  name,
  value,
  checked,
  onChange,
  label,
  description,
  disabled = false,
  size = 18,
  style
}) {
  return /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'inline-flex',
      alignItems: description ? 'flex-start' : 'center',
      gap: 10,
      cursor: disabled ? 'not-allowed' : 'pointer',
      color: disabled ? 'var(--text-disabled)' : 'var(--text-body)',
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'relative',
      width: size,
      height: size,
      flexShrink: 0,
      marginTop: description ? 1 : 0
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "radio",
    name: name,
    value: value,
    checked: checked,
    disabled: disabled,
    onChange: e => onChange && onChange(value, e),
    style: {
      position: 'absolute',
      inset: 0,
      margin: 0,
      opacity: 0,
      cursor: 'inherit'
    }
  }), /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      position: 'absolute',
      inset: 0,
      borderRadius: '50%',
      border: checked ? '1px solid var(--action-brand)' : '1.5px solid var(--border-strong)',
      background: 'var(--surface-card)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, checked && /*#__PURE__*/React.createElement("span", {
    style: {
      width: size * 0.55,
      height: size * 0.55,
      borderRadius: '50%',
      background: 'var(--action-brand)'
    }
  }))), (label || description) && /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 2
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--text-body-md)',
      color: 'var(--text-strong)',
      fontWeight: 'var(--weight-medium)'
    }
  }, label), description && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--text-body-sm)',
      color: 'var(--text-sub)'
    }
  }, description)));
}
Object.assign(__ds_scope, { Radio });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Radio.jsx", error: String((e && e.message) || e) }); }

// components/forms/Select.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const H = {
  sm: 'var(--control-sm)',
  md: 'var(--control-md)',
  lg: 'var(--control-lg)',
  counter: 'var(--control-counter)'
};
function Select({
  label,
  options = [],
  value,
  defaultValue,
  onChange,
  size = 'md',
  placeholder,
  disabled = false,
  id,
  style,
  ...rest
}) {
  const [focus, setFocus] = React.useState(false);
  const uid = React.useId ? React.useId() : undefined;
  const iid = id || uid;
  const big = size === 'counter';
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      minWidth: 0,
      ...style
    }
  }, label && /*#__PURE__*/React.createElement("label", {
    htmlFor: iid,
    style: {
      fontSize: big ? 'var(--text-body-lg)' : 'var(--text-body-sm)',
      fontWeight: 'var(--weight-medium)',
      color: 'var(--text-strong)'
    }
  }, label), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      height: H[size] || H.md
    }
  }, /*#__PURE__*/React.createElement("select", _extends({
    id: iid,
    value: value,
    defaultValue: defaultValue,
    onChange: onChange,
    disabled: disabled,
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false)
  }, rest, {
    style: {
      appearance: 'none',
      WebkitAppearance: 'none',
      width: '100%',
      height: '100%',
      padding: '0 36px 0 12px',
      fontFamily: 'var(--font-sans)',
      fontSize: big ? 'var(--text-counter)' : 'var(--text-body-md)',
      color: 'var(--text-strong)',
      background: disabled ? 'var(--surface-sunken)' : 'var(--surface-card)',
      border: '1px solid ' + (focus ? 'var(--border-focus)' : 'var(--border-default)'),
      borderRadius: big ? 'var(--radius-lg)' : 'var(--radius-md)',
      boxShadow: focus ? '0 0 0 3px var(--focus-halo)' : 'var(--shadow-xs)',
      outline: 'none',
      cursor: disabled ? 'not-allowed' : 'pointer'
    }
  }), placeholder && /*#__PURE__*/React.createElement("option", {
    value: "",
    disabled: true
  }, placeholder), options.map(o => {
    const v = typeof o === 'string' ? o : o.value;
    const l = typeof o === 'string' ? o : o.label;
    return /*#__PURE__*/React.createElement("option", {
      key: v,
      value: v
    }, l);
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      right: 12,
      top: '50%',
      transform: 'translateY(-50%)',
      pointerEvents: 'none',
      color: 'var(--text-sub)'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "arrow-down-01",
    size: 16
  }))));
}
Object.assign(__ds_scope, { Select });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Select.jsx", error: String((e && e.message) || e) }); }

// components/forms/Switch.jsx
try { (() => {
function Switch({
  checked,
  defaultChecked,
  onChange,
  label,
  disabled = false,
  style
}) {
  const [inner, setInner] = React.useState(!!defaultChecked);
  const on = checked !== undefined ? checked : inner;
  const toggle = () => {
    if (disabled) return;
    if (checked === undefined) setInner(!on);
    onChange && onChange(!on);
  };
  return /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 10,
      cursor: disabled ? 'not-allowed' : 'pointer',
      fontSize: 'var(--text-body-md)',
      color: disabled ? 'var(--text-disabled)' : 'var(--text-body)',
      ...style
    }
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    role: "switch",
    "aria-checked": on,
    disabled: disabled,
    onClick: toggle,
    style: {
      width: 36,
      height: 20,
      borderRadius: 999,
      border: 0,
      padding: 2,
      background: on ? 'var(--action-brand)' : 'var(--switch-off)',
      cursor: 'inherit',
      display: 'flex',
      transition: 'background var(--dur-base) var(--ease-out)',
      outlineOffset: 2
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 16,
      height: 16,
      borderRadius: '50%',
      background: '#fff',
      boxShadow: '0 1px 2px rgba(14,18,27,.2)',
      transform: on ? 'translateX(16px)' : 'none',
      transition: 'transform var(--dur-base) var(--ease-out)'
    }
  })), label);
}
Object.assign(__ds_scope, { Switch });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Switch.jsx", error: String((e && e.message) || e) }); }

// components/navigation/BottomNav.jsx
try { (() => {
function BottomNav({
  items = [],
  value,
  onSelect,
  style
}) {
  return /*#__PURE__*/React.createElement("nav", {
    "aria-label": "Principal",
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 4,
      padding: 6,
      background: 'var(--bottom-nav-bg)',
      borderRadius: 'var(--radius-full)',
      boxShadow: 'var(--shadow-xl)',
      ...style
    }
  }, items.map(it => {
    const on = it.value === value;
    return /*#__PURE__*/React.createElement("button", {
      key: it.value,
      type: "button",
      onClick: () => onSelect && onSelect(it.value),
      "aria-current": on ? 'page' : undefined,
      "aria-label": it.label,
      style: {
        flex: on ? '0 0 auto' : 1,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        height: 48,
        minWidth: 48,
        padding: on ? '0 18px' : '0 8px',
        border: 0,
        borderRadius: 999,
        background: on ? 'var(--action-brand)' : 'transparent',
        color: on ? 'var(--text-on-color)' : 'var(--bottom-nav-fg)',
        fontFamily: 'var(--font-sans)',
        fontSize: 'var(--text-body-sm)',
        fontWeight: 'var(--weight-medium)',
        cursor: 'pointer',
        transition: 'all var(--dur-base) var(--ease-out)'
      }
    }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
      name: it.icon,
      size: 22
    }), on && /*#__PURE__*/React.createElement("span", null, it.label));
  }));
}
Object.assign(__ds_scope, { BottomNav });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/BottomNav.jsx", error: String((e && e.message) || e) }); }

// components/navigation/SidebarNav.jsx
try { (() => {
function Item({
  it,
  active,
  onSelect
}) {
  const [h, setH] = React.useState(false);
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => onSelect && onSelect(it.value),
    "aria-current": active ? 'page' : undefined,
    onMouseEnter: () => setH(true),
    onMouseLeave: () => setH(false),
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      width: '100%',
      height: 36,
      padding: '0 10px',
      border: 0,
      borderRadius: 'var(--radius-md)',
      fontFamily: 'var(--font-sans)',
      fontSize: 'var(--text-body-md)',
      fontWeight: active ? 'var(--weight-medium)' : 'var(--weight-regular)',
      textAlign: 'left',
      cursor: 'pointer',
      background: active ? 'var(--surface-sunken)' : h ? 'var(--surface-hover)' : 'transparent',
      color: active ? 'var(--text-strong)' : 'var(--text-body)'
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: it.icon,
    size: 18,
    color: active ? 'var(--text-strong)' : 'var(--text-sub)'
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }, it.label), it.badge !== undefined && /*#__PURE__*/React.createElement("span", {
    style: {
      minWidth: 20,
      height: 20,
      padding: '0 6px',
      borderRadius: 999,
      background: it.badgeTone === 'danger' ? 'var(--danger-solid)' : 'var(--action-primary)',
      color: it.badgeTone === 'danger' ? 'var(--text-on-color)' : 'var(--text-inverse)',
      fontSize: 11,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: 600
    }
  }, it.badge));
}
function SidebarNav({
  sections = [],
  value,
  onSelect,
  header,
  footer,
  style
}) {
  return /*#__PURE__*/React.createElement("nav", {
    "aria-label": "Principal",
    style: {
      width: 'var(--sidebar-w)',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--surface-card)',
      borderRight: '1px solid var(--border-default)',
      padding: 12,
      gap: 16,
      ...style
    }
  }, header, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
      flex: 1,
      overflowY: 'auto'
    }
  }, sections.map((s, si) => /*#__PURE__*/React.createElement("div", {
    key: si,
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 2
    }
  }, s.title && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--text-caption)',
      color: 'var(--text-soft)',
      padding: '4px 10px'
    }
  }, s.title), s.items.map(it => /*#__PURE__*/React.createElement(Item, {
    key: it.value,
    it: it,
    active: it.value === value,
    onSelect: onSelect
  }))))), footer);
}
Object.assign(__ds_scope, { SidebarNav });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/SidebarNav.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Tabs.jsx
try { (() => {
function Tabs({
  items = [],
  value,
  onChange,
  size = 'md',
  fullWidth = false,
  ariaLabel,
  style
}) {
  const h = size === 'counter' ? 'var(--control-counter)' : size === 'sm' ? 30 : 36;
  const fs = size === 'counter' ? 'var(--text-counter)' : size === 'sm' ? 'var(--text-body-sm)' : 'var(--text-body-md)';
  const onKey = (e, i) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const n = (i + (e.key === 'ArrowRight' ? 1 : -1) + items.length) % items.length;
    onChange && onChange(items[n].value);
    const b = e.currentTarget.parentNode.children[n];
    b && b.focus();
  };
  return /*#__PURE__*/React.createElement("div", {
    role: "tablist",
    "aria-label": ariaLabel,
    style: {
      display: fullWidth ? 'flex' : 'inline-flex',
      gap: 4,
      padding: 4,
      background: 'var(--surface-sunken)',
      borderRadius: size === 'counter' ? 'var(--radius-xl)' : 'var(--radius-lg)',
      ...style
    }
  }, items.map((it, i) => {
    const on = it.value === value;
    return /*#__PURE__*/React.createElement("button", {
      key: it.value,
      role: "tab",
      type: "button",
      "aria-selected": on,
      tabIndex: on ? 0 : -1,
      onClick: () => onChange && onChange(it.value),
      onKeyDown: e => onKey(e, i),
      style: {
        flex: fullWidth ? 1 : undefined,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        height: h,
        padding: '0 ' + (size === 'counter' ? 20 : 14) + 'px',
        border: 0,
        borderRadius: size === 'counter' ? 'var(--radius-lg)' : 'var(--radius-md)',
        fontFamily: 'var(--font-sans)',
        fontSize: fs,
        fontWeight: 'var(--weight-medium)',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        background: on ? 'var(--action-primary)' : 'transparent',
        color: on ? 'var(--text-inverse)' : 'var(--text-sub)',
        boxShadow: on ? 'var(--shadow-btn-dark)' : 'none',
        transition: 'background var(--dur-base) var(--ease-out),color var(--dur-base)',
        touchAction: 'manipulation'
      }
    }, it.icon && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
      name: it.icon,
      size: size === 'counter' ? 24 : 16
    }), it.label, it.count !== undefined && /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 'var(--text-caption)',
        padding: '1px 6px',
        borderRadius: 999,
        background: on ? 'var(--surface-hover)' : 'var(--count-bg)',
        color: on ? 'var(--text-strong)' : 'var(--text-sub)'
      }
    }, it.count));
  }));
}
Object.assign(__ds_scope, { Tabs });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Tabs.jsx", error: String((e && e.message) || e) }); }

// ui_kits/mkt-control/App.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function App() {
  const {
    Toast
  } = NS;
  const D = window.MKT_DATA;
  const [user, setUser] = React.useState(() => {
    try {
      return JSON.parse(localStorage.getItem('mkt_user')) || null;
    } catch (_) {
      return null;
    }
  });
  const [page, setPage] = React.useState('vendas');
  const [products, setProducts] = React.useState(D.products);
  const [caixa, setCaixa] = React.useState({
    open: true,
    troco: 150,
    openedAt: '07:58',
    movs: [{
      id: 1,
      time: '07:58',
      type: 'abertura',
      value: 150,
      desc: 'Troco inicial'
    }, {
      id: 2,
      time: '09:14',
      type: 'venda',
      pay: 'dinheiro',
      value: 42.37,
      desc: 'Venda #1042 · Dinheiro'
    }, {
      id: 3,
      time: '11:30',
      type: 'sangria',
      value: 200,
      desc: 'Depósito no banco'
    }, {
      id: 4,
      time: '12:05',
      type: 'suprimento',
      value: 50,
      desc: 'Reforço de troco (moedas)'
    }]
  });
  const [sales, setSales] = React.useState([]);
  const [hidden, setHidden] = React.useState(false);
  const [theme, setTheme] = React.useState(() => localStorage.getItem('mkt_theme') || (window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('mkt_theme', theme);
  }, [theme]);
  const [toastData, setToastData] = React.useState(null);
  const tRef = React.useRef();
  const toast = t => {
    setToastData(t);
    clearTimeout(tRef.current);
    tRef.current = setTimeout(() => setToastData(null), 3200);
  };
  const login = u => {
    setUser(u);
    localStorage.setItem('mkt_user', JSON.stringify(u));
    setPage(u.role === 'ADMIN' ? 'painel' : 'vendas');
  };
  const logout = () => {
    setUser(null);
    localStorage.removeItem('mkt_user');
  };
  const onSale = (cart, total, pay) => {
    let cmv = 0;
    setProducts(ps => ps.map(p => {
      const line = cart.find(l => l.id === p.id);
      if (!line) return p;
      let need = line.qty;
      cmv += r2(p.cost * line.qty);
      const lots = [...p.lots].sort((a, b) => a.exp.localeCompare(b.exp)).map(l => {
        const take = Math.min(l.qty, need);
        need -= take;
        return {
          ...l,
          qty: l.qty - take
        };
      });
      return {
        ...p,
        lots
      };
    }));
    const id = 1043 + sales.length;
    setSales(s => [...s, {
      id,
      total,
      cmv: r2(cart.reduce((s2, l) => s2 + r2(products.find(p => p.id === l.id).cost * l.qty), 0)),
      pay
    }]);
    setCaixa(c => ({
      ...c,
      movs: [...c.movs, {
        id: Date.now(),
        time: new Date().toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit'
        }),
        type: 'venda',
        pay,
        value: total,
        desc: 'Venda #' + id + ' · ' + {
          dinheiro: 'Dinheiro',
          pix: 'Pix',
          cartao: 'Cartão'
        }[pay]
      }]
    }));
  };
  if (!user) return /*#__PURE__*/React.createElement(Login, {
    onLogin: login,
    theme: theme,
    setTheme: setTheme
  });
  const alerts = products.filter(p => stockOf(p) < p.min).length + products.flatMap(p => p.lots).filter(l => l.qty > 0 && daysTo(l.exp) < 0).length;
  const pg = user.role !== 'ADMIN' && page === 'painel' ? 'vendas' : page;
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Shell, {
    user: user,
    page: pg,
    setPage: setPage,
    caixaOpen: caixa.open,
    hidden: hidden,
    setHidden: setHidden,
    onLogout: logout,
    alerts: alerts,
    theme: theme,
    setTheme: setTheme
  }, pg === 'painel' && /*#__PURE__*/React.createElement(Painel, {
    user: user,
    products: products,
    sales: sales,
    hidden: hidden,
    setPage: setPage
  }), pg === 'vendas' && /*#__PURE__*/React.createElement(Vendas, {
    caixaOpen: caixa.open,
    products: products,
    onSale: onSale,
    goCaixa: () => setPage('caixa'),
    toast: toast
  }), pg === 'caixa' && /*#__PURE__*/React.createElement(Caixa, {
    user: user,
    caixa: caixa,
    setCaixa: setCaixa,
    toast: toast
  }), pg === 'estoque' && /*#__PURE__*/React.createElement(Estoque, {
    user: user,
    products: products,
    setProducts: setProducts,
    toast: toast
  })), toastData && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'fixed',
      right: 24,
      bottom: 24,
      zIndex: 200
    }
  }, /*#__PURE__*/React.createElement(Toast, _extends({}, toastData, {
    onClose: () => setToastData(null)
  }))));
}
ReactDOM.createRoot(document.getElementById('root')).render(/*#__PURE__*/React.createElement(App, null));
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/mkt-control/App.jsx", error: String((e && e.message) || e) }); }

// ui_kits/mkt-control/Caixa.jsx
try { (() => {
function AmountDialog({
  open,
  kind,
  onClose,
  onConfirm,
  requireReason
}) {
  const {
    Dialog,
    Button,
    Keypad,
    Money,
    Input
  } = NS;
  const [d, setD] = React.useState('');
  const [motivo, setMotivo] = React.useState('');
  const [err, setErr] = React.useState('');
  React.useEffect(() => {
    if (open) {
      setD('');
      setMotivo('');
      setErr('');
    }
  }, [open]);
  const meta = {
    sangria: ['Registrar sangria', 'Retirada de dinheiro da gaveta.'],
    suprimento: ['Registrar suprimento', 'Entrada de dinheiro na gaveta.'],
    abrir: ['Abrir caixa', 'Informe o troco disponível na gaveta.'],
    fechar: ['Fechamento cego', 'Conte o dinheiro da gaveta e informe o total. O valor esperado não é exibido.']
  }[kind] || ['', ''];
  const ok = () => {
    if (requireReason && !motivo.trim()) {
      setErr('Informe o motivo.');
      return;
    }
    onConfirm(centsToBRL(d), motivo.trim());
  };
  return /*#__PURE__*/React.createElement(Dialog, {
    open: open,
    onClose: onClose,
    title: meta[0],
    description: meta[1],
    width: 440,
    footer: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Button, {
      variant: "secondary",
      size: "counter",
      onClick: onClose
    }, "Cancelar"), /*#__PURE__*/React.createElement(Button, {
      variant: "brand",
      size: "counter",
      onClick: ok,
      disabled: kind !== 'abrir' && !d
    }, "Confirmar"))
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '12px 16px',
      borderRadius: 'var(--radius-lg)',
      background: 'var(--surface-sunken)',
      textAlign: 'right'
    }
  }, /*#__PURE__*/React.createElement(Money, {
    value: centsToBRL(d),
    size: "counter",
    mutedCents: false
  })), /*#__PURE__*/React.createElement(Keypad, {
    value: d,
    onChange: setD
  }), requireReason && /*#__PURE__*/React.createElement(Input, {
    label: "Motivo",
    size: "counter",
    value: motivo,
    onChange: e => {
      setMotivo(e.target.value);
      setErr('');
    },
    error: err,
    placeholder: kind === 'sangria' ? 'Ex.: depósito no banco' : 'Ex.: reforço de troco'
  })));
}
function Caixa({
  user,
  caixa,
  setCaixa,
  toast
}) {
  const {
    Button,
    Card,
    StatCard,
    Table,
    Badge,
    Money
  } = NS;
  const [dlg, setDlg] = React.useState(null);
  const [result, setResult] = React.useState(null);
  const admin = user.role === 'ADMIN';
  const now = () => new Date().toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit'
  });
  const movs = caixa.movs;
  const sum = t => r2(movs.filter(m => m.type === t).reduce((s, m) => s + m.value, 0));
  const vendasDin = r2(movs.filter(m => m.type === 'venda' && m.pay === 'dinheiro').reduce((s, m) => s + m.value, 0));
  const esperado = r2(caixa.troco + vendasDin + sum('suprimento') - sum('sangria'));
  const confirm = (v, motivo) => {
    if (dlg === 'abrir') {
      setCaixa({
        open: true,
        troco: v,
        openedAt: now(),
        movs: [{
          id: Date.now(),
          time: now(),
          type: 'abertura',
          value: v,
          desc: 'Troco inicial'
        }]
      });
      toast({
        tone: 'success',
        title: 'Caixa aberto',
        message: 'Troco inicial ' + brl(v)
      });
      setResult(null);
    } else if (dlg === 'fechar') {
      const quebra = r2(v - esperado);
      setResult({
        contado: v,
        esperado,
        quebra
      });
      setCaixa({
        open: false,
        troco: 0,
        movs: []
      });
      toast({
        tone: quebra === 0 ? 'success' : 'warning',
        title: 'Caixa fechado',
        message: admin ? quebra === 0 ? 'Sem quebra.' : 'Quebra de ' + brl(quebra) : 'Contagem registrada.'
      });
    } else {
      setCaixa({
        ...caixa,
        movs: [...movs, {
          id: Date.now(),
          time: now(),
          type: dlg,
          value: v,
          desc: motivo
        }]
      });
      toast({
        tone: 'success',
        title: dlg === 'sangria' ? 'Sangria registrada' : 'Suprimento registrado',
        message: brl(v) + ' · ' + motivo
      });
    }
    setDlg(null);
  };
  const typeBadge = {
    abertura: ['info', 'Abertura'],
    venda: ['success', 'Venda'],
    sangria: ['danger', 'Sangria'],
    suprimento: ['warning', 'Suprimento']
  };
  const dialog = /*#__PURE__*/React.createElement(AmountDialog, {
    open: !!dlg,
    kind: dlg,
    onClose: () => setDlg(null),
    onConfirm: confirm,
    requireReason: dlg === 'sangria' || dlg === 'suprimento'
  });
  if (!caixa.open) return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--gutter)',
      maxWidth: 720
    }
  }, result && /*#__PURE__*/React.createElement(Card, {
    title: "\xDAltimo fechamento",
    subtitle: "Hoje"
  }, admin ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3,minmax(0,1fr))',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      color: 'var(--text-sub)',
      fontSize: 13
    }
  }, "Esperado"), /*#__PURE__*/React.createElement(Money, {
    value: result.esperado,
    size: "lg"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      color: 'var(--text-sub)',
      fontSize: 13
    }
  }, "Contado"), /*#__PURE__*/React.createElement(Money, {
    value: result.contado,
    size: "lg"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      color: 'var(--text-sub)',
      fontSize: 13
    }
  }, "Quebra"), /*#__PURE__*/React.createElement(Money, {
    value: result.quebra,
    size: "lg",
    signed: true,
    tone: result.quebra < 0 ? 'out' : result.quebra > 0 ? 'in' : undefined
  }))) : /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      color: 'var(--text-sub)',
      fontSize: 16
    }
  }, "Contagem de ", brl(result.contado), " registrada. A confer\xEAncia \xE9 feita pelo administrador.")), /*#__PURE__*/React.createElement(Card, {
    bodyStyle: {
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
      alignItems: 'flex-start'
    }
  }, /*#__PURE__*/React.createElement(Badge, {
    tone: "neutral",
    dot: true
  }, "Caixa fechado"), /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: 0,
      fontSize: 'var(--text-h2)',
      fontWeight: 500,
      color: 'var(--text-strong)'
    }
  }, "Abrir caixa"), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      color: 'var(--text-sub)',
      fontSize: 16
    }
  }, "S\xF3 um caixa pode ficar aberto por vez. Sem caixa aberto, nenhuma venda \xE9 registrada."), /*#__PURE__*/React.createElement(Button, {
    size: "counter",
    variant: "brand",
    leadingIcon: "cash-01",
    onClick: () => setDlg('abrir')
  }, "Abrir caixa")), dialog);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--gutter)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement(Badge, {
    tone: "success",
    dot: true
  }, "Aberto \xE0s ", caixa.openedAt), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text-sub)'
    }
  }, "por ", user.name)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))',
      gap: 'var(--gutter)'
    }
  }, /*#__PURE__*/React.createElement(StatCard, {
    label: "Troco inicial",
    icon: "coins-01",
    value: caixa.troco
  }), /*#__PURE__*/React.createElement(StatCard, {
    label: "Sangrias",
    icon: "money-send-01",
    value: sum('sangria')
  }), /*#__PURE__*/React.createElement(StatCard, {
    label: "Suprimentos",
    icon: "money-receive-01",
    value: sum('suprimento')
  }), admin && /*#__PURE__*/React.createElement(StatCard, {
    label: "Esperado na gaveta",
    icon: "wallet-01",
    value: esperado
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(Button, {
    size: "counter",
    variant: "secondary",
    leadingIcon: "money-send-01",
    onClick: () => setDlg('sangria')
  }, "Sangria"), /*#__PURE__*/React.createElement(Button, {
    size: "counter",
    variant: "secondary",
    leadingIcon: "money-receive-01",
    onClick: () => setDlg('suprimento')
  }, "Suprimento"), /*#__PURE__*/React.createElement(Button, {
    size: "counter",
    variant: "primary",
    leadingIcon: "lock-key",
    onClick: () => setDlg('fechar')
  }, "Fechar caixa")), /*#__PURE__*/React.createElement(Card, {
    title: "Movimentos",
    padding: "8px 12px 4px"
  }, /*#__PURE__*/React.createElement(Table, {
    rowKey: "id",
    columns: [{
      key: 'time',
      label: 'Hora',
      width: 72
    }, {
      key: 'type',
      label: 'Tipo',
      render: r => /*#__PURE__*/React.createElement(Badge, {
        size: "sm",
        tone: typeBadge[r.type][0]
      }, typeBadge[r.type][1])
    }, {
      key: 'desc',
      label: 'Descrição',
      wrap: true
    }, {
      key: 'value',
      label: 'Valor',
      align: 'right',
      render: r => /*#__PURE__*/React.createElement(Money, {
        value: r.type === 'sangria' ? -r.value : r.value,
        size: "sm",
        tone: r.type === 'sangria' ? 'out' : undefined
      })
    }],
    rows: [...movs].reverse()
  })), dialog);
}
window.Caixa = Caixa;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/mkt-control/Caixa.jsx", error: String((e && e.message) || e) }); }

// ui_kits/mkt-control/Estoque.jsx
try { (() => {
function EntradaDialog({
  open,
  onClose,
  products,
  onSave
}) {
  const {
    Dialog,
    Button,
    Input,
    Select
  } = NS;
  const [pid, setPid] = React.useState(products[0].id);
  const [f, setF] = React.useState({
    lote: '',
    exp: '',
    qty: '',
    cost: ''
  });
  React.useEffect(() => {
    if (open) setF({
      lote: '',
      exp: '',
      qty: '',
      cost: ''
    });
  }, [open]);
  const set = k => e => setF({
    ...f,
    [k]: e.target.value
  });
  const valid = f.lote && f.exp && Number(f.qty) > 0;
  return /*#__PURE__*/React.createElement(Dialog, {
    open: open,
    onClose: onClose,
    title: "Entrada de mercadoria",
    description: "Cada entrada cria um lote com validade pr\xF3pria.",
    width: 520,
    footer: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Button, {
      variant: "secondary",
      size: "counter",
      onClick: onClose
    }, "Cancelar"), /*#__PURE__*/React.createElement(Button, {
      variant: "brand",
      size: "counter",
      disabled: !valid,
      onClick: () => onSave(pid, {
        code: f.lote,
        exp: f.exp,
        qty: Number(f.qty)
      }, Number(String(f.cost).replace(',', '.')) || null)
    }, "Registrar entrada"))
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement(Select, {
    label: "Produto",
    size: "counter",
    value: pid,
    onChange: e => setPid(e.target.value),
    options: products.map(p => ({
      value: p.id,
      label: p.name
    })),
    style: {
      gridColumn: '1 / -1'
    }
  }), /*#__PURE__*/React.createElement(Input, {
    label: "Lote",
    size: "counter",
    value: f.lote,
    onChange: set('lote'),
    placeholder: "L2501"
  }), /*#__PURE__*/React.createElement(Input, {
    label: "Validade",
    size: "counter",
    type: "date",
    value: f.exp,
    onChange: set('exp')
  }), /*#__PURE__*/React.createElement(Input, {
    label: "Quantidade",
    size: "counter",
    numeric: true,
    inputMode: "numeric",
    value: f.qty,
    onChange: set('qty')
  }), /*#__PURE__*/React.createElement(Input, {
    label: "Custo unit\xE1rio",
    size: "counter",
    prefix: "R$",
    numeric: true,
    inputMode: "decimal",
    value: f.cost,
    onChange: set('cost')
  })));
}
function Estoque({
  user,
  products,
  setProducts,
  toast
}) {
  const {
    Tabs,
    Card,
    Table,
    Badge,
    Money,
    Input,
    Button,
    Tag
  } = NS;
  const admin = user.role === 'ADMIN';
  const [tab, setTab] = React.useState('produtos');
  const [q, setQ] = React.useState('');
  const [entrada, setEntrada] = React.useState(false);
  const list = products.filter(p => (p.name + p.sku + p.cat).toLowerCase().includes(q.toLowerCase()));
  const repo = products.filter(p => stockOf(p) < p.min);
  const lots = products.flatMap(p => p.lots.map(l => ({
    ...l,
    pid: p.id,
    name: p.name,
    key: p.id + l.code
  }))).filter(l => l.qty > 0).sort((a, b) => a.exp.localeCompare(b.exp));
  const stockBadge = p => {
    const s = stockOf(p);
    return s === 0 ? /*#__PURE__*/React.createElement(Badge, {
      size: "sm",
      tone: "danger",
      dot: true
    }, "Sem estoque") : s < p.min ? /*#__PURE__*/React.createElement(Badge, {
      size: "sm",
      tone: "warning",
      dot: true
    }, "Abaixo do m\xEDnimo") : /*#__PURE__*/React.createElement(Badge, {
      size: "sm",
      tone: "success",
      dot: true
    }, "Ok");
  };
  const cols = [{
    key: 'name',
    label: 'Produto',
    render: p => /*#__PURE__*/React.createElement("span", {
      style: {
        display: 'flex',
        flexDirection: 'column'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontWeight: 500
      }
    }, p.name), /*#__PURE__*/React.createElement("span", {
      style: {
        color: 'var(--text-soft)',
        fontSize: 12
      }
    }, p.sku))
  }, {
    key: 'cat',
    label: 'Categoria',
    render: p => /*#__PURE__*/React.createElement(Tag, null, p.cat)
  }, {
    key: 'stock',
    label: 'Estoque',
    align: 'right',
    render: p => stockOf(p) + ' ' + p.unit
  }, ...(admin ? [{
    key: 'min',
    label: 'Mínimo',
    align: 'right',
    render: p => p.min + ' ' + p.unit
  }, {
    key: 'cost',
    label: 'Custo',
    align: 'right',
    render: p => /*#__PURE__*/React.createElement(Money, {
      value: p.cost,
      size: "sm"
    })
  }] : []), {
    key: 'price',
    label: 'Preço',
    align: 'right',
    render: p => /*#__PURE__*/React.createElement(Money, {
      value: p.price,
      size: "sm"
    })
  }, ...(admin ? [{
    key: 'mg',
    label: 'Margem',
    align: 'right',
    render: p => /*#__PURE__*/React.createElement("span", {
      style: {
        color: 'var(--success-fg)',
        fontWeight: 500
      }
    }, ((p.price - p.cost) / p.price * 100).toFixed(1).replace('.', ','), "%")
  }] : []), {
    key: 'st',
    label: 'Situação',
    render: stockBadge
  }];
  const tabs = [{
    value: 'produtos',
    label: 'Produtos'
  }, ...(admin ? [{
    value: 'lotes',
    label: 'Lotes (PVPS)'
  }, {
    value: 'reposicao',
    label: 'Reposição',
    count: repo.length
  }] : [])];
  const save = (pid, lot, cost) => {
    setProducts(ps => ps.map(p => p.id === pid ? {
      ...p,
      cost: cost || p.cost,
      lots: [...p.lots, lot]
    } : p));
    setEntrada(false);
    toast({
      tone: 'success',
      title: 'Entrada registrada',
      message: 'Lote ' + lot.code + ' · ' + lot.qty + ' un'
    });
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--gutter)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 12,
      alignItems: 'center',
      flexWrap: 'wrap'
    }
  }, tabs.length > 1 && /*#__PURE__*/React.createElement(Tabs, {
    items: tabs,
    value: tab,
    onChange: setTab,
    ariaLabel: "Vis\xE3o do estoque"
  }), /*#__PURE__*/React.createElement(Input, {
    leadingIcon: "search-01",
    placeholder: "Buscar por nome, c\xF3digo ou categoria",
    value: q,
    onChange: e => setQ(e.target.value),
    style: {
      flex: 1,
      minWidth: 220
    },
    "aria-label": "Buscar"
  }), admin && /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    leadingIcon: "file-import"
  }, "Importar produtos"), admin && /*#__PURE__*/React.createElement(Button, {
    variant: "brand",
    size: "counter",
    leadingIcon: "package-receive",
    onClick: () => setEntrada(true)
  }, "Entrada")), tab === 'produtos' && /*#__PURE__*/React.createElement(Card, {
    padding: "8px 12px 4px"
  }, /*#__PURE__*/React.createElement(Table, {
    rowKey: "id",
    columns: cols,
    rows: list,
    empty: "Nenhum produto encontrado."
  })), tab === 'lotes' && /*#__PURE__*/React.createElement(Card, {
    title: "Lotes por validade",
    subtitle: "A baixa nas vendas sempre consome primeiro o lote do topo de cada produto.",
    padding: "8px 12px 4px"
  }, /*#__PURE__*/React.createElement(Table, {
    rowKey: "key",
    columns: [{
      key: 'name',
      label: 'Produto'
    }, {
      key: 'code',
      label: 'Lote'
    }, {
      key: 'exp',
      label: 'Validade',
      render: l => fmtDate(l.exp)
    }, {
      key: 'st',
      label: 'Situação',
      render: l => {
        const b = expiryBadge(l.exp);
        return /*#__PURE__*/React.createElement(Badge, {
          size: "sm",
          tone: b.tone,
          dot: true
        }, b.label);
      }
    }, {
      key: 'qty',
      label: 'Qtd.',
      align: 'right'
    }],
    rows: lots.filter(l => l.name.toLowerCase().includes(q.toLowerCase()))
  })), tab === 'reposicao' && /*#__PURE__*/React.createElement(Card, {
    title: "Lista de reposi\xE7\xE3o",
    subtitle: "Gerada a partir do estoque m\xEDnimo de cada produto.",
    actions: /*#__PURE__*/React.createElement(Button, {
      variant: "secondary",
      size: "sm",
      leadingIcon: "printer"
    }, "Imprimir"),
    padding: "8px 12px 4px"
  }, /*#__PURE__*/React.createElement(Table, {
    rowKey: "id",
    columns: [{
      key: 'name',
      label: 'Produto'
    }, {
      key: 's',
      label: 'Estoque',
      align: 'right',
      render: p => stockOf(p) + ' ' + p.unit
    }, {
      key: 'min',
      label: 'Mínimo',
      align: 'right',
      render: p => p.min + ' ' + p.unit
    }, {
      key: 'sug',
      label: 'Comprar',
      align: 'right',
      render: p => /*#__PURE__*/React.createElement("strong", {
        style: {
          fontWeight: 600
        }
      }, p.min * 2 - stockOf(p), " ", p.unit)
    }, {
      key: 'c',
      label: 'Custo estimado',
      align: 'right',
      render: p => /*#__PURE__*/React.createElement(Money, {
        value: r2(p.cost * (p.min * 2 - stockOf(p))),
        size: "sm"
      })
    }],
    rows: repo,
    empty: "Nada abaixo do m\xEDnimo."
  })), /*#__PURE__*/React.createElement(EntradaDialog, {
    open: entrada,
    onClose: () => setEntrada(false),
    products: products,
    onSave: save
  }));
}
window.Estoque = Estoque;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/mkt-control/Estoque.jsx", error: String((e && e.message) || e) }); }

// ui_kits/mkt-control/Login.jsx
try { (() => {
function Login({
  onLogin,
  theme,
  setTheme
}) {
  const {
    Button,
    Input,
    Card
  } = NS;
  const users = window.MKT_DATA.users;
  const [email, setEmail] = React.useState(users[0].email);
  const [err, setErr] = React.useState('');
  const submit = e => {
    e.preventDefault();
    const u = users.find(x => x.email === email.trim());
    if (!u) {
      setErr('E-mail ou senha incorretos.');
      return;
    }
    onLogin(u);
  };
  return /*#__PURE__*/React.createElement("main", {
    style: {
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 16,
      right: 16
    }
  }, /*#__PURE__*/React.createElement(ThemeToggle, {
    theme: theme,
    setTheme: setTheme
  })), /*#__PURE__*/React.createElement("form", {
    onSubmit: submit,
    style: {
      width: '100%',
      maxWidth: 400,
      display: 'flex',
      flexDirection: 'column',
      gap: 24
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      alignItems: 'center',
      textAlign: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 28,
      fontWeight: 600,
      letterSpacing: '-0.03em',
      color: 'var(--text-strong)'
    }
  }, "Mkt Control"), /*#__PURE__*/React.createElement("div", {
    style: {
      color: 'var(--text-sub)'
    }
  }, window.MKT_DATA.store)), /*#__PURE__*/React.createElement(Card, {
    padding: "24px",
    bodyStyle: {
      display: 'flex',
      flexDirection: 'column',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: 0,
      fontSize: 'var(--text-h3)',
      fontWeight: 500,
      color: 'var(--text-strong)'
    }
  }, "Entrar"), /*#__PURE__*/React.createElement(Input, {
    label: "E-mail",
    type: "email",
    size: "lg",
    value: email,
    onChange: e => {
      setEmail(e.target.value);
      setErr('');
    },
    error: err,
    autoComplete: "username"
  }), /*#__PURE__*/React.createElement(Input, {
    label: "Senha",
    type: "password",
    size: "lg",
    defaultValue: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022",
    autoComplete: "current-password"
  }), /*#__PURE__*/React.createElement(Button, {
    type: "submit",
    size: "lg",
    fullWidth: true
  }, "Entrar"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      flexWrap: 'wrap',
      justifyContent: 'center',
      fontSize: 'var(--text-caption)',
      color: 'var(--text-sub)'
    }
  }, "Demonstra\xE7\xE3o:", users.map(u => /*#__PURE__*/React.createElement("a", {
    key: u.id,
    href: "#",
    onClick: e => {
      e.preventDefault();
      setEmail(u.email);
    }
  }, u.role === 'ADMIN' ? 'Proprietária' : 'Operador'))))));
}
window.Login = Login;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/mkt-control/Login.jsx", error: String((e && e.message) || e) }); }

// ui_kits/mkt-control/Painel.jsx
try { (() => {
function WeekChart({
  data,
  hidden
}) {
  const max = Math.max(...data.map(d => d.rev));
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 16,
      fontSize: 'var(--text-caption)',
      color: 'var(--text-sub)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 8,
      height: 8,
      borderRadius: 2,
      background: 'var(--chart-primary)'
    }
  }), "Faturamento"), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 8,
      height: 8,
      borderRadius: 2,
      background: 'var(--chart-secondary-legend)'
    }
  }), "CMV")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(' + data.length + ',minmax(0,1fr))',
      gap: 12,
      height: 200,
      alignItems: 'end'
    }
  }, data.map((d, i) => /*#__PURE__*/React.createElement("div", {
    key: d.d,
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 8,
      height: '100%',
      justifyContent: 'flex-end'
    },
    title: hidden ? d.d : d.d + ': ' + brl(d.rev) + ' / CMV ' + brl(d.cmv)
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 3,
      alignItems: 'flex-end',
      height: '100%',
      width: '100%',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: '38%',
      maxWidth: 18,
      height: d.rev / max * 100 + '%',
      background: i === data.length - 1 ? 'var(--chart-primary)' : 'var(--chart-primary-muted)',
      borderRadius: '6px 6px 2px 2px'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      width: '38%',
      maxWidth: 18,
      height: d.cmv / max * 100 + '%',
      background: 'var(--chart-secondary)',
      borderRadius: '6px 6px 2px 2px'
    }
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--text-caption)',
      color: i === data.length - 1 ? 'var(--text-strong)' : 'var(--text-soft)',
      fontWeight: i === data.length - 1 ? 500 : 400
    }
  }, d.d)))));
}
function Painel({
  user,
  products,
  sales,
  hidden,
  setPage
}) {
  const {
    StatCard,
    Card,
    Tabs,
    Badge,
    Button,
    Money,
    IconButton
  } = NS;
  const [period, setPeriod] = React.useState('7d');
  const week = window.MKT_DATA.week;
  const todayRev = r2(week[week.length - 1].rev + sales.reduce((s, v) => s + v.total, 0));
  const todayCmv = r2(week[week.length - 1].cmv + sales.reduce((s, v) => s + v.cmv, 0));
  const rev = period === 'hoje' ? todayRev : r2(week.slice(0, -1).reduce((s, d) => s + d.rev, 0) + todayRev);
  const cmv = period === 'hoje' ? todayCmv : r2(week.slice(0, -1).reduce((s, d) => s + d.cmv, 0) + todayCmv);
  const n = period === 'hoje' ? 41 + sales.length : 312 + sales.length;
  const mg = r2(rev - cmv);
  const lots = products.flatMap(p => p.lots.map(l => ({
    ...l,
    name: p.name
  }))).filter(l => l.qty > 0 && daysTo(l.exp) <= 7).sort((a, b) => a.exp.localeCompare(b.exp));
  const repo = products.filter(p => stockOf(p) < p.min);
  const h = new Date().getHours();
  const hi = h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
  const row = (k, left, right) => /*#__PURE__*/React.createElement("li", {
    key: k,
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      padding: '10px 0',
      borderBottom: '1px solid var(--border-soft)'
    }
  }, left, right);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--gutter)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      gap: 16,
      flexWrap: 'wrap'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--text-body-sm)',
      color: 'var(--text-sub)'
    }
  }, new Date(window.MKT_DATA.today + 'T12:00:00').toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  })), /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: 0,
      fontSize: 'var(--text-h1)',
      lineHeight: 'var(--lh-h1)',
      fontWeight: 500,
      letterSpacing: 'var(--tracking-tight)',
      color: 'var(--text-strong)'
    }
  }, hi, ", ", user.name.split(' ')[0])), /*#__PURE__*/React.createElement(Tabs, {
    items: [{
      value: 'hoje',
      label: 'Hoje'
    }, {
      value: '7d',
      label: '7 dias'
    }],
    value: period,
    onChange: setPeriod,
    ariaLabel: "Per\xEDodo"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))',
      gap: 'var(--gutter)'
    }
  }, /*#__PURE__*/React.createElement(StatCard, {
    label: "Faturamento",
    icon: "money-receive-01",
    value: rev,
    hidden: hidden,
    delta: period === 'hoje' ? 14.7 : 6.3,
    deltaLabel: period === 'hoje' ? 'vs. ontem' : 'vs. semana anterior'
  }), /*#__PURE__*/React.createElement(StatCard, {
    label: "CMV",
    icon: "package",
    value: cmv,
    hidden: hidden,
    footer: "custo hist\xF3rico de cada venda"
  }), /*#__PURE__*/React.createElement(StatCard, {
    label: "Margem bruta",
    icon: "percent",
    value: mg,
    hidden: hidden,
    footer: /*#__PURE__*/React.createElement("span", {
      style: {
        color: 'var(--success-fg)',
        fontWeight: 500
      }
    }, (mg / rev * 100).toFixed(1).replace('.', ','), "% do faturamento")
  }), /*#__PURE__*/React.createElement(StatCard, {
    label: "Ticket m\xE9dio",
    icon: "invoice-03",
    value: r2(rev / n),
    hidden: hidden,
    footer: n + ' vendas'
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))',
      gap: 'var(--gutter)'
    }
  }, /*#__PURE__*/React.createElement(Card, {
    title: "Faturamento x CMV",
    subtitle: "\xDAltimos 7 dias",
    style: {
      gridColumn: 'span 2'
    },
    actions: /*#__PURE__*/React.createElement(IconButton, {
      icon: "more-horizontal",
      label: "Op\xE7\xF5es",
      size: "sm"
    })
  }, /*#__PURE__*/React.createElement(WeekChart, {
    data: week,
    hidden: hidden
  })), /*#__PURE__*/React.createElement(Card, {
    title: "Lotes a vencer",
    subtitle: "Pr\xF3ximos 7 dias",
    actions: /*#__PURE__*/React.createElement(Button, {
      variant: "secondary",
      size: "sm",
      onClick: () => setPage('estoque')
    }, "Ver lotes")
  }, /*#__PURE__*/React.createElement("ul", {
    style: {
      listStyle: 'none',
      margin: 0,
      padding: 0
    }
  }, lots.map(l => {
    const b = expiryBadge(l.exp);
    return row(l.code, /*#__PURE__*/React.createElement("span", {
      style: {
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontWeight: 500,
        color: 'var(--text-strong)'
      }
    }, l.name), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 12,
        color: 'var(--text-soft)'
      }
    }, "Lote ", l.code, " \xB7 ", l.qty, " un")), /*#__PURE__*/React.createElement(Badge, {
      size: "sm",
      tone: b.tone,
      dot: true
    }, b.label));
  }))), /*#__PURE__*/React.createElement(Card, {
    title: "Reposi\xE7\xE3o",
    subtitle: repo.length + ' produtos abaixo do mínimo',
    actions: /*#__PURE__*/React.createElement(Button, {
      variant: "secondary",
      size: "sm",
      onClick: () => setPage('estoque')
    }, "Ver lista")
  }, /*#__PURE__*/React.createElement("ul", {
    style: {
      listStyle: 'none',
      margin: 0,
      padding: 0
    }
  }, repo.map(p => row(p.id, /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 500,
      color: 'var(--text-strong)'
    }
  }, p.name), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: 'var(--text-sub)',
      fontVariantNumeric: 'tabular-nums'
    }
  }, /*#__PURE__*/React.createElement("strong", {
    style: {
      color: 'var(--warning-fg)',
      fontWeight: 600
    }
  }, stockOf(p)), " / ", p.min, " ", p.unit)))))));
}
window.Painel = Painel;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/mkt-control/Painel.jsx", error: String((e && e.message) || e) }); }

// ui_kits/mkt-control/Shell.jsx
try { (() => {
function navFor(role, alerts) {
  const main = [...(role === 'ADMIN' ? [{
    value: 'painel',
    label: 'Painel',
    icon: 'dashboard-square-01'
  }] : []), {
    value: 'vendas',
    label: 'Vendas',
    icon: 'shopping-cart-01'
  }, {
    value: 'caixa',
    label: 'Caixa',
    icon: 'cash-01'
  }];
  const est = [{
    value: 'estoque',
    label: role === 'ADMIN' ? 'Produtos e lotes' : 'Consultar produtos',
    icon: 'package',
    badge: role === 'ADMIN' && alerts ? alerts : undefined,
    badgeTone: 'danger'
  }];
  return [{
    items: main
  }, {
    title: 'Estoque',
    items: est
  }];
}
function ThemeToggle({
  theme,
  setTheme
}) {
  const {
    IconButton,
    Tooltip
  } = NS;
  const dark = theme === 'dark';
  const label = dark ? 'Modo claro' : 'Modo escuro';
  return /*#__PURE__*/React.createElement(Tooltip, {
    content: label,
    placement: "bottom"
  }, /*#__PURE__*/React.createElement(IconButton, {
    icon: dark ? 'sun-03' : 'moon-02',
    label: label,
    variant: "ghost",
    onClick: () => setTheme(dark ? 'light' : 'dark')
  }));
}
window.ThemeToggle = ThemeToggle;
function Shell({
  user,
  page,
  setPage,
  caixaOpen,
  hidden,
  setHidden,
  onLogout,
  alerts,
  theme,
  setTheme,
  children
}) {
  const {
    SidebarNav,
    BottomNav,
    Badge,
    IconButton,
    Icon,
    Tooltip
  } = NS;
  const w = useWidth();
  const mobile = w < 900;
  const sections = navFor(user.role, alerts);
  const titles = {
    painel: 'Painel',
    vendas: 'Vendas',
    caixa: 'Caixa',
    estoque: user.role === 'ADMIN' ? 'Produtos e lotes' : 'Consultar produtos'
  };
  const status = /*#__PURE__*/React.createElement(Badge, {
    tone: caixaOpen ? 'success' : 'neutral',
    dot: true
  }, caixaOpen ? 'Caixa aberto' : 'Caixa fechado');
  const header = /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '6px 8px',
      borderRadius: 'var(--radius-lg)',
      border: '1px solid var(--border-default)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 32,
      height: 32,
      borderRadius: 'var(--radius-sm)',
      background: 'var(--surface-inverse)',
      color: 'var(--text-inverse)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "store-01",
    size: 18
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--text-caption)',
      color: 'var(--text-soft)'
    }
  }, "Mkt Control"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--text-body-sm)',
      fontWeight: 500,
      color: 'var(--text-strong)',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    }
  }, window.MKT_DATA.store)));
  const footer = /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      padding: 12,
      borderRadius: 'var(--radius-lg)',
      background: 'var(--surface-sunken)'
    }
  }, status, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 32,
      height: 32,
      borderRadius: '50%',
      background: 'var(--selected-bg)',
      color: 'var(--selected-fg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: 600,
      fontSize: 13
    }
  }, user.name.split(' ').map(s => s[0]).join('')), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      minWidth: 0,
      display: 'flex',
      flexDirection: 'column'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--text-body-sm)',
      fontWeight: 500,
      color: 'var(--text-strong)'
    }
  }, user.name), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--text-caption)',
      color: 'var(--text-sub)'
    }
  }, user.role === 'ADMIN' ? 'Administrador' : 'Operador de caixa')), /*#__PURE__*/React.createElement(IconButton, {
    icon: "logout-01",
    label: "Sair",
    variant: "ghost",
    size: "sm",
    onClick: onLogout
  })));
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      height: '100vh',
      overflow: 'hidden'
    }
  }, !mobile && /*#__PURE__*/React.createElement(SidebarNav, {
    sections: sections,
    value: page,
    onSelect: setPage,
    header: header,
    footer: footer
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0,
      display: 'flex',
      flexDirection: 'column'
    }
  }, /*#__PURE__*/React.createElement("header", {
    style: {
      height: 'var(--topbar-h)',
      flexShrink: 0,
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '0 var(--page-pad)',
      borderBottom: '1px solid var(--border-default)',
      background: 'var(--surface-card)'
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: 0,
      flex: 1,
      fontSize: 'var(--text-h3)',
      fontWeight: 500,
      color: 'var(--text-strong)',
      letterSpacing: '-0.01em'
    }
  }, titles[page]), mobile && status, user.role === 'ADMIN' && /*#__PURE__*/React.createElement(Tooltip, {
    content: hidden ? 'Mostrar valores' : 'Ocultar valores',
    placement: "bottom"
  }, /*#__PURE__*/React.createElement(IconButton, {
    icon: hidden ? 'view' : 'view-off',
    label: hidden ? 'Mostrar valores' : 'Ocultar valores',
    variant: "ghost",
    onClick: () => setHidden(!hidden)
  })), /*#__PURE__*/React.createElement(ThemeToggle, {
    theme: theme,
    setTheme: setTheme
  }), /*#__PURE__*/React.createElement(IconButton, {
    icon: "notification-01",
    label: "Notifica\xE7\xF5es",
    variant: "ghost"
  }), mobile && /*#__PURE__*/React.createElement(IconButton, {
    icon: "logout-01",
    label: "Sair",
    variant: "ghost",
    onClick: onLogout
  })), /*#__PURE__*/React.createElement("main", {
    style: {
      flex: 1,
      overflow: 'auto',
      padding: 'var(--page-pad)',
      paddingBottom: mobile ? 96 : 'var(--page-pad)'
    }
  }, children)), mobile && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'fixed',
      left: 16,
      right: 16,
      bottom: 16,
      display: 'flex',
      justifyContent: 'center',
      zIndex: 20
    }
  }, /*#__PURE__*/React.createElement(BottomNav, {
    value: page,
    onSelect: setPage,
    items: sections.flatMap(s => s.items).map(i => ({
      value: i.value,
      label: i.value === 'estoque' ? 'Estoque' : i.label,
      icon: i.icon
    }))
  })));
}
window.Shell = Shell;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/mkt-control/Shell.jsx", error: String((e && e.message) || e) }); }

// ui_kits/mkt-control/Vendas.jsx
try { (() => {
function CartLine({
  line,
  onQty,
  onRemove
}) {
  const {
    IconButton,
    Money
  } = NS;
  return /*#__PURE__*/React.createElement("li", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '12px 0',
      borderBottom: '1px solid var(--border-soft)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--text-body-lg)',
      fontWeight: 500,
      color: 'var(--text-strong)'
    }
  }, line.name), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 'var(--text-body-sm)',
      color: 'var(--text-sub)',
      fontVariantNumeric: 'tabular-nums'
    }
  }, brl(line.price), " / ", line.unit)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 6
    }
  }, /*#__PURE__*/React.createElement(IconButton, {
    icon: line.qty === 1 ? 'delete-02' : 'remove-01',
    label: line.qty === 1 ? 'Remover item' : 'Diminuir',
    size: "counter",
    onClick: () => line.qty === 1 ? onRemove() : onQty(line.qty - 1)
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 44,
      textAlign: 'center',
      fontSize: 'var(--text-counter)',
      fontWeight: 600,
      fontVariantNumeric: 'tabular-nums'
    }
  }, line.qty), /*#__PURE__*/React.createElement(IconButton, {
    icon: "add-01",
    label: "Aumentar",
    size: "counter",
    onClick: () => onQty(line.qty + 1)
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 110,
      textAlign: 'right'
    }
  }, /*#__PURE__*/React.createElement(Money, {
    value: r2(line.price * line.qty),
    size: "md"
  })));
}
function Vendas({
  caixaOpen,
  products,
  onSale,
  goCaixa,
  toast
}) {
  const {
    Input,
    Button,
    Card,
    Tabs,
    Money,
    Icon,
    Keypad
  } = NS;
  const [q, setQ] = React.useState('');
  const [cart, setCart] = React.useState([]);
  const [pay, setPay] = React.useState('dinheiro');
  const [recv, setRecv] = React.useState('');
  const w = useWidth();
  if (!caixaOpen) return /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 480,
      margin: '48px auto',
      textAlign: 'center',
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 56,
      height: 56,
      borderRadius: 'var(--radius-xl)',
      background: 'var(--surface-sunken)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "lock-key",
    size: 28
  })), /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: 0,
      fontSize: 'var(--text-h2)',
      fontWeight: 500,
      color: 'var(--text-strong)'
    }
  }, "Nenhum caixa aberto"), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      color: 'var(--text-sub)',
      fontSize: 'var(--text-body-lg)'
    }
  }, "Abra o caixa com o troco inicial para come\xE7ar a vender."), /*#__PURE__*/React.createElement(Button, {
    size: "counter",
    variant: "brand",
    leadingIcon: "cash-01",
    onClick: goCaixa
  }, "Abrir caixa"));
  const results = q.trim() ? products.filter(p => (p.name + ' ' + p.sku).toLowerCase().includes(q.trim().toLowerCase())).slice(0, 6) : products.slice(0, 6);
  const add = p => {
    setCart(c => {
      const i = c.findIndex(l => l.id === p.id);
      if (i >= 0) return c.map((l, j) => j === i ? {
        ...l,
        qty: l.qty + 1
      } : l);
      return [...c, {
        id: p.id,
        name: p.name,
        price: p.price,
        unit: p.unit,
        qty: 1
      }];
    });
    setQ('');
  };
  const total = r2(cart.reduce((s, l) => s + r2(l.price * l.qty), 0));
  const received = centsToBRL(recv);
  const troco = r2(received - total);
  const canFinish = cart.length > 0 && (pay !== 'dinheiro' || received >= total);
  const finish = () => {
    onSale(cart, total, pay);
    toast({
      tone: 'success',
      title: 'Venda finalizada',
      message: pay === 'dinheiro' && troco > 0 ? 'Troco: ' + brl(troco) : 'Total ' + brl(total)
    });
    setCart([]);
    setRecv('');
    setPay('dinheiro');
  };
  const stack = w < 1180;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: stack ? 'minmax(0,1fr)' : 'minmax(0,1fr) 400px',
      gap: 'var(--gutter)',
      alignItems: 'start'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--gutter)',
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement(Input, {
    size: "counter",
    leadingIcon: "bar-code-01",
    placeholder: "C\xF3digo de barras ou nome do produto",
    value: q,
    onChange: e => setQ(e.target.value),
    autoFocus: true,
    onKeyDown: e => {
      if (e.key === 'Enter' && results[0]) add(results[0]);
    },
    "aria-label": "Buscar produto"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))',
      gap: 8
    }
  }, results.map(p => /*#__PURE__*/React.createElement("button", {
    key: p.id,
    type: "button",
    onClick: () => add(p),
    style: {
      minHeight: 76,
      textAlign: 'left',
      padding: '12px 14px',
      borderRadius: 'var(--radius-lg)',
      border: '1px solid var(--border-default)',
      background: 'var(--surface-card)',
      cursor: 'pointer',
      fontFamily: 'var(--font-sans)',
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
      boxShadow: 'var(--shadow-xs)',
      touchAction: 'manipulation'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 16,
      fontWeight: 500,
      color: 'var(--text-strong)'
    }
  }, p.name), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 'var(--text-body-sm)',
      color: 'var(--text-sub)',
      fontVariantNumeric: 'tabular-nums'
    }
  }, brl(p.price), " \xB7 ", stockOf(p), " ", p.unit, " em estoque"))), results.length === 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      color: 'var(--text-sub)',
      padding: 12
    }
  }, "Nenhum produto encontrado.")), /*#__PURE__*/React.createElement(Card, {
    title: "Itens da venda",
    subtitle: cart.length ? cart.length + (cart.length === 1 ? ' item' : ' itens') : undefined,
    actions: cart.length ? /*#__PURE__*/React.createElement(Button, {
      variant: "ghost",
      size: "sm",
      onClick: () => setCart([])
    }, "Limpar") : null
  }, cart.length === 0 ? /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      padding: '24px 0',
      textAlign: 'center',
      color: 'var(--text-sub)',
      fontSize: 'var(--text-body-lg)'
    }
  }, "Bipe ou toque em um produto para adicionar.") : /*#__PURE__*/React.createElement("ul", {
    style: {
      listStyle: 'none',
      margin: 0,
      padding: 0
    }
  }, cart.map((l, i) => /*#__PURE__*/React.createElement(CartLine, {
    key: l.id,
    line: l,
    onQty: n => setCart(c => c.map((x, j) => j === i ? {
      ...x,
      qty: n
    } : x)),
    onRemove: () => setCart(c => c.filter((_, j) => j !== i))
  }))))), /*#__PURE__*/React.createElement(Card, {
    style: {
      position: stack ? 'static' : 'sticky',
      top: 0
    },
    bodyStyle: {
      display: 'flex',
      flexDirection: 'column',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 16,
      color: 'var(--text-sub)'
    }
  }, "Total"), /*#__PURE__*/React.createElement(Money, {
    value: total,
    size: "counter",
    mutedCents: false
  })), /*#__PURE__*/React.createElement(Tabs, {
    size: "counter",
    fullWidth: true,
    value: pay,
    onChange: setPay,
    ariaLabel: "Forma de pagamento",
    items: [{
      value: 'dinheiro',
      label: 'Dinheiro',
      icon: 'cash-01'
    }, {
      value: 'pix',
      label: 'Pix',
      icon: 'qr-code'
    }, {
      value: 'cartao',
      label: 'Cartão',
      icon: 'credit-card'
    }],
    style: {
      flexWrap: 'wrap'
    }
  }), pay === 'dinheiro' && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 16,
      color: 'var(--text-sub)'
    }
  }, "Recebido"), /*#__PURE__*/React.createElement(Money, {
    value: received,
    size: "lg",
    mutedCents: false
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 16,
      color: 'var(--text-sub)'
    }
  }, "Troco"), received >= total && cart.length ? /*#__PURE__*/React.createElement(Money, {
    value: troco,
    size: "lg",
    tone: "margin",
    mutedCents: false
  }) : /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 16,
      color: 'var(--text-soft)'
    }
  }, "\u2014")), /*#__PURE__*/React.createElement(Keypad, {
    value: recv,
    onChange: setRecv
  })), /*#__PURE__*/React.createElement(Button, {
    size: "counter",
    variant: "brand",
    fullWidth: true,
    leadingIcon: "tick-02",
    disabled: !canFinish,
    onClick: finish
  }, "Finalizar venda")));
}
window.Vendas = Vendas;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/mkt-control/Vendas.jsx", error: String((e && e.message) || e) }); }

// ui_kits/mkt-control/data.js
try { (() => {
window.MKT_DATA = {
  store: 'Mercadinho Bom Preço',
  users: [{
    id: 1,
    name: 'Ana Ribeiro',
    email: 'ana@bompreco.com.br',
    role: 'ADMIN'
  }, {
    id: 2,
    name: 'Carlos Souza',
    email: 'carlos@bompreco.com.br',
    role: 'CASHIER'
  }],
  products: [{
    id: 'p1',
    sku: '7891000100103',
    name: 'Leite integral 1L',
    cat: 'Laticínios',
    price: 5.49,
    cost: 3.92,
    min: 24,
    unit: 'un',
    lots: [{
      code: 'L2410',
      exp: '2026-10-30',
      qty: 18
    }, {
      code: 'L2418',
      exp: '2026-11-12',
      qty: 30
    }]
  }, {
    id: 'p2',
    sku: '7896004000107',
    name: 'Arroz branco 5kg',
    cat: 'Mercearia',
    price: 27.9,
    cost: 21.3,
    min: 10,
    unit: 'un',
    lots: [{
      code: 'A0921',
      exp: '2027-05-01',
      qty: 14
    }]
  }, {
    id: 'p3',
    sku: '7891910000197',
    name: 'Feijão carioca 1kg',
    cat: 'Mercearia',
    price: 8.79,
    cost: 6.1,
    min: 15,
    unit: 'un',
    lots: [{
      code: 'F1102',
      exp: '2027-02-10',
      qty: 9
    }]
  }, {
    id: 'p4',
    sku: '7894900011517',
    name: 'Refrigerante cola 2L',
    cat: 'Bebidas',
    price: 9.99,
    cost: 6.45,
    min: 12,
    unit: 'un',
    lots: [{
      code: 'R3301',
      exp: '2027-01-20',
      qty: 36
    }]
  }, {
    id: 'p5',
    sku: '7891025101062',
    name: 'Iogurte morango 170g',
    cat: 'Laticínios',
    price: 3.29,
    cost: 2.05,
    min: 20,
    unit: 'un',
    lots: [{
      code: 'I2398',
      exp: '2026-10-27',
      qty: 6
    }, {
      code: 'I2405',
      exp: '2026-11-02',
      qty: 22
    }]
  }, {
    id: 'p6',
    sku: '7891080000324',
    name: 'Café torrado 500g',
    cat: 'Mercearia',
    price: 18.49,
    cost: 13.2,
    min: 8,
    unit: 'un',
    lots: [{
      code: 'C0711',
      exp: '2027-03-15',
      qty: 4
    }]
  }, {
    id: 'p7',
    sku: '2000000000017',
    name: 'Pão francês',
    cat: 'Padaria',
    price: 16.9,
    cost: 7.8,
    min: 5,
    unit: 'kg',
    lots: [{
      code: 'P2810',
      exp: '2026-10-29',
      qty: 12
    }]
  }, {
    id: 'p8',
    sku: '7891149103102',
    name: 'Sabão em pó 1kg',
    cat: 'Limpeza',
    price: 14.9,
    cost: 10.4,
    min: 6,
    unit: 'un',
    lots: [{
      code: 'S0420',
      exp: '2028-04-01',
      qty: 11
    }]
  }],
  week: [{
    d: 'Qua',
    rev: 2840.2,
    cmv: 1985.1
  }, {
    d: 'Qui',
    rev: 3120.5,
    cmv: 2190.4
  }, {
    d: 'Sex',
    rev: 4410.9,
    cmv: 3065.0
  }, {
    d: 'Sáb',
    rev: 5230.3,
    cmv: 3702.6
  }, {
    d: 'Dom',
    rev: 2210.0,
    cmv: 1540.8
  }, {
    d: 'Seg',
    rev: 2980.7,
    cmv: 2101.3
  }, {
    d: 'Ter',
    rev: 3420.4,
    cmv: 2380.2
  }],
  today: '2026-10-28'
};
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/mkt-control/data.js", error: String((e && e.message) || e) }); }

// ui_kits/mkt-control/helpers.jsx
try { (() => {
const NS = window.MktControlDesignSystem_295891;
const formatBRL = v => (Math.round((Number(v) || 0) * 100) / 100).toLocaleString('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});
const brl = v => 'R$ ' + formatBRL(v);
const centsToBRL = d => parseInt(d || '0', 10) / 100;
const r2 = v => Math.round(v * 100) / 100;
const daysTo = iso => Math.round((new Date(iso + 'T12:00:00') - new Date(window.MKT_DATA.today + 'T12:00:00')) / 86400000);
const fmtDate = iso => iso.split('-').reverse().join('/');
const stockOf = p => p.lots.reduce((s, l) => s + l.qty, 0);
function expiryBadge(iso) {
  const d = daysTo(iso);
  if (d < 0) return {
    tone: 'danger',
    label: 'Vencido'
  };
  if (d === 0) return {
    tone: 'danger',
    label: 'Vence hoje'
  };
  if (d <= 7) return {
    tone: 'warning',
    label: 'Vence em ' + d + (d === 1 ? ' dia' : ' dias')
  };
  return {
    tone: 'success',
    label: 'No prazo'
  };
}
function useWidth() {
  const [w, setW] = React.useState(window.innerWidth);
  React.useEffect(() => {
    const f = () => setW(window.innerWidth);
    window.addEventListener('resize', f);
    return () => window.removeEventListener('resize', f);
  }, []);
  return w;
}
Object.assign(window, {
  NS,
  formatBRL,
  centsToBRL,
  brl,
  r2,
  daysTo,
  fmtDate,
  stockOf,
  expiryBadge,
  useWidth
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/mkt-control/helpers.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Icon = __ds_scope.Icon;

__ds_ns.ICON_NAMES = __ds_scope.ICON_NAMES;

__ds_ns.IconButton = __ds_scope.IconButton;

__ds_ns.ICONS = __ds_scope.ICONS;

__ds_ns.Keypad = __ds_scope.Keypad;

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.Money = __ds_scope.Money;

__ds_ns.StatCard = __ds_scope.StatCard;

__ds_ns.Table = __ds_scope.Table;

__ds_ns.Tag = __ds_scope.Tag;

__ds_ns.Dialog = __ds_scope.Dialog;

__ds_ns.Toast = __ds_scope.Toast;

__ds_ns.Tooltip = __ds_scope.Tooltip;

__ds_ns.Checkbox = __ds_scope.Checkbox;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.Radio = __ds_scope.Radio;

__ds_ns.Select = __ds_scope.Select;

__ds_ns.Switch = __ds_scope.Switch;

__ds_ns.BottomNav = __ds_scope.BottomNav;

__ds_ns.SidebarNav = __ds_scope.SidebarNav;

__ds_ns.Tabs = __ds_scope.Tabs;

})();
