'use strict';
const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const sessionScript=fs.readFileSync(path.join(root,'secure-session.js'),'utf8');
const biometricScript=fs.readFileSync(path.join(root,'biometric-client.js'),'utf8');
async function secureStartup(locked){
 const store=new Map([['zovroToken','existing-session']]);
 const local=new Map([['zovroBiometricUnlock',locked?'1':'0']]);
 let apiCalls=0;
 const w={
  console,
  token:'',
  me:null,
  localStorage:{getItem:k=>local.get(k)||null,setItem:(k,v)=>local.set(k,v),removeItem:k=>local.delete(k)},
  sessionStorage:{getItem:()=>null,setItem(){},removeItem(){}},
  Capacitor:{Plugins:{SecureStoragePlugin:{
   get:async({key})=>({value:store.get(key)||''}),set:async({key,value})=>store.set(key,value),
   remove:async({key})=>store.delete(key)
  }}},
  ZOVRO_BIOMETRIC:{shouldProtect:()=>locked},
  api:async()=>{apiCalls++;return {user:{id:'account-1'}}},
  renderAccount(){},loadJobs(){},setInterval(){},
 };
 w.window=w;
 vm.runInNewContext(sessionScript,w);
 await w.ZOVRO_SECURE_SESSION.initialize();
 if(locked){
  assert.equal(w.token,'','Face ID-protected session must not silently unlock');
  assert.equal(w.ZOVRO_SESSION_TOKEN,'');
  assert.equal(apiCalls,0,'No /me call before Face ID verification');
  assert.equal(store.get('zovroToken'),'existing-session','Keep saved session for explicit unlock');
 }else{
  assert.equal(w.token,'existing-session','Non-biometric session should continue working');
  assert(apiCalls>0,'Non-biometric session restore validates the account');
 }
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
(async()=>{
 await secureStartup(true);
 await secureStartup(false);
 await biometricUnlock(null);
 await biometricUnlock(500);
 await biometricUnlock(401);
 console.log('Biometric security: locked startup, normal startup, Face ID before secret read, offline retry and expired-session cleanup passed.');
})().catch(e=>{console.error(e);process.exitCode=1});
