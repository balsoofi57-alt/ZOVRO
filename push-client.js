(function(){
  'use strict';
  const APP_ID='7992b022-6c11-4a66-bad4-8cbd114266d0';
  let initialized=false,lastUserId=null,busy=false;
  const plugin=()=>window.Capacitor?.Plugins?.OneSignalCapacitor||null;
  async function ensureInitialized(){
    const p=plugin();if(!p)return null;
    if(!initialized){await p.initialize({appId:APP_ID});initialized=true}
    return p;
  }
  async function syncUser(){
    if(busy)return;busy=true;
    try{
      const p=await ensureInitialized();if(!p)return;
      const userId=typeof me!=='undefined'&&me?.id?String(me.id):null;
      if(userId&&userId!==lastUserId){
        await p.login({externalId:userId});lastUserId=userId;
        const permissionKey='zovroPushPermissionRequested';
        if(!localStorage.getItem(permissionKey)){
          try{await p.requestPermission({fallbackToSettings:false})}finally{localStorage.setItem(permissionKey,'1')}
        }
      }else if(!userId&&lastUserId){
        await p.logout();lastUserId=null;
      }
    }catch(e){console.warn('ZOVRO push sync unavailable:',e?.message||e)}finally{busy=false}
  }
  async function status(){
    const p=await ensureInitialized();if(!p)return {native:false,initialized:false};
    const permission=await p.getPermission().catch(()=>({permission:false}));
    const subscription=await p.getPushSubscriptionId().catch(()=>({id:null}));
    return {native:true,initialized,permission:!!permission.permission,subscriptionId:subscription.id||null,externalUserId:lastUserId};
  }
  window.ZOVRO_PUSH={syncUser,status};
  document.addEventListener('DOMContentLoaded',syncUser,{once:true});
  setInterval(syncUser,3000);
})();
