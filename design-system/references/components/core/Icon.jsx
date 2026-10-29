import React from 'react';
import { ICONS } from './iconData.js';
export function Icon({ name, size = 20, color = 'currentColor', title, style, ...rest }) {
  const inner = ICONS[name];
  if (!inner) return null;
  return React.createElement('svg', {
    xmlns: 'http://www.w3.org/2000/svg', viewBox: '0 0 24 24', width: size, height: size, fill: 'none',
    style: { color, flexShrink: 0, display: 'block', ...style },
    role: title ? 'img' : undefined, 'aria-label': title, 'aria-hidden': title ? undefined : true,
    dangerouslySetInnerHTML: { __html: (title ? '<title>' + title + '</title>' : '') + inner }, ...rest
  });
}
export const ICON_NAMES = Object.keys(ICONS);
