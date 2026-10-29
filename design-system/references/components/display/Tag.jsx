import React from 'react';
import { Icon } from '../core/Icon.jsx';
export function Tag({ icon, selected=false, onClick, onRemove, children, style }) {
  const El=onClick?'button':'span';
  return (
    <El type={onClick?'button':undefined} onClick={onClick} aria-pressed={onClick?selected:undefined}
      style={{display:'inline-flex',alignItems:'center',gap:6,height:28,padding:'0 10px',borderRadius:'var(--radius-sm)',fontFamily:'var(--font-sans)',
        fontSize:'var(--text-body-sm)',fontWeight:'var(--weight-medium)',cursor:onClick?'pointer':'default',
        background:selected?'var(--selected-bg)':'var(--surface-card)',color:selected?'var(--selected-fg)':'var(--text-body)',
        border:'1px solid '+(selected?'var(--selected-border)':'var(--border-default)'),...style}}>
      {icon && <Icon name={icon} size={14} />}
      {children}
      {onRemove && <span role="button" tabIndex={0} aria-label="Remover" onClick={e=>{e.stopPropagation();onRemove()}} style={{display:'inline-flex',color:'var(--text-soft)',cursor:'pointer'}}><Icon name="cancel-01" size={14} /></span>}
    </El>
  );
}
