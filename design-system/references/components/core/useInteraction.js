import React from 'react';
export function useInteraction(disabled){
  const [hover,setHover]=React.useState(false);
  const [press,setPress]=React.useState(false);
  const [focus,setFocus]=React.useState(false);
  const bind=disabled?{}:{
    onMouseEnter:()=>setHover(true),onMouseLeave:()=>{setHover(false);setPress(false)},
    onPointerDown:()=>setPress(true),onPointerUp:()=>setPress(false),
    onFocus:(e)=>{try{setFocus(e.target.matches(':focus-visible'))}catch(_){setFocus(true)}},onBlur:()=>setFocus(false)
  };
  return {hover,press,focus,bind};
}
