import React from 'react';
export function Table({ columns=[], rows=[], rowKey, onRowClick, dense=false, empty='Nada por aqui ainda.', caption, style }) {
  const [hover,setHover]=React.useState(-1);
  const py=dense?8:12;
  return (
    <div style={{overflowX:'auto',minWidth:0,...style}}>
      <table style={{width:'100%',borderCollapse:'separate',borderSpacing:0,fontSize:'var(--text-body-sm)',fontVariantNumeric:'tabular-nums'}}>
        {caption && <caption style={{position:'absolute',width:1,height:1,overflow:'hidden',clip:'rect(0 0 0 0)'}}>{caption}</caption>}
        <thead><tr>{columns.map((c,ci)=>(
          <th key={c.key} scope="col" style={{textAlign:c.align||'left',padding:'8px 12px',fontWeight:'var(--weight-medium)',fontSize:'var(--text-caption)',color:'var(--text-sub)',background:'var(--surface-sunken)',whiteSpace:'nowrap',width:c.width,
            borderTopLeftRadius:ci===0?'var(--radius-sm)':0,borderBottomLeftRadius:ci===0?'var(--radius-sm)':0,borderTopRightRadius:ci===columns.length-1?'var(--radius-sm)':0,borderBottomRightRadius:ci===columns.length-1?'var(--radius-sm)':0}}>{c.label}</th>))}</tr></thead>
        <tbody>
          {rows.length===0 && <tr><td colSpan={columns.length} style={{padding:'32px 12px',textAlign:'center',color:'var(--text-sub)'}}>{empty}</td></tr>}
          {rows.map((r,i)=>(
            <tr key={rowKey?r[rowKey]:i} onClick={onRowClick?()=>onRowClick(r):undefined} onMouseEnter={()=>setHover(i)} onMouseLeave={()=>setHover(-1)}
              style={{cursor:onRowClick?'pointer':'default',background:hover===i?'var(--surface-hover)':'transparent'}}>
              {columns.map(c=>(<td key={c.key} style={{textAlign:c.align||'left',padding:py+'px 12px',borderBottom:'1px solid var(--border-soft)',color:'var(--text-strong)',whiteSpace:c.wrap?'normal':'nowrap'}}>{c.render?c.render(r):r[c.key]}</td>))}
            </tr>))}
        </tbody>
      </table>
    </div>
  );
}
