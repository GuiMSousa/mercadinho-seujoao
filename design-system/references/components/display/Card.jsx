import React from 'react';
export function Card({ title, subtitle, actions, padding='var(--card-pad)', children, style, bodyStyle, as='section', ...rest }) {
  const Tag=as;
  return (
    <Tag {...rest} style={{background:'var(--surface-card)',border:'1px solid var(--border-soft)',borderRadius:'var(--radius-card)',boxShadow:'var(--shadow-sm)',display:'flex',flexDirection:'column',minWidth:0,...style}}>
      {(title||actions) && <header style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,padding:'16px '+(padding==='0'||padding===0?'20px':padding)+' 0'}}>
        <div style={{display:'flex',flexDirection:'column',gap:2,minWidth:0}}>
          {title && <h3 style={{margin:0,fontSize:'var(--text-body-lg)',lineHeight:'var(--lh-body-lg)',fontWeight:'var(--weight-medium)',color:'var(--text-strong)',letterSpacing:'-0.01em'}}>{title}</h3>}
          {subtitle && <p style={{margin:0,fontSize:'var(--text-body-sm)',color:'var(--text-sub)'}}>{subtitle}</p>}
        </div>
        {actions && <div style={{display:'flex',gap:8,alignItems:'center',flexShrink:0}}>{actions}</div>}
      </header>}
      <div style={{padding,flex:1,minWidth:0,...bodyStyle}}>{children}</div>
    </Tag>
  );
}
