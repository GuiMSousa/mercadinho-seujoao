import React from 'react';
import { Icon } from './Icon.jsx';
import { useInteraction } from './useInteraction.js';
const SIZES={sm:{h:'var(--control-sm)',px:12,fs:'var(--text-body-sm)',gap:6,ic:16,r:'var(--radius-sm)'},md:{h:'var(--control-md)',px:16,fs:'var(--text-body-md)',gap:8,ic:18,r:'var(--radius-md)'},lg:{h:'var(--control-lg)',px:20,fs:'var(--text-body-lg)',gap:8,ic:20,r:'var(--radius-lg)'},counter:{h:'var(--control-counter)',px:24,fs:'var(--text-counter)',gap:10,ic:24,r:'var(--radius-lg)'}};
const V={
  primary:{bg:'var(--action-primary)',hv:'var(--action-primary-hover)',fg:'var(--text-inverse)',bd:'transparent',sh:'var(--shadow-btn-dark)'},
  brand:{bg:'var(--action-brand)',hv:'var(--action-brand-hover)',fg:'var(--text-on-color)',bd:'transparent',sh:'var(--shadow-btn-brand)'},
  secondary:{bg:'var(--surface-card)',hv:'var(--surface-hover)',fg:'var(--text-strong)',bd:'var(--border-default)',sh:'var(--shadow-xs)'},
  soft:{bg:'var(--control-soft)',hv:'var(--control-soft-hover)',fg:'var(--text-strong)',bd:'transparent',sh:'none'},
  ghost:{bg:'transparent',hv:'var(--surface-sunken)',fg:'var(--text-body)',bd:'transparent',sh:'none'},
  danger:{bg:'var(--action-danger)',hv:'var(--action-danger-hover)',fg:'var(--text-on-color)',bd:'transparent',sh:'none'},
};
export function Button({ variant='primary', size='md', leadingIcon, trailingIcon, fullWidth=false, disabled=false, type='button', onClick, children, style, ...rest }) {
  const s=SIZES[size]||SIZES.md, v=V[variant]||V.primary;
  const {hover,press,focus,bind}=useInteraction(disabled);
  return (
    <button type={type} disabled={disabled} onClick={onClick} {...bind} {...rest}
      style={{display:'inline-flex',alignItems:'center',justifyContent:'center',gap:s.gap,height:s.h,minHeight:s.h,padding:'0 '+s.px+'px',width:fullWidth?'100%':undefined,
        fontFamily:'var(--font-sans)',fontSize:s.fs,fontWeight:'var(--weight-medium)',lineHeight:1,letterSpacing:'-0.005em',whiteSpace:'nowrap',
        color:disabled?'var(--text-disabled)':v.fg,background:disabled?'var(--surface-sunken)':(hover?v.hv:v.bg),
        border:'1px solid '+(disabled?'transparent':v.bd),borderRadius:s.r,boxShadow:focus?'var(--focus-ring)':(disabled?'none':v.sh),
        cursor:disabled?'not-allowed':'pointer',outline:'none',transform:press?'scale(.98)':'none',
        transition:'background var(--dur-fast) var(--ease-out),transform var(--dur-fast) var(--ease-out)',touchAction:'manipulation',...style}}>
      {leadingIcon && <Icon name={leadingIcon} size={s.ic} />}
      {children}
      {trailingIcon && <Icon name={trailingIcon} size={s.ic} />}
    </button>
  );
}
