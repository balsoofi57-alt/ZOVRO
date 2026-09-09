(function(){
  'use strict';
  const PREF='zovroBiometricUnlock';
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
    setEnabled(true);renderCard();toastSafe('Face ID / biometric unlock enabled.');return true;
  }
  function disable(){setEnabled(false);renderCard();toastSafe('Biometric unlock disabled.')}
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
    card.innerHTML='<strong>Face ID & Biometric Unlock</strong><p class="muted" style="margin:7px 0 12px">Protect the saved ZOVRO session using the biometric security already enrolled on this device. ZOVRO never receives or stores your face or fingerprint data.</p>'+
      (status.native&&status.available
        ? `<button class="btn ${on?'ghost':'primary'}" id="zovroBiometricToggle">${on?'Disable biometric unlock':'Enable Face ID / biometrics'}</button>`
        : '<span class="muted">Biometric unlock will be available on a supported iPhone or Android device.</span>');
    const button=document.getElementById('zovroBiometricToggle');if(button)button.onclick=()=>on?disable():enable();
  }
  function shouldProtect(){return enabled()}
  window.ZOVRO_BIOMETRIC={check,authenticate,enable,disable,shouldProtect,status:()=>({enabled:enabled(),native:!!plugin()})};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',renderCard);else renderCard();
  const observer=new MutationObserver(()=>{if(document.getElementById('profile')&&!document.getElementById('biometricCard'))renderCard()});
  observer.observe(document.documentElement,{childList:true,subtree:true});
})();
