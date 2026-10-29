import React from 'react';
import { Icon } from '../core/Icon.jsx';
function Key({ children, onPress, label, tone }) {
  const [p,setP]=React.useState(false);
  return (
    <button type="button" aria-label={label} onClick={onPress} onPointerDown={()=>setP(true)} onPointerUp={()=>setP(false)} onPointerLeave={()=>setP(false)}
      style={{height:'var(--control-counter-lg)',minHeight:60,border:'1px solid var(--border-default)',borderRadius:'var(--radius-lg)',fontFamily:'var(--font-sans)',fontSize:28,fontWeight:500,fontVariantNumeric:'tabular-nums',
        background:p?'var(--control-pressed)':(tone==='soft'?'var(--surface-sunken)':'var(--surface-card)'),color:'var(--text-strong)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',
        boxShadow:'var(--shadow-xs)',transform:p?'scale(.97)':'none',transition:'transform var(--dur-fast)',touchAction:'manipulation'}}>{children}</button>
  );
}
export function Keypad({ value='', onChange, maxLength=9, style }) {
  const press=k=>{let v=String(value);if(k==='del')v=v.slice(0,-1);else if(k==='00')v=(v+'00').slice(0,maxLength);else v=(v+k).slice(0,maxLength);v=v.replace(/^0+(?=\d)/,'');onChange&&onChange(v)};
  const keys=['1','2','3','4','5','6','7','8','9','00','0','del'];
  return (
    <div style={{display:'grid',gridTemplateColumns:'repeat(3,minmax(0,1fr))',gap:8,...style}}>
      {keys.map(k=><Key key={k} tone={k==='del'||k==='00'?'soft':undefined} label={k==='del'?'Apagar':k} onPress={()=>press(k)}>{k==='del'?<Icon name="arrow-left-01" size={26} />:k}</Key>)}
    </div>
  );
}
export function centsToBRL(digits){const n=parseInt(digits||'0',10)/100;return n}
