(function(){
  'use strict';
  const KEY='zovroToken',BIOMETRIC_PREF='zovroBiometricUnlock';
  let ready=false,lastKnown='',busy=false,locked=false;
  const plugin=()=>window.Capacitor?.Plugins?.SecureStoragePlugin||null;
  const biometricRequested=()=>localStorage.getItem(BIOMETRIC_PREF)==='1';
  const currentToken=()=>{try{return typeof token!=='undefined'?String(token||''):''}catch{return ''}};
  const setRuntime=v=>{const value=String(v||'');try{token=value}catch{}window.ZOVRO_SESSION_TOKEN=value;lastKnown=value};
  async function get(){const p=plugin();if(p){try{return String((await p.get({key:KEY}))?.value||'')}catch{return ''}}return String(sessionStorage.getItem(KEY)||'')}
  async function set(value){const p=plugin();if(p){await p.set({key:KEY,value:String(value||'')});return}sessionStorage.setItem(KEY,String(value||''))}
  async function remove(){const p=plugin();if(p){try{await p.remove({key:KEY})}catch{}return}sessionStorage.removeItem(KEY)}
  async function restoreAccount(){
    try{
      if(typeof api!=='function')return false;
      const user=(await api('/me')).user;
      try{me=user}catch{}
      if(typeof renderAccount==='function')renderAccount();
      if(typeof loadJobs==='function')loadJobs();
      if(window.ZOVRO_PUSH?.syncUser)window.ZOVRO_PUSH.syncUser();
      return true;
    }catch{
      setRuntime('');localStorage.removeItem(KEY);await remove();
      try{me=null}catch{}
      if(typeof renderAccount==='function')renderAccount();
      return false;
    }
  }
  async function initialize(){
    const native=plugin();
    const legacy=String(localStorage.getItem(KEY)||'');
    let saved=await get();
    if(legacy){await set(legacy);saved=legacy;localStorage.removeItem(KEY)}
    // Never expose or validate a persisted token before local verification
    // when the user opted into biometric session unlocking.
    locked=biometricRequested()&&!!saved;
    if(locked){
      setRuntime('');
    }else if(saved&&!currentToken()){
      setRuntime(saved);
      await restoreAccount();
    }else if(currentToken()){
      await set(currentToken());localStorage.removeItem(KEY);setRuntime(currentToken());
    }else setRuntime('');
    ready=true;
    return {native:!!native,restored:!!saved&&!locked,locked};
  }
  async function hasSavedSession(){
    if(!ready)await initialLoad;
    return !!(await get());
  }
  async function unlockWithBiometrics(){
    if(!ready)await initialLoad;
    if(!biometricRequested()||!locked)return {ok:false,reason:'inactive'};
    if(!plugin())return {ok:false,reason:'secure-storage-unavailable'};
    const biometric=window.ZOVRO_BIOMETRIC;
    const status=await biometric?.check?.();
    if(!status?.native||!status?.available)return {ok:false,reason:'biometrics-unavailable'};
    if(!(await biometric.authenticate('Sign in to ZOVRO with Face ID')))return {ok:false,reason:'verification-failed'};
    const saved=await get();
    if(!saved)return {ok:false,reason:'no-saved-session'};
    setRuntime(saved);
    locked=false;
    if(!(await restoreAccount())){
      locked=biometricRequested();
      return {ok:false,reason:'session-expired'};
    }
    return {ok:true};
  }
  async function sync(){
    if(!ready||busy)return;busy=true;
    try{
      const legacy=String(localStorage.getItem(KEY)||''),runtime=currentToken();
      if(locked){
        // A saved session must stay locked. A new password sign-in can
        // establish its own active token without using the saved one.
        if(!runtime)return;
        locked=false;
      }
      if(legacy){await set(legacy);localStorage.removeItem(KEY);setRuntime(legacy);return}
      if(runtime&&runtime!==lastKnown){await set(runtime);setRuntime(runtime);return}
      if(!runtime&&lastKnown){await remove();setRuntime('');return}
      window.ZOVRO_SESSION_TOKEN=runtime;
    }catch(e){console.warn('ZOVRO secure session sync unavailable:',e?.message||e)}finally{busy=false}
  }
  window.ZOVRO_SECURE_SESSION={
    set,remove,initialize,sync,hasSavedSession,unlockWithBiometrics,
    isNativeSecure:()=>!!plugin(),
    status:()=>({native:!!plugin(),ready,locked,hasSession:!!currentToken()})
  };
  const initialLoad=initialize().catch(e=>{
    console.warn('ZOVRO secure session unavailable:',e?.message||e);
    setRuntime('');locked=biometricRequested();ready=true;
  });
  setInterval(sync,750);
})();
