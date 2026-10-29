import React from 'react';
const T={success:['var(--success-bg)','var(--success-fg)','var(--success-solid)'],danger:['var(--danger-bg)','var(--danger-fg)','var(--danger-solid)'],warning:['var(--warning-bg)','var(--warning-fg)','var(--warning-solid)'],info:['var(--info-bg)','var(--info-fg)','var(--info-solid)'],neutral:['var(--neutral-bg)','var(--neutral-fg)','var(--neutral-400)']};
export function Badge({ tone='neutral', dot=false, size='md', children, style }) {
  const [bg,fg,solid]=T[tone]||T.neutral;
  const sm=size==='sm';
  return (
    <span style={{display:'inline-flex',alignItems:'center',gap:6,height:sm?20:24,padding:'0 '+(sm?8:10)+'px',borderRadius:'var(--radius-full)',background:bg,color:fg,
      fontSize:sm?'var(--text-caption)':'var(--text-body-sm)',fontWeight:'var(--weight-medium)',whiteSpace:'nowrap',lineHeight:1,...style}}>
      {dot && <span aria-hidden="true" style={{width:6,height:6,borderRadius:'50%',background:solid}} />}
      {children}
    </span>
  );
}
