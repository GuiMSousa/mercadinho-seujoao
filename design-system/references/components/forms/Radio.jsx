import React from 'react';
export function Radio({ name, value, checked, onChange, label, description, disabled=false, size=18, style }) {
  return (
    <label style={{display:'inline-flex',alignItems:description?'flex-start':'center',gap:10,cursor:disabled?'not-allowed':'pointer',color:disabled?'var(--text-disabled)':'var(--text-body)',...style}}>
      <span style={{position:'relative',width:size,height:size,flexShrink:0,marginTop:description?1:0}}>
        <input type="radio" name={name} value={value} checked={checked} disabled={disabled} onChange={e=>onChange&&onChange(value,e)} style={{position:'absolute',inset:0,margin:0,opacity:0,cursor:'inherit'}} />
        <span aria-hidden="true" style={{position:'absolute',inset:0,borderRadius:'50%',border:checked?'1px solid var(--action-brand)':'1.5px solid var(--border-strong)',background:'var(--surface-card)',display:'flex',alignItems:'center',justifyContent:'center'}}>
          {checked && <span style={{width:size*0.55,height:size*0.55,borderRadius:'50%',background:'var(--action-brand)'}} />}
        </span>
      </span>
      {(label||description) && <span style={{display:'flex',flexDirection:'column',gap:2}}>
        <span style={{fontSize:'var(--text-body-md)',color:'var(--text-strong)',fontWeight:'var(--weight-medium)'}}>{label}</span>
        {description && <span style={{fontSize:'var(--text-body-sm)',color:'var(--text-sub)'}}>{description}</span>}
      </span>}
    </label>
  );
}
