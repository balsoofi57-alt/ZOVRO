'use strict';
const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const sessionScript=fs.readFileSync(path.join(root,'secure-session.js'),'utf8');
const biometricScript=fs.readFileSync(path.join(root,'biometric-client.js'),'utf8');
async function secureStartup(locked){
 const store=new Map([['zovroToken','existing-session']]);
 const local=new Map([['zovroBiometricUnlock',locked?'1':'0'],...(locked?[['zovroToken','legacy-unprotected-session']]:[])]);
 let apiCalls=0,secureReads=0,legacyReads=0,syncNow=null;
 const w={
  console,
  token:'',
  me:null,
  localStorage:{getItem:k=>{if(k==='zovroToken')legacyReads++;return local.get(k)||null},setItem:(k,v)=>local.set(k,v),removeItem:k=>local.delete(k)},
  sessionStorage:{getItem:()=>null,setItem(){},removeItem(){}},
  Capacitor:{Plugins:{SecureStoragePlugin:{
   get:async({key})=>{secureReads++;return {value:store.get(key)||''}},set:async({key,value})=>store.set(key,value),
   remove:async({key})=>store.delete(key)
  }}},
  ZOVRO_BIOMETRIC:{shouldProtect:()=>locked},
  api:async()=>{apiCalls++;return {user:{id:'account-1'}}},
  renderAccount(){},loadJobs(){},setInterval(fn){syncNow=fn;},
 };
 w.window=w;
 vm.runInNewContext(sessionScript,w);
 await w.ZOVRO_SECURE_SESSION.initialize();
 if(locked){
  assert.equal(w.token,'','Face ID-protected session must not silently unlock');
  assert.equal(w.ZOVRO_SESSION_TOKEN,'');
  assert.equal(apiCalls,0,'No /me call before Face ID verification');
  assert.equal(store.get('zovroToken'),'existing-session','Keep saved session for explicit unlock');
  assert.equal(secureReads,0,'Do not fetch native secure bearer before biometrics');
  assert.equal(legacyReads,0,'Do not read unprotected legacy bearer before biometrics');
  assert(syncNow,'Session interval must be installed');
  await syncNow();
  assert.equal(secureReads,0,'Periodic sync must not retrieve saved session before Face ID');
  assert.equal(legacyReads,0,'Periodic sync must not hydrate legacy login before Face ID');
  assert.equal(w.token,'','Periodic sync cannot silently unlock a protected account');
 }else{
  assert.equal(w.token,'existing-session','Non-biometric session should continue working');
  assert(apiCalls>0,'Non-biometric session restore validates the account');
 }
}
async function restoreAfterApiFailure(status){
 // A temporary API fault must not erase a login, whereas an explicit
 // unauthorized response must revoke the locally stored session.
 const store=new Map([['zovroToken','persisted-session']]);
 let apiCalls=0;
 const w={
  console,token:'',me:null,
  localStorage:{getItem:()=>null,setItem(){},removeItem(){}},
  sessionStorage:{getItem:()=>null,setItem(){},removeItem(){}},
  Capacitor:{Plugins:{SecureStoragePlugin:{
   get:async({key})=>({value:store.get(key)||''}),
   set:async({key,value})=>{store.set(key,value)},
   remove:async({key})=>{store.delete(key)}
  }}},
  ZOVRO_BIOMETRIC:{shouldProtect:()=>false},
  api:status==='missing-api'?undefined:async()=>{
   apiCalls++;
   if(status==='invalid-shape')return {user:null};
   throw Object.assign(new Error('Simulated response'),status==null?{}:{status});
  },
  renderAccount(){},loadJobs(){},setInterval(){}
 };
 w.window=w;
 vm.runInNewContext(sessionScript,w);
 const result=await w.ZOVRO_SECURE_SESSION.initialize();
 assert.equal(apiCalls,status==='missing-api'?0:1,'Do not claim to validate when the API is absent');
 assert.equal(w.token,'','Failed validation cannot expose the bearer');
 assert.equal(w.ZOVRO_SESSION_TOKEN,'','Failed validation cannot unlock the account');
 assert.equal(result.restored,false,'An unverified account cannot be reported as restored');
 assert.equal(store.has('zovroToken'),![401,403].includes(status),'Only invalid sessions are deleted');
}
async function biometricUnlock(status){
 let prompted=false,reads=0,removes=0;
 const w={
  console,token:'',me:null,
  localStorage:{getItem:k=>k==='zovroBiometricUnlock'?'1':null},
  Capacitor:{Plugins:{NativeBiometric:{
   isAvailable:async()=>({isAvailable:true}),
   verifyIdentity:async()=>{prompted=true}
  }}},
  ZOVRO_SECURE_SESSION:{
   isNativeSecure:()=>true,
   get:async()=>{assert(prompted,'Saved token must only be retrieved after Face ID');reads++;return 'saved-token'},
   remove:async()=>{removes++}
  },
  api:async()=>{if(status)throw Object.assign(Error('request failed'),{status});return {user:{id:'account-1'}}},
  document:{readyState:'loading',addEventListener(){},documentElement:{},getElementById:()=>null},
  MutationObserver:class{observe(){}},
  renderAccount(){},loadJobs(){},closeModal(){},resumeRequestIntent(){},toast(){},
 };
 w.window=w;
 vm.runInNewContext(biometricScript,w);
 const succeeded=await w.ZOVRO_BIOMETRIC.unlockSavedSession();
 assert.equal(reads,1,'Only one secure session retrieval per Face ID unlock');
 assert.equal(succeeded,!status);
 if(status){
  assert.equal(w.token,'','Failure cannot leave the account unlocked');
  assert.equal(removes,status===401?1:0,'Transient network error must not remove saved login');
 }else{
  assert.equal(w.token,'saved-token');
  assert.equal(w.me.id,'account-1');
  assert.equal(removes,0);
 }
}

async function biometricPreflight(mode){
 let authCalls=0,reads=0;
 const w={
  console,token:'',me:null,
  localStorage:{getItem:k=>k==='zovroBiometricUnlock'?'1':null},
  Capacitor:{Plugins:{NativeBiometric:{
   isAvailable:async()=>({isAvailable:true}),
   verifyIdentity:async()=>{authCalls++}
  }}},
  ZOVRO_SECURE_SESSION:{
   isNativeSecure:()=>mode!=='missing-store',
   get:async()=>{reads++;return 'saved-token'}
  },
  api:mode==='missing-api'?undefined:async()=>({user:{id:'account-1'}}),
  document:{readyState:'loading',addEventListener(){},documentElement:{},getElementById:()=>null},
  MutationObserver:class{observe(){}},
  renderAccount(){},loadJobs(){},toast(){}
 };
 w.window=w;
 vm.runInNewContext(biometricScript,w);
 const result=await w.ZOVRO_BIOMETRIC.unlockSavedSession();
 assert.equal(result,false,'Face ID cannot unlock without trusted storage and a server validator');
 assert.equal(authCalls,0,'Do not prompt when the required services are missing');
 assert.equal(reads,0,'Do not retrieve bearer before the preflight checks succeed');
 assert.equal(w.token,'','Never expose a session token on preflight failure');
}
async function enableRequiresNativeStorage(mode){
 let authCalls=0,writes=0;
 const local=new Map();
 const w={
  console,token:'signed-in-session',me:{id:'account-1'},
  localStorage:{getItem:k=>local.get(k)||null,setItem:(k,v)=>local.set(k,v),removeItem:k=>local.delete(k)},
  Capacitor:{Plugins:{NativeBiometric:{
   isAvailable:async()=>({isAvailable:true}),
   verifyIdentity:async()=>{authCalls++}
  }}},
  ZOVRO_SECURE_SESSION:mode==='missing-writer'
   ?{isNativeSecure:()=>true}
   :{
    isNativeSecure:()=>mode==='write-fails',
    set:async()=>{writes++;throw new Error('Native secure storage unavailable')}
   },
  document:{readyState:'loading',addEventListener(){},documentElement:{},getElementById:()=>null},
  MutationObserver:class{observe(){}},
 };
 w.window=w;
 vm.runInNewContext(biometricScript,w);
 const enabled=await w.ZOVRO_BIOMETRIC.enable();
 assert.equal(enabled,false,'Failed secure storage must never activate Face ID');
 assert.equal(local.has('zovroBiometricUnlock'),false,'Never persist an unusable Face ID preference');
 assert.equal(authCalls,mode==='write-fails'?1:0,'Do not prompt when native storage is absent');
 assert.equal(writes,mode==='write-fails'?1:0,'Never write through an absent secure store');
}
(async()=>{
 await secureStartup(true);
 await secureStartup(false);
 for(const failure of [null,500,401,403,'invalid-shape','missing-api'])await restoreAfterApiFailure(failure);
 await enableRequiresNativeStorage('missing');
 await enableRequiresNativeStorage('missing-writer');
 await enableRequiresNativeStorage('write-fails');
 await biometricUnlock(null);
 await biometricUnlock(500);
 await biometricUnlock(401);
 await biometricPreflight('missing-api');
 await biometricPreflight('missing-store');
 console.log('Biometric security: locked startup, normal startup, Face ID before secret read, offline retry and expired-session cleanup passed.');
})().catch(e=>{console.error(e);process.exitCode=1});
