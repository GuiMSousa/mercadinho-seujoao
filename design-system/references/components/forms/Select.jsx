import React from 'react';
import { Icon } from '../core/Icon.jsx';
const H={sm:'var(--control-sm)',md:'var(--control-md)',lg:'var(--control-lg)',counter:'var(--control-counter)'};
export function Select({ label, options=[], value, defaultValue, onChange, size='md', placeholder, disabled=false, id, style, ...rest }) {
  const [focus,setFocus]=React.useState(false);
  const uid=React.useId?React.useId():undefined; const iid=id||uid;
  const big=size==='counter';
  return (
    <div style={{display:'flex',flexDirection:'column',gap:6,minWidth:0,...style}}>
      {label && <label htmlFor={iid} style={{fontSize:big?'var(--text-body-lg)':'var(--text-body-sm)',fontWeight:'var(--weight-medium)',color:'var(--text-strong)'}}>{label}</label>}
      <div style={{position:'relative',height:H[size]||H.md}}>
        <select id={iid} value={value} defaultValue={defaultValue} onChange={onChange} disabled={disabled} onFocus={()=>setFocus(true)} onBlur={()=>setFocus(false)} {...rest}
          style={{appearance:'none',WebkitAppearance:'none',width:'100%',height:'100%',padding:'0 36px 0 12px',fontFamily:'var(--font-sans)',fontSize:big?'var(--text-counter)':'var(--text-body-md)',color:'var(--text-strong)',
            background:disabled?'var(--surface-sunken)':'var(--surface-card)',border:'1px solid '+(focus?'var(--border-focus)':'var(--border-default)'),borderRadius:big?'var(--radius-lg)':'var(--radius-md)',
            boxShadow:focus?'0 0 0 3px var(--focus-halo)':'var(--shadow-xs)',outline:'none',cursor:disabled?'not-allowed':'pointer'}}>
          {placeholder && <option value="" disabled>{placeholder}</option>}
          {options.map(o=>{const v=typeof o==='string'?o:o.value;const l=typeof o==='string'?o:o.label;return <option key={v} value={v}>{l}</option>})}
        </select>
        <span style={{position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',pointerEvents:'none',color:'var(--text-sub)'}}><Icon name="arrow-down-01" size={16} /></span>
      </div>
    </div>
  );
}
