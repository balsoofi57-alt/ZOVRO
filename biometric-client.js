(function(){
  'use strict';
  const PREF='zovroBiometricUnlock';
  const LOGIN_BUTTON_ID='zovroFaceIdLogin';
  let nativeBridge=null,shortcutPending=false,unlockBusy=false,renderRevision=0;

  const nativePlatform=()=>{
    const cap=window.Capacitor;
    if(!cap)return false;
    if(typeof cap.isNativePlatform==='function')return !!cap.isNativePlatform();
    const name=typeof cap.getPlatform==='function'?cap.getPlatform():cap.platform;
    return name==='ios'||name==='android';
  };
  const plugin=()=>{
    if(!nativePlatform())return null;
    const cap=window.Capacitor;
    const registered=cap?.Plugins?.BiometricAuthNative||cap?.Plugins?.BiometricAuth;
    if(registered)return registered;
    // Capacitor's native bridge may be present without the package's JS proxy
    // because this app uses local script tags rather than an ESM bundler.
    if(typeof cap?.nativePromise==='function'){
      if(!nativeBridge)nativeBridge={
        checkBiometry:()=>cap.nativePromise('BiometricAuthNative','checkBiometry',{}),
        authenticate:options=>cap.nativePromise('BiometricAuthNative','internalAuthenticate',options)
      };
      return nativeBridge;
    }
    return null;
  };
  const enabled=()=>localStorage.getItem(PREF)==='1';
  const setEnabled=value=>{if(value)localStorage.setItem(PREF,'1');else localStorage.removeItem(PREF)};
  const currentUser=()=>{try{return typeof me==='undefined'?null:me}catch{return null}};
  const currentToken=()=>{try{return typeof token==='string'?token:String(window.ZOVRO_SESSION_TOKEN||'')}catch{return ''}};
  function toastSafe(message){try{if(typeof toast==='function')return toast(message)}catch{}console.log(message)}

  async function check(){
    const p=plugin();
    if(!p||typeof p.checkBiometry!=='function')return {available:false,native:!!p};
    try{
      const info=await p.checkBiometry();
      return {available:!!info?.isAvailable,native:true,info};
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
      androidConfirmationRequired:false
    };
    try{
      // The installed plugin's public method is authenticate(); when using the
      // native bridge directly we invoke its native internalAuthenticate().
      if(typeof p.authenticate==='function'){await p.authenticate(options);return true}
      if(typeof p.internalAuthenticate==='function'){await p.internalAuthenticate(options);return true}
      return false;
    }catch{return false}
  }
  async function enable(){
    const account=currentUser(),session=currentToken();
    if(!account?.id||!session){toastSafe('Sign in once with your phone and password before enabling Face ID.');return false}
    if(!window.ZOVRO_SECURE_SESSION?.isNativeSecure?.()){
      toastSafe('Face ID sign-in requires the ZOVRO iPhone or Android app.');return false;
    }
    const status=await check();
    if(!status.available){toastSafe('Biometric authentication is not available on this device.');return false}
    if(!(await authenticate('Confirm biometrics to protect your ZOVRO account'))){
      toastSafe('Biometric authentication was not enabled.');return false;
    }
    try{
      await window.ZOVRO_SECURE_SESSION.set(session);
      const saved=await window.ZOVRO_SECURE_SESSION.get();
      if(saved!==session||currentUser()?.id!==account.id||currentToken()!==session)throw Error('Session changed or could not be saved');
    }catch{
      toastSafe('Could not save your sign-in securely. Face ID remains off.');return false;
    }
    setEnabled(true);renderCard();renderLoginShortcut();
    toastSafe('Face ID / biometric unlock enabled.');return true;
  }
  function disable(){
    setEnabled(false);
    renderCard();document.getElementById(LOGIN_BUTTON_ID)?.remove();
    toastSafe('Biometric unlock disabled.');
  }
  async function renderCard(){
    const profile=document.getElementById('profile');if(!profile)return;
    let card=document.getElementById('biometricCard');
    if(!card){
      card=document.createElement('div');card.id='biometricCard';card.className='card';
      card.style.marginTop='12px';
      document.getElementById('profileBox')?.insertAdjacentElement('afterend',card);
    }
    const revision=++renderRevision;
    const status=await check();if(revision!==renderRevision)return;
    const on=enabled(),signedIn=!!currentUser()?.id&&!!currentToken();
    card.innerHTML='<strong>Face ID & Biometric Unlock</strong><p class="muted" style="margin:7px 0 12px">Protect the saved ZOVRO session using the biometric security already enrolled on this device. ZOVRO never receives or stores your face or fingerprint data, and it does not store your raw password for Face ID sign-in.</p>'+
      (status.native&&status.available
        ? on||signedIn
          ? `<button type="button" class="btn ${on?'ghost':'primary'}" id="zovroBiometricToggle">${on?'Disable biometric unlock':'Enable Face ID / biometrics'}</button>`
          : '<span class="muted">Sign in once with your phone and password to enable Face ID.</span>'
        : '<span class="muted">Biometric unlock is available only in the installed ZOVRO app on a supported iPhone or Android device.</span>');
    const button=document.getElementById('zovroBiometricToggle');
    if(button)button.onclick=()=>on?disable():enable();
  }
  async function unlockSavedSession(){
    if(unlockBusy||!enabled())return false;
    unlockBusy=true;
    try{
      const status=await check();
      if(!status.available){toastSafe('Face ID / biometrics are not available on this device.');return false}
      const saved=await window.ZOVRO_SECURE_SESSION?.get?.();
      if(!saved){toastSafe('Sign in once with your phone and password, then Face ID can be used next time.');return false}
      if(!(await authenticate('Sign in to ZOVRO with Face ID'))){
        toastSafe('Face ID sign-in was canceled or could not be verified.');return false;
      }
      try{
        window.ZOVRO_SESSION_TOKEN=String(saved);
        try{token=String(saved)}catch{}
        if(typeof api!=='function')throw Error('Account verification is unavailable');
        const result=await api('/me');
        if(!result?.user?.id)throw Error('Account verification did not return a user');
        try{me=result.user}catch{}
        if(typeof renderAccount==='function')renderAccount();
        if(typeof loadJobs==='function')loadJobs();
        if(window.ZOVRO_PUSH?.syncUser)window.ZOVRO_PUSH.syncUser();
        if(typeof closeModal==='function')closeModal('authModal');
        if(typeof resumeRequestIntent==='function')resumeRequestIntent();
        toastSafe('Signed in with Face ID.');
        return true;
      }catch(e){
        // A lost network connection is not proof the saved session expired.
        window.ZOVRO_SESSION_TOKEN='';
        try{token='';me=null}catch{}
        if(typeof renderAccount==='function')renderAccount();
        if(e?.status===401){
          try{await window.ZOVRO_SECURE_SESSION?.remove?.()}catch{}
          setEnabled(false);
          document.getElementById(LOGIN_BUTTON_ID)?.remove();
          toastSafe('Your saved sign-in has expired. Please sign in with your password once.');
        }else{
          toastSafe('Could not verify your account. Your saved Face ID sign-in is preserved; try again when connected.');
        }
        return false;
      }
    }finally{unlockBusy=false}
  }
  async function renderLoginShortcut(){
    if(shortcutPending||document.getElementById(LOGIN_BUTTON_ID)||!enabled())return;
    shortcutPending=true;
    try{
      const status=await check();if(!status.available)return;
      const password=document.querySelector('input[type="password"]');if(!password)return;
      const saved=await window.ZOVRO_SECURE_SESSION?.get?.();if(!saved||!enabled())return;
      if(document.getElementById(LOGIN_BUTTON_ID))return;
      const host=password.closest('.field')||password.parentElement;if(!host)return;
      const btn=document.createElement('button');
      btn.type='button';btn.id=LOGIN_BUTTON_ID;btn.className='btn ghost';
      btn.style.cssText='width:100%;margin-top:10px;display:flex;align-items:center;justify-content:center;gap:8px';
      btn.innerHTML='<span aria-hidden="true">◉</span> Sign in with Face ID';
      btn.onclick=unlockSavedSession;
      host.insertAdjacentElement('afterend',btn);
    }finally{shortcutPending=false}
  }
  function shouldProtect(){return enabled()}
  window.ZOVRO_BIOMETRIC={check,authenticate,enable,disable,unlockSavedSession,renderCard,renderLoginShortcut,shouldProtect,status:()=>({enabled:enabled(),native:nativePlatform(),pluginAvailable:!!plugin()})};
  function boot(){
    renderCard();setTimeout(renderLoginShortcut,200);
    const original=window.renderAccount;
    if(typeof original==='function'&&!original.__zovroFaceIdCard){
      const wrapped=function(){const result=original.apply(this,arguments);renderCard();return result};
      wrapped.__zovroFaceIdCard=true;
      window.renderAccount=wrapped;
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
  const observer=new MutationObserver(()=>{
    if(document.getElementById('profile')&&!document.getElementById('biometricCard'))renderCard();
    if(!document.getElementById(LOGIN_BUTTON_ID))renderLoginShortcut();
  });
  observer.observe(document.documentElement,{childList:true,subtree:true});
})();
