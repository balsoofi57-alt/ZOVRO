'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const source=fs.readFileSync(path.join(root,'secure-session.js'),'utf8');
const flush=()=>new Promise(resolve=>setImmediate(resolve));

function store(values={}){
  const data=new Map(Object.entries(values));
  return {
    getItem:k=>data.has(k)?data.get(k):null,
    setItem:(k,v)=>data.set(k,String(v)),
    removeItem:k=>data.delete(k)
  };
}
async function environment({biometrics=true,token='saved-token',secure=true,verified=true,apiOk=true}={}){
  const prefs=store(biometrics?{zovroBiometricUnlock:'1'}:{});
  const memory=store();
  const secrets=new Map(token?[['zovroToken',token]]:[]);
  const storage={
    get:async ({key})=>({value:secrets.get(key)||''}),
    set:async ({key,value})=>{secrets.set(key,value)},
    remove:async ({key})=>{secrets.delete(key)}
  };
  let apiCalls=0,authCalls=0,renderCalls=0;
  const context={
    window:{
      Capacitor:{Plugins:secure?{SecureStoragePlugin:storage}:{}},
      ZOVRO_BIOMETRIC:{
        check:async()=>({native:true,available:true}),
        authenticate:async()=>{authCalls++;return verified}
      }
    },
    localStorage:prefs,
    sessionStorage:memory,
    token:'',
    me:null,
    api:async (route)=>{
      apiCalls++;
      assert.equal(route,'/me');
      if(!apiOk)throw new Error('Session expired');
      return {user:{id:'user-1'}};
    },
    renderAccount:()=>{renderCalls++},
    loadJobs:()=>{},
    setInterval:()=>0,
    console
  };
  vm.runInNewContext(source,context,{filename:'secure-session.js'});
  for(let i=0;i<10&&!context.window.ZOVRO_SECURE_SESSION.status().ready;i++)await flush();
  assert.equal(context.window.ZOVRO_SECURE_SESSION.status().ready,true);
  return {context,secrets,get apiCalls(){return apiCalls},get authCalls(){return authCalls},get renderCalls(){return renderCalls}};
}

test('saved biometric session remains locked without automatic server requests',async()=>{
  const e=await environment();
  assert.equal(e.context.token,'');
  assert.equal(e.context.window.ZOVRO_SESSION_TOKEN,'');
  assert.equal(e.apiCalls,0);
  assert.equal(e.context.window.ZOVRO_SECURE_SESSION.status().locked,true);
  assert.equal(await e.context.window.ZOVRO_SECURE_SESSION.hasSavedSession(),true);
  assert.equal('get' in e.context.window.ZOVRO_SECURE_SESSION,false);
  await e.context.window.ZOVRO_SECURE_SESSION.sync();
  assert.equal(e.apiCalls,0);
  assert.equal(e.context.token,'');
});

test('cancelled Face ID never restores saved session',async()=>{
  const e=await environment({verified:false});
  const outcome=await e.context.window.ZOVRO_SECURE_SESSION.unlockWithBiometrics();
  assert.equal(outcome.ok,false);
  assert.equal(outcome.reason,'verification-failed');
  assert.equal(e.authCalls,1);
  assert.equal(e.apiCalls,0);
  assert.equal(e.context.token,'');
  assert.equal(e.context.window.ZOVRO_SECURE_SESSION.status().locked,true);
});

test('verified Face ID restores account only after the native prompt succeeds',async()=>{
  const e=await environment();
  const outcome=await e.context.window.ZOVRO_SECURE_SESSION.unlockWithBiometrics();
  assert.equal(outcome.ok,true);
  assert.equal(e.authCalls,1);
  assert.equal(e.apiCalls,1);
  assert.equal(e.context.token,'saved-token');
  assert.equal(e.context.window.ZOVRO_SECURE_SESSION.status().locked,false);
});

test('missing native secure storage fails closed',async()=>{
  const e=await environment({secure:false});
  const outcome=await e.context.window.ZOVRO_SECURE_SESSION.unlockWithBiometrics();
  assert.equal(outcome.ok,false);
  assert.equal(e.context.token,'');
  assert.equal(e.apiCalls,0);
});

test('expired token is deleted after biometric verification',async()=>{
  const e=await environment({apiOk:false});
  const outcome=await e.context.window.ZOVRO_SECURE_SESSION.unlockWithBiometrics();
  assert.equal(outcome.ok,false);
  assert.equal(outcome.reason,'session-expired');
  assert.equal(e.context.token,'');
  assert.equal(e.secrets.has('zovroToken'),false);
});

test('accounts without biometric opt-in retain compatible session restoration',async()=>{
  const e=await environment({biometrics:false});
  assert.equal(e.context.token,'saved-token');
  assert.equal(e.apiCalls,1);
  assert.equal(e.context.window.ZOVRO_SECURE_SESSION.status().locked,false);
});

test('new password login can establish session even while an older token stays locked',async()=>{
  const e=await environment();
  e.context.token='newly-authenticated-token';
  await e.context.window.ZOVRO_SECURE_SESSION.sync();
  assert.equal(e.context.window.ZOVRO_SECURE_SESSION.status().locked,false);
  assert.equal(e.secrets.get('zovroToken'),'newly-authenticated-token');
});

test('native packaging includes compatible biometric plugin and iOS Face ID explanation',()=>{
  const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
  assert.equal(pkg.dependencies['@aparajita/capacitor-biometric-auth'],'9.1.2');
  const patch=fs.readFileSync(path.join(root,'scripts/patch-native.js'),'utf8');
  assert.ok(patch.includes('NSFaceIDUsageDescription'));
  const client=fs.readFileSync(path.join(root,'biometric-client.js'),'utf8');
  assert.ok(client.includes('unlockWithBiometrics'));
  assert.ok(!client.includes('ZOVRO_SECURE_SESSION?.get'));
});
