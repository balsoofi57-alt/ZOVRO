'use strict';
const {spawn}=require('child_process');
const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..'), backend=path.join(root,'backend'), data=path.join(backend,'data');
const port=Number(process.env.ZOVRO_TEST_PORT||18919), base=`http://127.0.0.1:${port}`;
const files=['zovro.sqlite','zovro.sqlite-wal','zovro.sqlite-shm'];
const backups=[];
function sleep(ms){return new Promise(r=>setTimeout(r,ms))}
async function call(method,url,body,token){const r=await fetch(base+url,{method,headers:{'content-type':'application/json','x-zovro-terms-version':'2026-09-27','x-zovro-privacy-version':'2026-09-22','x-zovro-lawful-use-attestation':'accepted-v1','x-zovro-request-consent':'service-request-v1',...(token?{authorization:`Bearer ${token}`}:{})},body:body?JSON.stringify(body):undefined});let j={};try{j=await r.json()}catch{};if(!r.ok)throw new Error(`${method} ${url} -> ${r.status} ${JSON.stringify(j)}`);return j}
function backup(){fs.mkdirSync(data,{recursive:true});for(const f of files){const p=path.join(data,f);if(fs.existsSync(p)){const b=p+'.final-test-backup';fs.copyFileSync(p,b);backups.push([p,b]);fs.rmSync(p,{force:true})}}}
function restore(){for(const f of files)fs.rmSync(path.join(data,f),{force:true});for(const [p,b] of backups){fs.copyFileSync(b,p);fs.rmSync(b,{force:true})}}
(async()=>{backup();const child=spawn(process.execPath,['server.js'],{cwd:backend,env:{...process.env,PORT:String(port),ZOVRO_SECRET:'final-e2e-secret-not-production',ZOVRO_APP_VERSION:'1.0.0'},stdio:['ignore','pipe','pipe']});
try{let ready=false;for(let i=0;i<40;i++){try{const h=await call('GET','/api/health');if(h.ok&&h.stage==='FINAL'&&h.version==='1.0.0'){ready=true;break}}catch{}await sleep(100)}if(!ready)throw new Error('Final backend did not become ready with expected version/stage');
// Exercise static protection through the complete middleware chain.
for(const file of ['/backend/server-core.js','/backend/package.json','/package.json','/.git/config','/backend/data/db.json','/%62ackend/server-core.js']){
 const response=await fetch(base+file,{method:'HEAD'});
 if(response.status!==404)throw new Error(`Private static path exposed: ${file} (${response.status})`);
}
for(const file of ['/index.html','/website-final.css','/assets/zovro-icon.svg']){
 const response=await fetch(base+file);if(response.status!==200)throw new Error(`Public asset blocked: ${file}`);await response.arrayBuffer();
}
const suffix=Date.now(),S=String(suffix).slice(-6),reg=(name,ph,role,service)=>call('POST','/api/auth/register',{name,phone:ph,password:'StrongPass22!',role,service,termsAccepted:true,privacyAccepted:true,termsVersion:'2026-09-27',privacyVersion:'2026-09-22'});
const c=await reg('Dir Customer','1313'+S+'1','customer');
const p1=await reg('Sam Plumber','2484'+S+'1','provider','Plumbing');
const p2=await reg('Ali Plumber','2484'+S+'2','provider','Plumbing');
const p3=await reg('Tow Guy','2484'+S+'3','provider','Roadside Assistance');
const p4=await reg('Far Plumber','2484'+S+'4','provider','Plumbing');
const dir=await call('GET','/api/providers/directory?service=Plumbing',null,c.token);
const ids=dir.providers.map(x=>x.id);
if(!ids.includes(p1.user.id)||!ids.includes(p2.user.id)||ids.includes(p3.user.id))throw new Error('directory filter wrong '+JSON.stringify(ids));
if(JSON.stringify(dir).includes('phone'))throw new Error('directory leaks phone');
const prof=await call('GET','/api/providers/'+p1.user.id+'/profile',null,c.token);if(!prof.summary)throw new Error('no summary '+JSON.stringify(prof).slice(0,400));
const made=await call('POST','/api/requests',{service:'Plumbing',details:'Kitchen sink leaking',address:'1 Main St',preferredProviderId:p1.user.id},c.token);
const id=made.request.id;if(made.request.status!=='Waiting for provider reply'||!made.dispatch.direct)throw new Error('not direct');
const l2=await call('GET','/api/requests',null,p2.token);if(l2.requests.some(r=>r.id===id))throw new Error('other provider sees direct request');
const l1=await call('GET','/api/requests',null,p1.token);const seen=l1.requests.find(r=>r.id===id);if(!seen||!seen.directRequest)throw new Error('chosen provider missing direct request');
let blocked=false;try{await call('POST','/api/requests/'+id+'/accept',{},p2.token)}catch{blocked=true}if(!blocked)throw new Error('other provider accepted');
await call('POST','/api/requests/'+id+'/decline-direct',{reason:'Booked today'},p1.token);
let cr=(await call('GET','/api/requests',null,c.token)).requests.find(r=>r.id===id);if(cr.status!=='Provider declined')throw new Error('decline status '+cr.status);
const afterDecline=(await call('GET','/api/requests',null,p2.token)).requests;
if(afterDecline.some(r=>r.id===id))throw new Error('Declined direct request exposed to other providers');
for(const [label,token] of [['declining provider',p1.token],['unselected provider',p2.token]]){
  let accepted=false;try{await call('POST','/api/requests/'+id+'/accept',{},token);accepted=true}catch{}
  if(accepted)throw new Error(label+' accepted a declined direct request');
}
const afterBlocked=(await call('GET','/api/requests',null,c.token)).requests.find(r=>r.id===id);
if(afterBlocked.status!=='Provider declined')throw new Error('Declined request changed after unauthorized acceptance');

await call('POST','/api/requests/'+id+'/choose-provider',{providerId:p2.user.id},c.token);
await call('POST','/api/requests/'+id+'/accept',{},p2.token);
await call('POST','/api/requests/'+id+'/messages',{text:'On my way soon'},p2.token);
cr=(await call('GET','/api/requests',null,c.token)).requests.find(r=>r.id===id);if(cr.providerId!==p2.user.id||cr.status!=='Accepted')throw new Error('accept failed');
// Direct-decline fallback must notify only nearby matching pros when a
// customer explicitly included GPS. A far-away pro must get no alert.
await call('POST','/api/provider/location',{lat:42.3314,lng:-83.0458},p2.token);
await call('POST','/api/provider/location',{lat:40.7128,lng:-74.0060},p4.token);
const geoMade=await call('POST','/api/requests',{service:'Plumbing',details:'Dripping shower pipe',address:'Detroit, MI',location:{lat:42.3314,lng:-83.0458},preferredProviderId:p1.user.id},c.token);
const geoId=geoMade.request.id;
await call('POST','/api/requests/'+geoId+'/decline-direct',{reason:'Unavailable'},p1.token);
const broadcast=await call('POST','/api/requests/'+geoId+'/choose-provider',{open:true},c.token);
if(broadcast.notifiedProviders!==1)throw new Error('Nearby fallback notified '+broadcast.notifiedProviders+' providers, expected 1');
const nearNotices=(await call('GET','/api/notifications',null,p2.token)).notifications;
const farNotices=(await call('GET','/api/notifications',null,p4.token)).notifications;
if(!nearNotices.some(n=>n.meta?.requestId===geoId&&n.meta?.type==='new_request'))throw new Error('Nearby provider did not receive request');
if(farNotices.some(n=>n.meta?.requestId===geoId))throw new Error('Far-away provider was notified');

// existing broadcast flow still works
const open=await call('POST','/api/requests',{service:'Plumbing',details:'Toilet running constantly',address:'2 Main St'},c.token);
if(open.request.status!=='Looking for providers')throw new Error('broadcast flow changed');
const o1=await call('GET','/api/requests',null,p1.token);if(!o1.requests.some(r=>r.id===open.request.id))throw new Error('broadcast not visible');
console.log('Provider directory, direct request, decline, re-choose and broadcast checks: PASS');
}finally{child.kill();await sleep(200);restore()}})().catch(e=>{console.error(e);process.exit(1)});
