'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
const nodes=new Map(),pending=[],messages=[];
function node(id){if(!nodes.has(id)){const hidden=new Set();nodes.set(id,{innerHTML:'',classList:{toggle(k,on){if(on)hidden.add(k);else hidden.delete(k)},contains:k=>hidden.has(k)},insertAdjacentHTML(){}})}return nodes.get(id)}
const c=vm.createContext({$:node,me:{id:'old',role:'provider',name:'Provider'},token:'old-session',jobs:[{id:'old-job'}],activeJob:'old-job',esc:String,ZOVRO_PROVIDER_SERVICES:{servicesFor:()=>[]},ZOVRO_SERVICE_PICKER:{markup:()=>''},loadProviderStats(){},loadPayoutStatus(){},toast:m=>messages.push(m),api:()=>new Promise((resolve,reject)=>pending.push({resolve,reject}))});
vm.runInContext(html.match(/^function renderAccount\(\).*$/m)[0],c);
vm.runInContext(html.match(/async function loadJobs\(\)[\s\S]*?(?=function jobHtml)/)[0],c);
c.jobHtml=j=>j.id;
(async()=>{
 c.renderAccount();assert(!node('accountActions').classList.contains('hidden'));assert(!node('locationBtn').classList.contains('hidden'));
 const old=c.loadJobs();c.me=null;c.token='';c.renderAccount();
 assert(node('accountActions').classList.contains('hidden'));assert(node('locationBtn').classList.contains('hidden'));assert(node('availabilityBtn').classList.contains('hidden'));
 assert.match(node('profileBox').innerHTML,/onclick="openAuth\(\)"/);assert.equal(c.jobs.length,0);assert.equal(c.activeJob,null);
 pending.shift().resolve({requests:[{id:'private-old-job'}]});await old;
 assert.equal(c.jobs.length,0);assert(!node('jobList').innerHTML.includes('private-old-job'));
 c.me={id:'new',role:'customer',name:'New'};c.token='new-session';c.renderAccount();
 const stale=c.loadJobs();c.token='refreshed-session';const fresh=c.loadJobs();
 pending[1].resolve({requests:[{id:'current-job'}]});await fresh;
 pending[0].resolve({requests:[{id:'stale-job'}]});await stale;
 assert.equal(node('jobList').innerHTML,'current-job');assert.equal(c.jobs[0].id,'current-job');
 pending.length=0;const failed=c.loadJobs();c.me=null;c.token='';c.renderAccount();pending[0].reject(Error('old account failure'));await failed;assert.equal(messages.length,0);
 console.log('Account session: sign-in entry, account/provider controls, private job clearing and late response isolation passed.');
})().catch(e=>{console.error(e);process.exitCode=1});
