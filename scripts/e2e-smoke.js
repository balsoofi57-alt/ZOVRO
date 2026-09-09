'use strict';
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
await call('PATCH','/api/provider/availability',{available:true},p.token);
await call('POST','/api/provider/location',{lat:42.3223,lng:-83.1763,accuracy:10},p.token);
const nearby=await call('GET','/api/providers/nearby?lat=42.315&lng=-83.19&service=Roadside%20Assistance',null,c.token);if(!nearby.providers.length)throw new Error('Nearby provider matching failed');
const noRequestConsent=await fetch(base+'/api/requests',{method:'POST',headers:{'content-type':'application/json',authorization:`Bearer ${c.token}`,'x-zovro-terms-version':TERMS,'x-zovro-privacy-version':PRIVACY},body:JSON.stringify({service:'Roadside Assistance',details:'No consent test',location:{lat:42.315,lng:-83.19}})});if(noRequestConsent.status!==428)throw new Error(`Request without service consent returned ${noRequestConsent.status}, expected 428`);
const created=await call('POST','/api/requests',{service:'Roadside Assistance',details:'ZOVRO 1.0 Final end-to-end smoke test',address:'Dearborn, MI',location:{lat:42.315,lng:-83.19}},c.token);const id=created.request.id;
await call('POST',`/api/requests/${id}/accept`,{},p.token);
const malformedQuote=await fetch(base+`/api/requests/${id}/quote`,{method:'POST',headers:{'content-type':'application/json',authorization:`Bearer ${p.token}`},body:'{bad'});if(malformedQuote.status!==400)throw new Error(`Malformed payment JSON returned ${malformedQuote.status}, expected 400`);
const quote=await call('POST',`/api/requests/${id}/quote`,{amountCents:10000},p.token);if(quote.payment.amountCents!==10000)throw new Error('Payment quote route did not recover after malformed JSON');
await call('POST',`/api/requests/${id}/messages`,{text:'On my way for ZOVRO 1.0 Final test.'},p.token);
for(const status of ['On the way','Arrived','In progress','Completed'])await call('POST',`/api/requests/${id}/status`,{status},p.token);
await call('POST',`/api/requests/${id}/rating`,{stars:5},c.token);
const reqs=await call('GET','/api/requests',null,c.token);const final=reqs.requests.find(x=>x.id===id);if(!final||final.status!=='Completed'||final.rating!==5)throw new Error('Final request state/rating failed');
const notes=await call('GET','/api/notifications',null,c.token);if(!notes.notifications.length)throw new Error('Customer notifications failed');
console.log('ZOVRO 1.0 Final end-to-end smoke test passed.');
}finally{child.kill('SIGTERM');await sleep(200);fs.rmSync(data,{recursive:true,force:true})}
const mirrorData=fs.mkdtempSync(path.join(os.tmpdir(),'zovro-e2e-mirror-')),mirrorPort=port+1;
const mirrorChild=spawn(process.execPath,['server.js'],{cwd:backend,env:{...process.env,NODE_ENV:'production',PORT:String(mirrorPort),ZOVRO_DATA_DIR:mirrorData,ZOVRO_SECRET:'final-e2e-secret-not-production-1234567890',ZOVRO_OPS_TOKEN:'final-e2e-ops-token-1234567890',ZOVRO_ALLOWED_ORIGINS:'https://localhost',ZOVRO_DB_MIRROR_MODE:'mirror',DATABASE_URL:'postgresql://invalid:invalid@base:5432/invalid',PGSSLMODE:'require',ZOVRO_APP_VERSION:'1.0.0'},stdio:['ignore','pipe','pipe']});
try{let checked=false;for(let i=0;i<50;i++){try{const r=await fetch(`http://127.0.0.1:${mirrorPort}/api/ready`);if(r.status===503){const j=await r.json();if(j.ready===false&&j.postgresOperational===false){checked=true;break}}}catch{}await sleep(100)}if(!checked)throw new Error('Failed PostgreSQL mirror must make readiness return 503');console.log('ZOVRO failed-mirror readiness guard passed.')}finally{mirrorChild.kill('SIGTERM');await sleep(200);fs.rmSync(mirrorData,{recursive:true,force:true})}
})().catch(e=>{console.error(e.stack||e);process.exitCode=1});
