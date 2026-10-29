import React from 'react';
import { Icon } from '../core/Icon.jsx';
function Item({ it, active, onSelect }) {
  const [h,setH]=React.useState(false);
  return (
    <button type="button" onClick={()=>onSelect&&onSelect(it.value)} aria-current={active?'page':undefined} onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)}
      style={{display:'flex',alignItems:'center',gap:10,width:'100%',height:36,padding:'0 10px',border:0,borderRadius:'var(--radius-md)',fontFamily:'var(--font-sans)',fontSize:'var(--text-body-md)',
        fontWeight:active?'var(--weight-medium)':'var(--weight-regular)',textAlign:'left',cursor:'pointer',
        background:active?'var(--surface-sunken)':(h?'var(--surface-hover)':'transparent'),color:active?'var(--text-strong)':'var(--text-body)'}}>
      <Icon name={it.icon} size={18} color={active?'var(--text-strong)':'var(--text-sub)'} />
      <span style={{flex:1}}>{it.label}</span>
      {it.badge!==undefined && <span style={{minWidth:20,height:20,padding:'0 6px',borderRadius:999,background:it.badgeTone==='danger'?'var(--danger-solid)':'var(--action-primary)',color:it.badgeTone==='danger'?'var(--text-on-color)':'var(--text-inverse)',fontSize:11,display:'inline-flex',alignItems:'center',justifyContent:'center',fontWeight:600}}>{it.badge}</span>}
    </button>
  );
}
export function SidebarNav({ sections=[], value, onSelect, header, footer, style }) {
  return (
    <nav aria-label="Principal" style={{width:'var(--sidebar-w)',height:'100%',display:'flex',flexDirection:'column',background:'var(--surface-card)',borderRight:'1px solid var(--border-default)',padding:12,gap:16,...style}}>
      {header}
      <div style={{display:'flex',flexDirection:'column',gap:16,flex:1,overflowY:'auto'}}>
        {sections.map((s,si)=>(
          <div key={si} style={{display:'flex',flexDirection:'column',gap:2}}>
            {s.title && <div style={{fontSize:'var(--text-caption)',color:'var(--text-soft)',padding:'4px 10px'}}>{s.title}</div>}
            {s.items.map(it=><Item key={it.value} it={it} active={it.value===value} onSelect={onSelect} />)}
          </div>))}
      </div>
      {footer}
    </nav>
  );
}
