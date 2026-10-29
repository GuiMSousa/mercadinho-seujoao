import React from 'react';
const SZ={sm:['var(--text-body-md)',500],md:['var(--text-h3)',500],lg:['var(--text-h2)',500],xl:['var(--text-h1)',500],display:['var(--text-display)',500],counter:['var(--text-counter-total)',600]};
export function formatBRL(v){const n=Math.round((Number(v)||0)*100)/100;return n.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})}
export function Money({ value, size='md', currency=true, signed=false, tone, mutedCents=true, hidden=false, style }) {
  const [fs,fw]=SZ[size]||SZ.md;
  const n=Number(value)||0;
  const s=formatBRL(Math.abs(n)); const i=s.lastIndexOf(',');
  const sign=n<0?'−':(signed&&n>0?'+':'');
  const color=tone==='in'?'var(--money-in)':tone==='out'?'var(--money-out)':tone==='margin'?'var(--success-fg)':'var(--text-strong)';
  return (
    <span style={{fontSize:fs,fontWeight:fw,color,fontVariantNumeric:'tabular-nums',letterSpacing:'var(--tracking-tight)',whiteSpace:'nowrap',lineHeight:1.15,...style}}>
      {hidden ? <span aria-label="valor oculto">R$ ••••••</span> : <>
        {sign}{currency && <span style={{fontSize:'0.62em',fontWeight:500,marginRight:'0.18em',color:'var(--text-sub)',letterSpacing:0}}>R$</span>}
        {s.slice(0,i)}<span style={{color:mutedCents&&!tone?'var(--text-soft)':undefined,opacity:mutedCents&&tone?0.6:1}}>{s.slice(i)}</span>
      </>}
    </span>
  );
}
