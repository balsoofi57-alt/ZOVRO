"use strict";
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(require('node:path').join(__dirname,'../admin-requests-client.js'),'utf8');
function harness(){
 const nodes=new Map(),storage=new Map([['zovroToken','old-token']]),pending=[],events={};
 function node(id){if(!nodes.has(id))nodes.set(id,{hidden:false,disabled:false,value:'',type:'password',textContent:'',children:[],replaceChildren(){this.children=[]},append(...items){this.children.push(...items)},querySelector(){return node(id+'Button')},setAttribute(){},scrollIntoView(){},focus(){}});return nodes.get(id)}
 const c=vm.createContext({console,Date,AbortSignal,localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},window:{addEventListener:(k,f)=>events[k]=f},document:{getElementById:node,addEventListener(){},createElement:()=>node(Symbol())},fetch:(url,options)=>new Promise(resolve=>pending.push({url,options,reply(status,data){resolve({ok:status<400,status,json:async()=>data})}}))});
 vm.runInContext(source,c);return {node,storage,pending,events};
}
const tick=()=>new Promise(resolve=>setImmediate(resolve));
(async()=>{
 // A previous account's outstanding request must not block a fresh sign-in.
 let h=harness();assert.equal(h.pending.length,1);
 h.storage.set('zovroToken','changed-token');h.events.storage({key:'zovroToken'});
 h.node('adminPhone').value='+13135550100';h.node('adminPassword').value='example-password';
 const login=h.node('adminLogin').onsubmit({preventDefault(){}});
 h.pending[1].reply(200,{token:'new-token'});await tick();
 assert.equal(h.pending.length,3,'Successful login must start loading the new administrator session immediately');
 h.pending[2].reply(200,{requests:[],nextOffset:null});await login;
 assert.equal(h.node('adminLogin').hidden,true);
 const status=h.node('adminStatus').textContent;
 h.pending[0].reply(403,{error:'Old account denied'});await tick();
 assert.equal(h.node('adminLogin').hidden,true,'Late denial from old account must not clear new access');
 assert.equal(h.node('adminStatus').textContent,status);
 // A late sign-in failure must not replace account-change feedback.
 h=harness();h.pending[0].reply(401,{error:'Expired'});await tick();
 const failedLogin=h.node('adminLogin').onsubmit({preventDefault(){}});
 h.storage.set('zovroToken','another-token');h.events.storage({key:'zovroToken'});
 const changed=h.node('adminStatus').textContent;
 h.pending[1].reply(401,{error:'Invalid credentials'});await failedLogin;
 assert.equal(h.node('adminStatus').textContent,changed);
 console.log('Admin session races: new login loads immediately; late old-account access and login failures cannot overwrite current state.');
})().catch(e=>{console.error(e);process.exitCode=1});
