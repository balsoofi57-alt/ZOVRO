'use strict';
(function(){
  // Default to +1 for US customers; never discard an explicitly entered international code.
  function normalize(value){
    const v=String(value??'').trim().replace(/[\s().-]/g,'');
    if(!v||v==='+1')return '';
    if(/^\d{10}$/.test(v))return '+1'+v;
    if(/^1\d{10}$/.test(v))return '+'+v;
    if(/^\+[1-9]\d{7,14}$/.test(v))return v;
    // Preserve older accounts that were stored with an unprefixed non-US number.
    if(/^\d{7,15}$/.test(v))return v;
    return null;
  }
  function bind(input){
    if(!input||input.dataset.zovroPhoneBound==='1')return;
    input.dataset.zovroPhoneBound='1';
    const prime=()=>{if(!input.value.trim())input.value='+1';};
    prime();
    input.addEventListener('focus',prime);
    input.addEventListener('blur',prime);
    input.addEventListener('paste',event=>{
      const pasted=event.clipboardData?.getData('text')||'';
      const number=normalize(pasted);
      if(number&&(input.value.trim()==='+1'||!input.value.trim())){
        event.preventDefault();
        input.value=number;
      }
    });
  }
  window.ZOVRO_PHONE_INPUT={normalize,bind};
  const init=()=>bind(document.getElementById('phone'));
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init):init();
})();
