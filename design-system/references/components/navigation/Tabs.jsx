import React from 'react';
import { Icon } from '../core/Icon.jsx';
export function Tabs({ items=[], value, onChange, size='md', fullWidth=false, ariaLabel, style }) {
  const h=size==='counter'?'var(--control-counter)':size==='sm'?30:36;
  const fs=size==='counter'?'var(--text-counter)':size==='sm'?'var(--text-body-sm)':'var(--text-body-md)';
  const onKey=(e,i)=>{if(e.key!=='ArrowRight'&&e.key!=='ArrowLeft')return;const n=(i+(e.key==='ArrowRight'?1:-1)+items.length)%items.length;onChange&&onChange(items[n].value);const b=e.currentTarget.parentNode.children[n];b&&b.focus()};
  return (
    <div role="tablist" aria-label={ariaLabel} style={{display:fullWidth?'flex':'inline-flex',gap:4,padding:4,background:'var(--surface-sunken)',borderRadius:size==='counter'?'var(--radius-xl)':'var(--radius-lg)',...style}}>
      {items.map((it,i)=>{const on=it.value===value;return (
        <button key={it.value} role="tab" type="button" aria-selected={on} tabIndex={on?0:-1} onClick={()=>onChange&&onChange(it.value)} onKeyDown={e=>onKey(e,i)}
          style={{flex:fullWidth?1:undefined,display:'inline-flex',alignItems:'center',justifyContent:'center',gap:8,height:h,padding:'0 '+(size==='counter'?20:14)+'px',border:0,
            borderRadius:size==='counter'?'var(--radius-lg)':'var(--radius-md)',fontFamily:'var(--font-sans)',fontSize:fs,fontWeight:'var(--weight-medium)',cursor:'pointer',whiteSpace:'nowrap',
            background:on?'var(--action-primary)':'transparent',color:on?'var(--text-inverse)':'var(--text-sub)',boxShadow:on?'var(--shadow-btn-dark)':'none',transition:'background var(--dur-base) var(--ease-out),color var(--dur-base)',touchAction:'manipulation'}}>
          {it.icon && <Icon name={it.icon} size={size==='counter'?24:16} />}{it.label}
          {it.count!==undefined && <span style={{fontSize:'var(--text-caption)',padding:'1px 6px',borderRadius:999,background:on?'var(--surface-hover)':'var(--count-bg)',color:on?'var(--text-strong)':'var(--text-sub)'}}>{it.count}</span>}
        </button>)})}
    </div>
  );
}
