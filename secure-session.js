(function(){
  'use strict';
  const KEY='zovroToken';
  let ready=false,lastKnown='',busy=false;
  const plugin=()=>window.Capacitor?.Plugins?.SecureStoragePlugin||null;
  const currentToken=()=>{try{return typeof token!=='undefined'?String(token||''):''}catch{return ''}};
  // A biometric opt-in is a startup read barrier: do not retrieve a bearer
  // token, including from legacy localStorage, before the device unlocks.
  const biometricLocked=()=>window.ZOVRO_BIOMETRIC?.shouldProtect?.()===true;
  const setRuntime=v=>{const value=String(v||'');try{token=value}catch{}window.ZOVRO_SESSION_TOKEN=value;lastKnown=value};
  async function get(){const p=plugin();if(p){try{return String((await p.get({key:KEY}))?.value||'')}catch{return ''}}return String(sessionStorage.getItem(KEY)||'')}
  async function set(value){const p=plugin();if(p){await p.set({key:KEY,value:String(value||'')});return}sessionStorage.setItem(KEY,String(value||''))}
  async function remove(){const p=plugin();if(p){try{await p.remove({key:KEY})}catch{}return}sessionStorage.removeItem(KEY)}
  async function restoreAccount(){
    try{
      if(typeof api!=='function')return;
      const user=(await api('/me')).user;
      try{me=user}catch{}
      if(typeof renderAccount==='function')renderAccount();
      if(typeof loadJobs==='function')loadJobs();
      if(window.ZOVRO_PUSH?.syncUser)window.ZOVRO_PUSH.syncUser();
    }catch{
      setRuntime('');localStorage.removeItem(KEY);await remove();
      try{me=null}catch{}
      if(typeof renderAccount==='function')renderAccount();
    }
  }
  async function initialize(){
    const native=plugin();
    if(biometricLocked()){
      // Never call get() or read the legacy token at cold start. The user
      // can explicitly request unlockSavedSession() after native biometrics.
      setRuntime('');ready=true;
      return {native:!!native,restored:false,locked:true};
    }
    const legacy=String(localStorage.getItem(KEY)||'');
    let saved=await get();
    if(legacy){await set(legacy);saved=legacy;localStorage.removeItem(KEY)}
    if(saved&&!currentToken()){
      // A biometric-enabled native app must stay logged out until the user
      // explicitly completes device authentication. Never silently hydrate /me.
      if(biometricLocked()){
        setRuntime('');
      }else{
        setRuntime(saved);
        await restoreAccount();
      }
    }else if(currentToken()){
      await set(currentToken());localStorage.removeItem(KEY);setRuntime(currentToken());
    }else setRuntime('');
    ready=true;
    return {native:!!native,restored:!!saved&&!biometricLocked(),locked:!!saved&&biometricLocked()};
  }
  async function sync(){
    if(!ready||busy)return;
    // The periodic sync must not silently migrate or hydrate a legacy token
    // while Face ID is enabled and no verified runtime session exists.
    if(biometricLocked()&&!currentToken()){
      window.ZOVRO_SESSION_TOKEN='';
      return;
    }
    busy=true;
    try{
      const legacy=String(localStorage.getItem(KEY)||''),runtime=currentToken();
      if(legacy){await set(legacy);localStorage.removeItem(KEY);setRuntime(legacy);return}
      if(runtime&&runtime!==lastKnown){await set(runtime);setRuntime(runtime);return}
      if(!runtime&&lastKnown){await remove();setRuntime('');return}
      window.ZOVRO_SESSION_TOKEN=runtime;
    }catch(e){console.warn('ZOVRO secure session sync unavailable:',e?.message||e)}finally{busy=false}
  }
  window.ZOVRO_SECURE_SESSION={get,set,remove,initialize,sync,isNativeSecure:()=>!!plugin(),status:()=>({native:!!plugin(),ready,hasSession:!!currentToken()})};
  initialize().catch(e=>{console.warn('ZOVRO secure session unavailable:',e?.message||e);window.ZOVRO_SESSION_TOKEN=currentToken();ready=true});
  setInterval(sync,750);
})();
