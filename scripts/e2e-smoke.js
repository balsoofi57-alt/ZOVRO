'use strict';
const assert=require('node:assert/strict');
const {spawn}=require('child_process');
const fs=require('fs'),os=require('os'),path=require('path');
const root=path.resolve(__dirname,'..'), backend=path.join(root,'backend'), data=fs.mkdtempSync(path.join(os.tmpdir(),'zovro-e2e-'));
const port=Number(process.env.ZOVRO_TEST_PORT||18919), base=`http://127.0.0.1:${port}`;
const TERMS='2026-09-09',PRIVACY='2026-09-09',REQUEST='service-request-v1';
function sleep(ms){return new Promise(r=>setTimeout(r,ms))}
function consentHeaders(method,url,body){const h={};if(method==='POST'&&url==='/api/auth/register'){h['x-zovro-terms-version']=TERMS;h['x-zovro-privacy-version']=PRIVACY}if(method==='POST'&&url==='/api/requests'){h['x-zovro-terms-version']=TERMS;h['x-zovro-privacy-version']=PRIVACY;if(body?.source==='sos')h['x-zovro-request-kind']='sos';else h['x-zovro-request-consent']=REQUEST}return h}
async function call(method,url,body,token){const r=await fetch(base+url,{method,headers:{'content-type':'application/json',...(token?{authorization:`Bearer ${token}`}:{}) ,...consentHeaders(method,url,body)},body:body?JSON.stringify(body):undefined});let j={};try{j=await r.json()}catch{};if(!r.ok)throw new Error(`${method} ${url} -> ${r.status} ${JSON.stringify(j)}`);return j}
(async()=>{const child=spawn(process.execPath,['server.js'],{cwd:backend,env:{...process.env,NODE_ENV:'production',PORT:String(port),ZOVRO_DATA_DIR:data,ZOVRO_SECRET:'final-e2e-secret-not-production-1234567890',ZOVRO_OPS_TOKEN:'final-e2e-ops-token-1234567890',ZOVRO_ALLOWED_ORIGINS:'https://localhost',ZOVRO_DB_MIRROR_MODE:'off',ZOVRO_APP_VERSION:'1.0.0'},stdio:['ignore','pipe','pipe']});
try{let ready=false;for(let i=0;i<40;i++){try{const h=await call('GET','/api/health');if(h.ok&&h.stage==='FINAL'&&h.version==='1.0.0'){ready=true;break}}catch{}await sleep(100)}if(!ready)throw new Error('Final backend did not become ready with expected version/stage');
const malformed=await fetch(base+'/api/auth/login',{method:'POST',headers:{'content-type':'application/json'},body:'{bad'});if(malformed.status!==400)throw new Error(`Malformed JSON returned ${malformed.status}, expected 400`);
const oversized=await fetch(base+'/api/auth/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({value:'x'.repeat(1000001)})});if(oversized.status!==413)throw new Error(`Oversized JSON returned ${oversized.status}, expected 413`);
const suffix=Date.now();
const missingConsent=await fetch(base+'/api/auth/register',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({name:'Blocked User',phone:`7345${String(suffix).slice(-7)}`,password:'StrongPass22!',role:'customer'})});if(missingConsent.status!==428)throw new Error(`Registration without consent returned ${missingConsent.status}, expected 428`);
const c=await call('POST','/api/auth/register',{name:'ZOVRO Customer',phone:`1313${String(suffix).slice(-7)}`,password:'StrongPass22!',role:'customer'});
const p=await call('POST','/api/auth/register',{name:'ZOVRO Provider',phone:`2484${String(suffix).slice(-7)}`,password:'StrongPass22!',role:'provider',service:'Roadside Assistance'});
const p2=await call('POST','/api/auth/register',{name:'ZOVRO Replacement Provider',phone:`5864${String(suffix).slice(-7)}`,password:'StrongPass22!',role:'provider',service:'Roadside Assistance'});
await call('PATCH','/api/provider/availability',{available:true},p.token);
await call('PATCH','/api/provider/availability',{available:true},p2.token);
await call('POST','/api/provider/location',{lat:42.3223,lng:-83.1763,accuracy:10},p.token);
await call('POST','/api/provider/location',{lat:42.323,lng:-83.175,accuracy:10},p2.token);
const nearby=await call('GET','/api/providers/nearby?lat=42.315&lng=-83.19&service=Roadside%20Assistance',null,c.token);if(!nearby.providers.length)throw new Error('Nearby provider matching failed');
for(const row of nearby.providers){
assert.equal(row.provider.stats.completedJobs,0,'Nearby profiles must include public professional history');
assert.equal(row.provider.stats.rating,null,'New providers must not receive a fabricated rating');
for(const field of ['phone','email','license','passwordHash'])assert.equal(row.provider[field],undefined,`Nearby profile leaked ${field}`);
}
const noRequestConsent=await fetch(base+'/api/requests',{method:'POST',headers:{'content-type':'application/json',authorization:`Bearer ${c.token}`,'x-zovro-terms-version':TERMS,'x-zovro-privacy-version':PRIVACY},body:JSON.stringify({service:'Roadside Assistance',details:'No consent test',location:{lat:42.315,lng:-83.19}})});if(noRequestConsent.status!==428)throw new Error(`Request without service consent returned ${noRequestConsent.status}, expected 428`);
const created=await call('POST','/api/requests',{service:'Roadside Assistance',details:'ZOVRO 1.0 Final end-to-end smoke test',address:'Dearborn, MI',location:{lat:42.315,lng:-83.19}},c.token);const id=created.request.id;
await call('POST',`/api/requests/${id}/accept`,{},p.token);
await call('POST',`/api/requests/${id}/status`,{status:'On the way'},p.token);
const shortReason=await fetch(base+`/api/requests/${id}/provider-emergency-handoff`,{method:'POST',headers:{'content-type':'application/json',authorization:`Bearer ${p.token}`},body:JSON.stringify({reason:'car'})});if(shortReason.status!==400)throw new Error(`Short emergency reason returned ${shortReason.status}, expected 400`);
const handedOff=await call('POST',`/api/requests/${id}/provider-emergency-handoff`,{reason:'Vehicle breakdown while traveling to the customer'},p.token);if(handedOff.request.status!=='Looking for replacement'||handedOff.request.providerId!==null||handedOff.dispatch.notifiedProviders<1)throw new Error('Emergency handoff did not reopen and redispatch the request');
const formerJobs=await call('GET','/api/requests',null,p.token);
assert(!formerJobs.requests.some(r=>r.id===id),'Former provider must not rediscover the handed-off job');
for(const route of ['messages','tracking']){
const denied=await fetch(base+`/api/requests/${id}/${route}`,{headers:{authorization:`Bearer ${p.token}`}});
assert.equal(denied.status,404,`Former provider retained ${route} access`);
}
const discovery=(await call('GET','/api/requests',null,p2.token)).requests.find(r=>r.id===id);
assert(discovery,'Replacement provider must discover the open request');
for(const field of ['customerId','address','location','messages','handoffs','lastHandoffReason'])assert.equal(discovery[field],undefined,`Replacement discovery leaked ${field}`);
const formerProviderRetry=await fetch(base+`/api/requests/${id}/accept`,{method:'POST',headers:{'content-type':'application/json',authorization:`Bearer ${p.token}`},body:'{}'});if(formerProviderRetry.status!==409)throw new Error(`Former provider reaccept returned ${formerProviderRetry.status}, expected 409`);
const replacementAccepted=await call('POST',`/api/requests/${id}/accept`,{},p2.token);
assert.equal(replacementAccepted.request.lastHandoffReason,undefined,'Replacement must not receive the previous provider emergency reason');
assert.equal(replacementAccepted.request.handoffs[0].reason,undefined,'Handoff history must redact private reasons');
const malformedQuote=await fetch(base+`/api/requests/${id}/quote`,{method:'POST',headers:{'content-type':'application/json',authorization:`Bearer ${p2.token}`},body:'{bad'});if(malformedQuote.status!==400)throw new Error(`Malformed payment JSON returned ${malformedQuote.status}, expected 400`);
const quote=await call('POST',`/api/requests/${id}/quote`,{amountCents:10000},p2.token);if(quote.payment.amountCents!==10000)throw new Error('Payment quote route did not recover after malformed JSON');
await call('POST',`/api/requests/${id}/messages`,{text:'Replacement provider is on the way.'},p2.token);
for(const status of ['On the way','Arrived','In progress','Completed'])await call('POST',`/api/requests/${id}/status`,{status},p2.token);
await call('POST',`/api/requests/${id}/rating`,{stars:5},c.token);
const reqs=await call('GET','/api/requests',null,c.token);const final=reqs.requests.find(x=>x.id===id);if(!final||final.status!=='Completed'||final.rating!==5||final.completedProviderId!==p2.user.id||final.reassignmentCount!==1)throw new Error('Final reassigned request state/rating failed');
const originalProfile=await call('GET',`/api/providers/${p.user.id}/profile`,null,c.token),replacementProfile=await call('GET',`/api/providers/${p2.user.id}/profile`,null,c.token);if(originalProfile.provider.stats.emergencyHandoffs!==1||originalProfile.provider.stats.reliabilityScore!==98)throw new Error('Emergency handoff did not affect provider reliability history');if(replacementProfile.provider.stats.completedJobs!==1||replacementProfile.provider.stats.dispatchPriorityScore<=originalProfile.provider.stats.dispatchPriorityScore)throw new Error('Successful replacement provider did not gain dispatch priority');
const notes=await call('GET','/api/notifications',null,c.token);if(!notes.notifications.length)throw new Error('Customer notifications failed');
console.log('ZOVRO 1.0 Final end-to-end smoke test passed.');
}finally{child.kill('SIGTERM');await sleep(200);fs.rmSync(data,{recursive:true,force:true})}
const mirrorData=fs.mkdtempSync(path.join(os.tmpdir(),'zovro-e2e-mirror-')),mirrorPort=port+1;
const mirrorChild=spawn(process.execPath,['server.js'],{cwd:backend,env:{...process.env,NODE_ENV:'production',PORT:String(mirrorPort),ZOVRO_DATA_DIR:mirrorData,ZOVRO_SECRET:'final-e2e-secret-not-production-1234567890',ZOVRO_OPS_TOKEN:'final-e2e-ops-token-1234567890',ZOVRO_ALLOWED_ORIGINS:'https://localhost',ZOVRO_DB_MIRROR_MODE:'mirror',DATABASE_URL:'postgresql://invalid:invalid@base:5432/invalid',PGSSLMODE:'require',ZOVRO_APP_VERSION:'1.0.0'},stdio:['ignore','pipe','pipe']});
try{let checked=false;for(let i=0;i<50;i++){try{const r=await fetch(`http://127.0.0.1:${mirrorPort}/api/ready`);if(r.status===503){const j=await r.json();if(j.ready===false&&j.postgresOperational===false){checked=true;break}}}catch{}await sleep(100)}if(!checked)throw new Error('Failed PostgreSQL mirror must make readiness return 503');console.log('ZOVRO failed-mirror readiness guard passed.')}finally{mirrorChild.kill('SIGTERM');await sleep(200);fs.rmSync(mirrorData,{recursive:true,force:true})}
})().catch(e=>{console.error(e.stack||e);process.exitCode=1});
