import React from 'react';
export function Tooltip({ content, placement='top', children }) {
  const [open,setOpen]=React.useState(false);
  const pos=placement==='bottom'?{top:'calc(100% + 6px)'}:{bottom:'calc(100% + 6px)'};
  return (
    <span style={{position:'relative',display:'inline-flex'}} onMouseEnter={()=>setOpen(true)} onMouseLeave={()=>setOpen(false)} onFocus={()=>setOpen(true)} onBlur={()=>setOpen(false)}>
      {children}
      {open && <span role="tooltip" style={{position:'absolute',left:'50%',transform:'translateX(-50%)',...pos,zIndex:50,whiteSpace:'nowrap',padding:'6px 8px',borderRadius:'var(--radius-sm)',
        background:'var(--surface-inverse)',color:'var(--text-inverse)',fontSize:'var(--text-caption)',lineHeight:'var(--lh-caption)',fontWeight:'var(--weight-medium)',boxShadow:'var(--shadow-md)',pointerEvents:'none'}}>{content}</span>}
    </span>
  );
}
