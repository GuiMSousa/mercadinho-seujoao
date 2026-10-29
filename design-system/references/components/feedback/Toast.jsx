import React from 'react';
import { Icon } from '../core/Icon.jsx';
const IC={success:['checkmark-circle-02','var(--green-500)'],danger:['alert-circle','var(--red-500)'],warning:['alert-02','var(--orange-500)'],info:['information-circle','var(--blue-400)']};
export function Toast({ tone='success', title, message, action, onClose, style }) {
  const [ic,c]=IC[tone]||IC.info;
  return (
    <div role={tone==='danger'?'alert':'status'} style={{display:'flex',alignItems:'flex-start',gap:12,padding:'12px 14px',minWidth:280,maxWidth:420,background:'var(--surface-inverse)',color:'var(--text-inverse)',borderRadius:'var(--radius-lg)',boxShadow:'var(--shadow-xl)',...style}}>
      <Icon name={ic} size={20} color={c} style={{marginTop:1}} />
      <div style={{flex:1,display:'flex',flexDirection:'column',gap:2,minWidth:0}}>
        <span style={{fontSize:'var(--text-body-md)',fontWeight:'var(--weight-medium)'}}>{title}</span>
        {message && <span style={{fontSize:'var(--text-body-sm)',color:'var(--inverse-text-sub)'}}>{message}</span>}
      </div>
      {action}
      {onClose && <button type="button" aria-label="Fechar" onClick={onClose} style={{border:0,background:'transparent',color:'var(--inverse-text-sub)',cursor:'pointer',padding:0,display:'flex'}}><Icon name="cancel-01" size={16} /></button>}
    </div>
  );
}
