(function(){
'use strict';
// Progressive enhancement only: no changes to account records or authentication endpoints.
const $=id=>document.getElementById(id);
function init(){
 const modal=$('authModal'),form=$('signInForm');if(!modal||!form||$('zSmartAuth'))return;
 const panel=document.createElement('section');panel.id='zSmartAuth';panel.setAttribute('aria-label','Quick sign-in options');
 panel.style.cssText='display:grid;gap:10px;margin:16px 0';
 const face=document.createElement('button');face.type='button';face.className='btn primary';face.textContent='Continue with Face ID';face.hidden=true;
 face.onclick=async()=>{face.disabled=true;try{const ok=await window.ZOVRO_BIOMETRIC?.unlockSavedSession?.();if(!ok){const status=$('authStatus');if(status){status.hidden=false;status.textContent='Face ID was canceled or unavailable. Use your password to sign in.'}}}catch{const status=$('authStatus');if(status){status.hidden=false;status.textContent='Face ID could not be completed. Use your password to sign in.'}}finally{face.disabled=false}};
 panel.appendChild(face);
 const password=document.createElement('button');password.type='button';password.className='btn ghost';password.textContent='Use phone and password';
 password.setAttribute('aria-expanded','true');panel.appendChild(password);
 const hint=document.createElement('p');hint.className='muted';hint.style.cssText='font-size:12px;margin:0';hint.textContent='Your existing ZOVRO account and password still work.';panel.appendChild(hint);
 const tabs=modal.querySelector('.tabs');if(tabs)tabs.insertAdjacentElement('afterend',panel);else form.before(panel);
 function refresh(){
  const login=typeof authMode==='undefined' ? $('password')?.autocomplete!=='new-password' : authMode==='login';
  panel.hidden=!login;
  if(!login){form.hidden=false;return}
  const biometric=window.ZOVRO_BIOMETRIC?.status?.();
  const supported=biometric?.enabled===true && biometric?.native===true && window.ZOVRO_SECURE_SESSION?.isNativeSecure?.()===true;
  face.hidden=!supported || !!$('zovroFaceIdLogin'); // Never offer web-only biometrics or duplicate the legacy native shortcut.
  form.hidden=false; // Always preserve existing password login.
 }
 password.onclick=()=>{$('phone')?.focus()};
 const observer=new MutationObserver(refresh);observer.observe(modal,{childList:true,subtree:true});refresh();
 // Only expose third-party providers once a verified native integration explicitly registers a handler.
 window.ZOVRO_SMART_AUTH={
  registerProvider(name,handler){
   if(!['Apple','Google'].includes(name)||typeof handler!=='function')return false;
   if(panel.querySelector('[data-provider="'+name+'"]'))return false;
   const button=document.createElement('button');button.type='button';button.className='btn ghost';button.dataset.provider=name;
   button.textContent='Continue with '+name;button.onclick=async()=>{button.disabled=true;try{await handler()}catch(e){const status=$('authStatus');if(status){status.hidden=false;status.textContent='Sign-in could not be completed. Try another method.'}}finally{button.disabled=false}};
   panel.insertBefore(button,password);return true;
  }
 };
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();