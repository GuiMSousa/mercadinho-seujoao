import React from 'react';
import { Icon } from '../core/Icon.jsx';
const H={sm:'var(--control-sm)',md:'var(--control-md)',lg:'var(--control-lg)',counter:'var(--control-counter)'};
export function Input({ label, hint, error, prefix, suffix, leadingIcon, size='md', id, value, defaultValue, onChange, placeholder, type='text', inputMode, disabled=false, readOnly=false, autoFocus, numeric=false, style, inputStyle, ...rest }) {
  const [focus,setFocus]=React.useState(false);
  const uid=React.useId?React.useId():undefined; const iid=id||uid;
  const big=size==='counter';
  const fs=big?'var(--text-counter)':(size==='lg'?'var(--text-body-lg)':'var(--text-body-md)');
  const bc=error?'var(--danger-solid)':(focus?'var(--border-focus)':'var(--border-default)');
  return (
    <div style={{display:'flex',flexDirection:'column',gap:6,minWidth:0,...style}}>
      {label && <label htmlFor={iid} style={{fontSize:big?'var(--text-body-lg)':'var(--text-body-sm)',fontWeight:'var(--weight-medium)',color:'var(--text-strong)'}}>{label}</label>}
      <div style={{display:'flex',alignItems:'center',gap:8,height:H[size]||H.md,padding:'0 '+(big?16:12)+'px',background:disabled?'var(--surface-sunken)':'var(--surface-card)',
        border:'1px solid '+bc,borderRadius:big?'var(--radius-lg)':'var(--radius-md)',boxShadow:focus?(error?'0 0 0 3px var(--focus-halo-danger)':'0 0 0 3px var(--focus-halo)'):'var(--shadow-xs)',transition:'box-shadow var(--dur-fast),border-color var(--dur-fast)'}}>
        {leadingIcon && <Icon name={leadingIcon} size={big?24:18} color="var(--text-soft)" />}
        {prefix && <span style={{fontSize:fs,color:'var(--text-sub)',fontVariantNumeric:'tabular-nums'}}>{prefix}</span>}
        <input id={iid} type={type} inputMode={inputMode} value={value} defaultValue={defaultValue} onChange={onChange} placeholder={placeholder} disabled={disabled} readOnly={readOnly} autoFocus={autoFocus}
          aria-invalid={!!error} aria-describedby={(error||hint)?iid+'-d':undefined}
          onFocus={()=>setFocus(true)} onBlur={()=>setFocus(false)} {...rest}
          style={{flex:1,minWidth:0,border:0,outline:'none',background:'transparent',fontFamily:'var(--font-sans)',fontSize:fs,fontWeight:big?'var(--weight-medium)':'var(--weight-regular)',color:'var(--text-strong)',
            textAlign:numeric?'right':'left',fontVariantNumeric:numeric?'tabular-nums':undefined,height:'100%',padding:0,...inputStyle}} />
        {suffix && <span style={{fontSize:'var(--text-body-sm)',color:'var(--text-sub)'}}>{suffix}</span>}
      </div>
      {(error||hint) && <span id={iid+'-d'} style={{fontSize:'var(--text-caption)',lineHeight:'var(--lh-caption)',color:error?'var(--danger-fg)':'var(--text-sub)',display:'flex',gap:4,alignItems:'center'}}>{error && <Icon name="alert-circle" size={14} />}{error||hint}</span>}
    </div>
  );
}
