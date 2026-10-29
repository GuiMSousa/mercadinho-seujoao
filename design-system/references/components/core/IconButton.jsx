import React from 'react';
import { Icon } from './Icon.jsx';
import { useInteraction } from './useInteraction.js';
const SZ={sm:[32,16,'var(--radius-sm)'],md:[40,20,'var(--radius-md)'],lg:[48,22,'var(--radius-lg)'],counter:[60,24,'var(--radius-lg)']};
export function IconButton({ icon, label, variant='secondary', size='md', disabled=false, onClick, style, ...rest }) {
  const [d,ic,r]=SZ[size]||SZ.md;
  const {hover,press,focus,bind}=useInteraction(disabled);
  const map={secondary:['var(--surface-card)','var(--surface-hover)','var(--text-body)','var(--border-default)'],ghost:['transparent','var(--surface-sunken)','var(--text-sub)','transparent'],primary:['var(--action-primary)','var(--action-primary-hover)','var(--text-inverse)','transparent'],brand:['var(--action-brand)','var(--action-brand-hover)','var(--text-on-color)','transparent'],danger:['var(--danger-bg)','var(--danger-soft-hover)','var(--danger-fg)','transparent']};
  const [bg,hv,fg,bd]=map[variant]||map.secondary;
  return (
    <button type="button" aria-label={label} title={label} disabled={disabled} onClick={onClick} {...bind} {...rest}
      style={{width:d,height:d,minWidth:d,display:'inline-flex',alignItems:'center',justifyContent:'center',padding:0,borderRadius:r,
        background:disabled?'var(--surface-sunken)':(hover?hv:bg),color:disabled?'var(--text-disabled)':fg,border:'1px solid '+bd,
        boxShadow:focus?'var(--focus-ring)':(variant==='secondary'?'var(--shadow-xs)':'none'),cursor:disabled?'not-allowed':'pointer',outline:'none',
        transform:press?'scale(.96)':'none',transition:'background var(--dur-fast) var(--ease-out),transform var(--dur-fast)',touchAction:'manipulation',...style}}>
      <Icon name={icon} size={ic} />
    </button>
  );
}
