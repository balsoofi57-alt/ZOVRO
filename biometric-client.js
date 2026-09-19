(function(){
  'use strict';
  const PREF='zovroBiometricUnlock';
  const LOGIN_BUTTON_ID='zovroFaceIdLogin';
  const plugin=()=>window.Capacitor?.Plugins?.BiometricAuthNative||window.Capacitor?.Plugins?.BiometricAuth||null;
  const enabled=()=>localStorage.getItem(PREF)==='1';
  const setEnabled=value=>{if(value)localStorage.setItem(PREF,'1');else localStorage.removeItem(PREF)};
  async function check(){
    const p=plugin();
    if(!p)return {available:false,native:false};
    try{
      if(typeof p.checkBiometry==='function'){
        const info=await p.checkBiometry();
        return {available:!!info?.isAvailable,native:true,info};
      }
      return {available:true,native:true};
    }catch{return {available:false,native:true}}
  }
  async function authenticate(reason='Unlock ZOVRO'){
    const p=plugin();
    if(!p)return false;
    const options={
      reason,
      cancelTitle:'Cancel',
      allowDeviceCredential:true,
      iosFallbackTitle:'Use device passcode',
      androidTitle:'Unlock ZOVRO',
      androidSubtitle:'Use face, fingerprint, or device credential',
      androidConfirmationRequired:false,
      androidBiometryStrength:'weak'
    };
    try{
      if(typeof p.internalAuthenticate==='function'){await p.internalAuthenticate(options);return true}
      if(typeof p.authenticate==='function'){await p.authenticate(options);return true}
      return false;
    }catch{return false}
  }
  async function enable(){
    const status=await check();
    if(!status.available){toastSafe('Biometric authentication is not available on this device.');return false}
    if(!(await authenticate('Confirm biometrics to protect your ZOVRO account'))){toastSafe('Biometric authentication was not enabled.');return false}
    setEnabled(true);renderCard();renderLoginShortcut();toastSafe('Face ID / biometric unlock enabled.');return true;
  }
  function disable(){setEnabled(false);renderCard();document.getElementById(LOGIN_BUTTON_ID)?.remove();toastSafe('Biometric unlock disabled.')}
  function toastSafe(message){try{if(typeof toast==='function')return toast(message)}catch{}console.log(message)}
  async function renderCard(){
    const profile=document.getElementById('profile');if(!profile)return;
    let card=document.getElementById('biometricCard');
    if(!card){
      card=document.createElement('div');card.id='biometricCard';card.className='card';card.style.marginTop='12px';
      const profileBox=document.getElementById('profileBox');profileBox?.insertAdjacentElement('afterend',card);
    }
    const status=await check();
    const on=enabled();
    card.innerHTML='<strong>Face ID & Biometric Unlock</strong><p class="muted" style="margin:7px 0 12px">Protect the saved ZOVRO session using the biometric security already enrolled on this device. ZOVRO never receives or stores your face or fingerprint data, and it does not store your raw password for Face ID sign-in.</p>'+
      (status.native&&status.available
        ? `<button class="btn ${on?'ghost':'primary'}" id="zovroBiometricToggle">${on?'Disable biometric unlock':'Enable Face ID / biometrics'}</button>`
        : '<span class="muted">Biometric unlock will be available on a supported iPhone or Android device.</span>');
    const button=document.getElementById('zovroBiometricToggle');if(button)button.onclick=()=>on?disable():enable();
  }
  async function unlockSavedSession(){
    if(!enabled())return false;
    const status=await check();
    if(!status.available){toastSafe('Face ID / biometrics are not available on this device.');return false}
    const saved=await window.ZOVRO_SECURE_SESSION?.get?.();
    if(!saved){toastSafe('Sign in once with your phone and password, then Face ID can be used next time.');return false}
    if(!(await authenticate('Sign in to ZOVRO with Face ID'))){toastSafe('Face ID sign-in was canceled or could not be verified.');return false}
    try{
      window.ZOVRO_SESSION_TOKEN=String(saved||'');
      try{token=String(saved||'')}catch{}
      if(typeof api==='function'){
        const result=await api('/me');
        try{me=result.user}catch{}
        if(typeof renderAccount==='function')renderAccount();
        if(typeof loadJobs==='function')loadJobs();
        if(window.ZOVRO_PUSH?.syncUser)window.ZOVRO_PUSH.syncUser();
      }
      toastSafe('Signed in with Face ID.');
      return true;
    }catch{
      try{await window.ZOVRO_SECURE_SESSION?.remove?.()}catch{}
      window.ZOVRO_SESSION_TOKEN='';
      try{token=''}catch{}
      toastSafe('Your saved sign-in has expired. Please sign in with your password once.');
      return false;
    }
  }
  async function renderLoginShortcut(){
    if(document.getElementById(LOGIN_BUTTON_ID)||!enabled())return;
    const status=await check();if(!status.available)return;
    const password=document.querySelector('input[type="password"]');if(!password)return;
    const saved=await window.ZOVRO_SECURE_SESSION?.get?.();if(!saved)return;
    const host=password.closest('.field')||password.parentElement;if(!host)return;
    const btn=document.createElement('button');
    btn.type='button';btn.id=LOGIN_BUTTON_ID;btn.className='btn ghost';btn.style.cssText='width:100%;margin-top:10px;display:flex;align-items:center;justify-content:center;gap:8px';
    btn.innerHTML='<span aria-hidden="true">◉</span> Sign in with Face ID';
    btn.onclick=unlockSavedSession;
    host.insertAdjacentElement('afterend',btn);
  }
  function shouldProtect(){return enabled()}
  window.ZOVRO_BIOMETRIC={check,authenticate,enable,disable,unlockSavedSession,renderLoginShortcut,shouldProtect,status:()=>({enabled:enabled(),native:!!plugin()})};
  function boot(){renderCard();setTimeout(renderLoginShortcut,200)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
  const observer=new MutationObserver(()=>{
    if(document.getElementById('profile')&&!document.getElementById('biometricCard'))renderCard();
    if(!document.getElementById(LOGIN_BUTTON_ID))renderLoginShortcut();
  });
  observer.observe(document.documentElement,{childList:true,subtree:true});
})();
