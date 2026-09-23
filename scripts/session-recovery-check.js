'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..');
require('node:child_process').execFileSync(process.execPath,[path.join(root,'scripts/prepare-mobile.js')],{cwd:root,stdio:'pipe'});
const secure=fs.readFileSync(path.join(root,'secure-session.js'),'utf8');
const boot=fs.readFileSync(path.join(root,'index.html'),'utf8').match(/^async function boot\(\).*$/m)[0];
const mobileBoot=fs.readFileSync(path.join(root,'www/index.html'),'utf8').match(/^async function boot\(\).*$/m)[0];
async function scenario(status,native,restored=false){
  const saved=new Map([['zovroToken','saved-token']]),messages=[];
  const storage={getItem:k=>saved.get(k)||null,setItem:(k,v)=>saved.set(k,v),removeItem:k=>saved.delete(k)};
  let failing=!restored;
  const context=vm.createContext({token:native?'':'saved-token',me:null,services:[],console,
    localStorage:native?{getItem:()=>null,removeItem(){}}:storage,sessionStorage:storage,
    setInterval(){},renderAccount(){},loadJobs(){},syncSubservices(){},
    $:()=>({style:{}}),ZOVRO_SERVICE_PICKER:{options:()=>''},toast:m=>messages.push(m),
    api:async route=>{if(route==='/health')return {ok:true};if(failing){const e=Error('Connection failed');if(status)e.status=status;throw e}return {user:{id:'restored-user'}}}
  });
  context.window=context;
  if(native){
    context.Capacitor={Plugins:{SecureStoragePlugin:{get:async({key})=>({value:saved.get(key)}),set:async({key,value})=>saved.set(key,value),remove:async({key})=>saved.delete(key)}}};
    vm.runInContext(secure,context);
    await context.ZOVRO_SECURE_SESSION.initialize();
  }
  failing=true;
  vm.runInContext(native?mobileBoot:boot,context);await context.boot();
  if(native)await context.ZOVRO_SECURE_SESSION.sync();
  if(status===401){
    assert.equal(context.token,'','Rejected credentials must be removed');assert.equal(saved.has('zovroToken'),false);
    assert.equal(context.me,null);
  }else{
    assert.equal(context.token,'saved-token','Temporary failure must preserve runtime token');
    assert.equal(saved.get('zovroToken'),'saved-token','Temporary failure must preserve saved session');
    if(!restored)assert.equal(context.me,null,'Do not invent an authenticated account while offline');
    assert.ok(messages.length,'Explain the temporary restoration failure');
    failing=false;await context.boot();assert.equal(context.me.id,'restored-user','Session must recover without another password');
  }
}
(async()=>{for(const native of [false,true])for(const status of [undefined,500,503,429,401]){await scenario(status,native);if(native)await scenario(status,native,true)}console.log('Session recovery: web and native preserve credentials on transient errors, recover, and clear rejected credentials.');})().catch(e=>{console.error(e);process.exitCode=1});
