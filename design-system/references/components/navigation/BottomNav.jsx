import React from 'react';
import { Icon } from '../core/Icon.jsx';
export function BottomNav({ items=[], value, onSelect, style }) {
  return (
    <nav aria-label="Principal" style={{display:'flex',alignItems:'center',gap:4,padding:6,background:'var(--bottom-nav-bg)',borderRadius:'var(--radius-full)',boxShadow:'var(--shadow-xl)',...style}}>
      {items.map(it=>{const on=it.value===value;return (
        <button key={it.value} type="button" onClick={()=>onSelect&&onSelect(it.value)} aria-current={on?'page':undefined} aria-label={it.label}
          style={{flex:on?'0 0 auto':1,display:'inline-flex',alignItems:'center',justifyContent:'center',gap:8,height:48,minWidth:48,padding:on?'0 18px':'0 8px',border:0,borderRadius:999,
            background:on?'var(--action-brand)':'transparent',color:on?'var(--text-on-color)':'var(--bottom-nav-fg)',fontFamily:'var(--font-sans)',fontSize:'var(--text-body-sm)',fontWeight:'var(--weight-medium)',cursor:'pointer',transition:'all var(--dur-base) var(--ease-out)'}}>
          <Icon name={it.icon} size={22} />{on && <span>{it.label}</span>}
        </button>)})}
    </nav>
  );
}
