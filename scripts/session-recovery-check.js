'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const boot=fs.readFileSync(path.join(root,'index.html'),'utf8').match(/^async function boot\(\).*$/m)[0];

async function scenario(status){
  const saved=new Map([['zovroToken','saved-token']]),messages=[];
  const storage={getItem:k=>saved.get(k)||null,setItem:(k,v)=>saved.set(k,v),removeItem:k=>saved.delete(k)};
  let failing=true;
  const context=vm.createContext({token:'saved-token',me:null,services:[],console,
    localStorage:storage,
    setInterval(){},renderAccount(){},loadJobs(){},syncSubservices(){},
    $:()=>({style:{}}),ZOVRO_SERVICE_PICKER:{options:()=>''},toast:m=>messages.push(m),
    api:async route=>{if(route==='/health')return {ok:true};if(failing){const e=Error('Connection failed');if(status)e.status=status;throw e}return {user:{id:'restored-user'}}}
  });
  context.window=context;
  failing=true;
  vm.runInContext(boot,context);await context.boot();
  if(status===401){
    assert.equal(context.token,'','Rejected credentials must be removed');assert.equal(saved.has('zovroToken'),false);
    assert.equal(context.me,null);
  }else{
    assert.equal(context.token,'saved-token','Temporary failure must preserve runtime token');
    assert.equal(saved.get('zovroToken'),'saved-token','Temporary failure must preserve saved session');
    assert.equal(context.me,null,'Do not invent an authenticated account while offline');
    assert.ok(messages.length,'Explain the temporary restoration failure');
    failing=false;await context.boot();assert.equal(context.me.id,'restored-user','Session must recover without another password');
  }
}
(async()=>{for(const status of [undefined,500,503,429,401])await scenario(status);console.log('Session recovery: web preserves credentials on transient errors, recover, and clear rejected credentials.');})().catch(e=>{console.error(e);process.exitCode=1});
