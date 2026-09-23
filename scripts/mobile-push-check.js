'use strict';
const fs=require('fs'),path=require('path');
const file=path.join(__dirname,'..','push-client.js');
const s=fs.readFileSync(file,'utf8');
const required=[
  "OneSignalCapacitor",
  "initialize({appId:APP_ID})",
  "login({externalId:userId})",
  "requestPermission({fallbackToSettings:false})",
  "addListener('notificationClick'",
  "addListener('permissionChange'",
  "addListener('pushSubscriptionChange'",
  "getPushSubscriptionId()",
  "getPushSubscriptionToken",
  "getPushSubscriptionOptedIn",
  "requestInitialPermission",
  "routeNotification",
  "window.ZOVRO_PUSH"
];
for(const token of required)if(!s.includes(token))throw new Error('Missing mobile push guard: '+token);
if(!s.includes("data.requestId||data.request_id"))throw new Error('Notification request routing is missing');
if(!s.includes("nav('jobs'"))throw new Error('Notification tap does not route to jobs');
if(/ONESIGNAL_REST_API_KEY|authorization:\s*[`'"]Key/.test(s))throw new Error('Server push secret must never be present in mobile client');

const initialPermission=s.match(/async function requestInitialPermission\([\s\S]*?\n  }/);
if(!initialPermission)throw new Error('Initial permission helper is missing');
const flow=initialPermission[0];
const requestAt=flow.indexOf("await p.requestPermission({fallbackToSettings:false})");
const markerAt=flow.indexOf("localStorage.setItem(permissionKey,'1')");
if(requestAt<0||markerAt<0||markerAt<requestAt)throw new Error('Permission completion marker must be written only after the request resolves');
if(/finally\s*\{[^}]*localStorage\.setItem/.test(flow))throw new Error('A failed permission request must not be marked complete');

console.log('ZOVRO mobile OneSignal registration and tap-routing check passed.');

// Exercise SDK identity persisted across a fresh JavaScript session.
const assert=require('node:assert/strict'),vm=require('node:vm');
function session(user=null){
  const calls=[],storage=new Map();
  let identity='previous-account',failLogout=false;
  const sdk={
    async initialize(){calls.push('initialize')},async addListener(){},
    async login({externalId}){calls.push('login:'+externalId);identity=externalId},
    async logout(){calls.push('logout');if(failLogout)throw Error('offline');identity=null},
    async requestPermission(){calls.push('permission');return true},
    async getPermission(){return false},async getPushSubscriptionId(){return null}
  };
  const context=vm.createContext({me:user,window:{Capacitor:{Plugins:{OneSignalCapacitor:sdk}}},
    document:{addEventListener(){}},setInterval(){},console:{warn(){}},
    localStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)}});
  vm.runInContext(s,context);
  return {calls,context,push:context.window.ZOVRO_PUSH,identity:()=>identity,
    failLogout:value=>{failLogout=value}};
}
(async()=>{
  const signedOut=session();
  await signedOut.push.syncUser();
  assert.equal(signedOut.identity(),null,'Signed-out startup must clear persisted SDK identity');
  await signedOut.push.syncUser();
  assert.equal(signedOut.calls.filter(x=>x==='logout').length,1,'Do not repeat successful logout');
  assert.equal(signedOut.calls.includes('permission'),false,'Do not request permission while signed out');
  assert.equal((await signedOut.push.status()).externalUserId,null);

  const signedIn=session({id:42});
  await signedIn.push.syncUser();await signedIn.push.syncUser();
  assert.equal(signedIn.identity(),'42');
  assert.equal(signedIn.calls.filter(x=>x==='login:42').length,1);
  signedIn.context.me={id:43};await signedIn.push.syncUser();
  assert.equal(signedIn.identity(),'43','Account switching must update identity');
  signedIn.context.me=null;await signedIn.push.syncUser();
  assert.equal(signedIn.identity(),null,'Sign-out must clear identity');

  const retry=session();retry.failLogout(true);
  await retry.push.syncUser();assert.equal(retry.identity(),'previous-account');
  retry.failLogout(false);await retry.push.syncUser();
  assert.equal(retry.identity(),null,'Failed startup logout must be retried');
  assert.equal(retry.calls.filter(x=>x==='logout').length,2);
  console.log('ZOVRO push persisted-identity reconciliation checks passed.');
})().catch(error=>{console.error(error);process.exitCode=1});
