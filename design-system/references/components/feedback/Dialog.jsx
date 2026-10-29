import React from 'react';
import { IconButton } from '../core/IconButton.jsx';
export function Dialog({ open, onClose, title, description, children, footer, width=480, style }) {
  const ref=React.useRef(null);
  React.useEffect(()=>{if(!open)return;const k=e=>{if(e.key==='Escape')onClose&&onClose()};document.addEventListener('keydown',k);const f=ref.current&&ref.current.querySelector('input,button:not([aria-label="Fechar"]),select,textarea');f&&f.focus();return ()=>document.removeEventListener('keydown',k)},[open]);
  if(!open)return null;
  return (
    <div onMouseDown={e=>{if(e.target===e.currentTarget)onClose&&onClose()}} style={{position:'fixed',inset:0,zIndex:100,background:'var(--surface-overlay)',backdropFilter:'blur(4px)',WebkitBackdropFilter:'blur(4px)',display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
      <div ref={ref} role="dialog" aria-modal="true" aria-label={typeof title==='string'?title:undefined}
        style={{width:'100%',maxWidth:width,maxHeight:'calc(100vh - 32px)',overflow:'auto',background:'var(--surface-card)',borderRadius:'var(--radius-dialog)',boxShadow:'var(--shadow-xl)',display:'flex',flexDirection:'column',...style}}>
        <div style={{display:'flex',alignItems:'flex-start',gap:12,padding:'20px 20px 0'}}>
          <div style={{flex:1,display:'flex',flexDirection:'column',gap:4}}>
            <h2 style={{margin:0,fontSize:'var(--text-h3)',lineHeight:'var(--lh-h3)',fontWeight:'var(--weight-medium)',color:'var(--text-strong)',letterSpacing:'-0.01em'}}>{title}</h2>
            {description && <p style={{margin:0,fontSize:'var(--text-body-md)',color:'var(--text-sub)'}}>{description}</p>}
          </div>
          <IconButton icon="cancel-01" label="Fechar" variant="ghost" size="sm" onClick={onClose} />
        </div>
        <div style={{padding:20}}>{children}</div>
        {footer && <div style={{display:'flex',gap:8,justifyContent:'flex-end',padding:'16px 20px',borderTop:'1px solid var(--border-soft)'}}>{footer}</div>}
      </div>
    </div>
  );
}
