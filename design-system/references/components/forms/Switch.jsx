import React from 'react';
export function Switch({ checked, defaultChecked, onChange, label, disabled=false, style }) {
  const [inner,setInner]=React.useState(!!defaultChecked);
  const on=checked!==undefined?checked:inner;
  const toggle=()=>{if(disabled)return;if(checked===undefined)setInner(!on);onChange&&onChange(!on)};
  return (
    <label style={{display:'inline-flex',alignItems:'center',gap:10,cursor:disabled?'not-allowed':'pointer',fontSize:'var(--text-body-md)',color:disabled?'var(--text-disabled)':'var(--text-body)',...style}}>
      <button type="button" role="switch" aria-checked={on} disabled={disabled} onClick={toggle}
        style={{width:36,height:20,borderRadius:999,border:0,padding:2,background:on?'var(--action-brand)':'var(--switch-off)',cursor:'inherit',display:'flex',transition:'background var(--dur-base) var(--ease-out)',outlineOffset:2}}>
        <span style={{width:16,height:16,borderRadius:'50%',background:'#fff',boxShadow:'0 1px 2px rgba(14,18,27,.2)',transform:on?'translateX(16px)':'none',transition:'transform var(--dur-base) var(--ease-out)'}} />
      </button>
      {label}
    </label>
  );
}
