'use strict';
(()=>{
  const TERMS_VERSION='2026-09-09';
  const PRIVACY_VERSION='2026-09-09';
  const REQUEST_VERSION='service-request-v1';
  const LEGAL_KEY='zovroLegalAccepted:'+TERMS_VERSION+':'+PRIVACY_VERSION;
  const $=id=>document.getElementById(id);

  function consentMarkup(id,text){
    return `<label style="display:flex;gap:9px;align-items:flex-start;margin:12px 0;font-size:12px;line-height:1.45"><input id="${id}" type="checkbox" style="width:auto;margin-top:3px"><span>${text} <a href="terms.html" target="_blank" rel="noopener">Terms</a> and <a href="privacy.html" target="_blank" rel="noopener">Privacy Policy</a>.</span></label>`;
  }

  function ensureUi(){
    const register=$('registerFields');
    if(register&&register.querySelector('#name')&&!$('legalAccountConsent')){
      register.insertAdjacentHTML('beforeend',consentMarkup('legalAccountConsent','I agree to the current ZOVRO'));
    }
    const request=$('requestModal')?.querySelector('.sheet');
    if(request&&!$('legalRequestConsent')){
      const bars=request.querySelectorAll('.bar');
      const target=bars[bars.length-1];
      if(target)target.insertAdjacentHTML('beforebegin',consentMarkup('legalRequestConsent','I agree that this service request is governed by the current ZOVRO'));
    }
  }

  function accountConsentAccepted(){return !!$('legalAccountConsent')?.checked}
  function requestConsentAccepted(){return !!$('legalRequestConsent')?.checked}
  function rememberLegal(){localStorage.setItem(LEGAL_KEY,'accepted')}
  function hasRememberedLegal(){return localStorage.getItem(LEGAL_KEY)==='accepted'}
  function ensureSosLegal(){
    if(hasRememberedLegal())return true;
    const ok=window.confirm('Before sending SOS roadside assistance, please review and accept the current ZOVRO Terms and Privacy Policy. This is not 911 or emergency medical/police/fire dispatch. Continue and accept?');
    if(ok)rememberLegal();
    return ok;
  }

  const originalFetch=window.fetch.bind(window);
  window.fetch=async(input,init={})=>{
    const url=typeof input==='string'?input:String(input?.url||'');
    const method=String(init.method||input?.method||'GET').toUpperCase();
    const headers=new Headers(init.headers||input?.headers||{});
    let isRegister=method==='POST'&&/\/api\/auth\/register(?:$|\?)/.test(url);
    let isRequest=method==='POST'&&/\/api\/requests(?:$|\?)/.test(url);
    let body=null;
    if(isRequest&&typeof init.body==='string')try{body=JSON.parse(init.body)}catch{}

    if(isRegister){
      ensureUi();
      if(!accountConsentAccepted())throw new Error('Accept the Terms and Privacy Policy to create your ZOVRO account.');
      headers.set('X-ZOVRO-Terms-Version',TERMS_VERSION);
      headers.set('X-ZOVRO-Privacy-Version',PRIVACY_VERSION);
    }

    if(isRequest){
      const sos=body?.source==='sos';
      if(sos){
        if(!ensureSosLegal())throw new Error('Terms and Privacy acceptance is required before sending an SOS roadside request.');
        headers.set('X-ZOVRO-Request-Kind','sos');
      }else{
        ensureUi();
        if(!requestConsentAccepted())throw new Error('Accept the service request terms before sending this request.');
        headers.set('X-ZOVRO-Request-Consent',REQUEST_VERSION);
      }
      headers.set('X-ZOVRO-Terms-Version',TERMS_VERSION);
      headers.set('X-ZOVRO-Privacy-Version',PRIVACY_VERSION);
    }

    const response=await originalFetch(input,{...init,headers});
    if(isRegister&&response.ok)rememberLegal();
    if(isRequest&&response.ok&&$('legalRequestConsent'))$('legalRequestConsent').checked=false;
    return response;
  };

  new MutationObserver(ensureUi).observe(document.documentElement,{subtree:true,childList:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ensureUi);else ensureUi();
  window.ZOVRO_CONSENT={TERMS_VERSION,PRIVACY_VERSION,REQUEST_VERSION};
})();
