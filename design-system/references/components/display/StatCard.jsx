import React from 'react';
import { Icon } from '../core/Icon.jsx';
import { Money } from './Money.jsx';
export function StatCard({ label, value, money=true, delta, deltaLabel, icon, footer, hidden=false, action, style }) {
  const up=delta!==undefined&&delta>=0;
  return (
    <div style={{background:'var(--surface-card)',border:'1px solid var(--border-soft)',borderRadius:'var(--radius-card)',boxShadow:'var(--shadow-sm)',padding:'var(--card-pad)',display:'flex',flexDirection:'column',gap:12,minWidth:0,...style}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:8}}>
        <span style={{display:'flex',alignItems:'center',gap:8,fontSize:'var(--text-body-sm)',color:'var(--text-sub)',fontWeight:'var(--weight-medium)'}}>
          {icon && <span style={{width:28,height:28,borderRadius:'var(--radius-sm)',background:'var(--surface-sunken)',display:'inline-flex',alignItems:'center',justifyContent:'center',color:'var(--text-body)'}}><Icon name={icon} size={16} /></span>}
          {label}
        </span>
        {action}
      </div>
      <div>{money ? <Money value={value} size="xl" hidden={hidden} /> : <span style={{fontSize:'var(--text-h1)',lineHeight:'var(--lh-h1)',fontWeight:500,color:'var(--text-strong)',fontVariantNumeric:'tabular-nums',letterSpacing:'var(--tracking-tight)'}}>{value}</span>}</div>
      {(delta!==undefined||footer) && <div style={{display:'flex',alignItems:'center',gap:8,fontSize:'var(--text-caption)',color:'var(--text-sub)'}}>
        {delta!==undefined && <span style={{display:'inline-flex',alignItems:'center',gap:2,color:up?'var(--success-fg)':'var(--danger-fg)',fontWeight:'var(--weight-medium)'}}><Icon name={up?'arrow-up-right-01':'arrow-down-left-01'} size={14} />{(up?'+':'')+String(delta).replace('.',',')}%</span>}
        {deltaLabel && <span>{deltaLabel}</span>}
        {footer}
      </div>}
    </div>
  );
}
