import React from 'react';
import { Icon } from '../core/Icon.jsx';
export function Checkbox({ checked, defaultChecked, onChange, label, disabled=false, size=16, id, style }) {
  const [inner,setInner]=React.useState(!!defaultChecked);
  const on=checked!==undefined?checked:inner;
  const toggle=(e)=>{if(disabled)return;if(checked===undefined)setInner(!on);onChange&&onChange(!on,e)};
  return (
    <label style={{display:'inline-flex',alignItems:'center',gap:8,cursor:disabled?'not-allowed':'pointer',fontSize:'var(--text-body-md)',color:disabled?'var(--text-disabled)':'var(--text-body)',...style}}>
      <span style={{position:'relative',width:size,height:size,flexShrink:0}}>
        <input type="checkbox" id={id} checked={on} disabled={disabled} onChange={toggle} style={{position:'absolute',inset:0,margin:0,opacity:0,cursor:'inherit'}} />
        <span aria-hidden="true" style={{position:'absolute',inset:0,borderRadius:4,display:'flex',alignItems:'center',justifyContent:'center',
          background:on?'var(--action-brand)':'var(--surface-card)',border:on?'1px solid var(--action-brand)':'1.5px solid var(--border-strong)',color:'var(--text-on-color)',transition:'background var(--dur-fast)'}}>
          {on && <Icon name="tick-02" size={size-4} />}
        </span>
      </span>
      {label}
    </label>
  );
}
