(function(){
  'use strict';
  const APP_ID=String(window.ZOVRO_CONFIG?.oneSignalAppId||'7992b022-6c11-4a66-bad4-8cbd114266d0');
  let initialized=false,lastUserId=null,busy=false,listenersReady=false;
  const plugin=()=>window.Capacitor?.Plugins?.OneSignalCapacitor||null;
  const unwrapPermission=x=>typeof x==='boolean'?x:!!x?.permission;
  const unwrapId=x=>typeof x==='string'?x:(x?.id||null);

  function notificationData(event){
    return event?.notification?.additionalData||event?.notification?.data||event?.additionalData||event?.data||{};
  }
  function routeNotification(event){
    const data=notificationData(event),requestId=String(data.requestId||data.request_id||'');
    if(requestId){
      try{if(typeof activeJob!=='undefined')activeJob=requestId}catch{}
      try{if(typeof nav==='function')nav('jobs',document.querySelectorAll('.bottom button')[1]||null)}catch{}
      try{if(typeof loadJobs==='function')loadJobs()}catch{}
    }
  }
  async function attachListeners(p){
    if(listenersReady||!p?.addListener)return;
    listenersReady=true;
    try{await p.addListener('notificationClick',routeNotification)}catch(e){console.warn('ZOVRO push click listener unavailable:',e?.message||e)}
    try{await p.addListener('permissionChange',()=>status().catch(()=>{}))}catch{}
    try{await p.addListener('pushSubscriptionChange',()=>status().catch(()=>{}))}catch{}
  }
  async function ensureInitialized(){
    const p=plugin();if(!p)return null;
    if(!initialized){await p.initialize({appId:APP_ID});initialized=true;await attachListeners(p)}
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
    const p=await ensureInitialized();if(!p)return {native:false,initialized:false,permission:false,subscriptionId:null,externalUserId:lastUserId};
    const permission=await p.getPermission().catch(()=>({permission:false}));
    const subscription=await p.getPushSubscriptionId().catch(()=>({id:null}));
    const token=await p.getPushSubscriptionToken?.().catch(()=>({token:null}));
    const optedIn=await p.getPushSubscriptionOptedIn?.().catch(()=>({optedIn:false}));
    return {native:true,initialized,permission:unwrapPermission(permission),subscriptionId:unwrapId(subscription),token:token?.token||null,optedIn:!!optedIn?.optedIn,externalUserId:lastUserId};
  }
  async function requestPermission(){
    const p=await ensureInitialized();if(!p)return false;
    const result=await p.requestPermission({fallbackToSettings:true});
    return unwrapPermission(result);
  }
  window.ZOVRO_PUSH={syncUser,status,requestPermission,routeNotification};
  document.addEventListener('DOMContentLoaded',syncUser,{once:true});
  setInterval(syncUser,3000);
})();
