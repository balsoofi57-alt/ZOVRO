'use strict';
const {spawn}=require('child_process');
const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..'), backend=path.join(root,'backend'), data=path.join(backend,'data');
const port=Number(process.env.ZOVRO_TEST_PORT||18919), base=`http://127.0.0.1:${port}`;
const files=['zovro.sqlite','zovro.sqlite-wal','zovro.sqlite-shm'];
const backups=[];
function sleep(ms){return new Promise(r=>setTimeout(r,ms))}
async function call(method,url,body,token){const r=await fetch(base+url,{method,headers:{'content-type':'application/json',...(token?{authorization:`Bearer ${token}`}:{})},body:body?JSON.stringify(body):undefined});let j={};try{j=await r.json()}catch{};if(!r.ok)throw new Error(`${method} ${url} -> ${r.status} ${JSON.stringify(j)}`);return j}
function backup(){fs.mkdirSync(data,{recursive:true});for(const f of files){const p=path.join(data,f);if(fs.existsSync(p)){const b=p+'.final-test-backup';fs.copyFileSync(p,b);backups.push([p,b]);fs.rmSync(p,{force:true})}}}
function restore(){for(const f of files)fs.rmSync(path.join(data,f),{force:true});for(const [p,b] of backups){fs.copyFileSync(b,p);fs.rmSync(b,{force:true})}}
(async()=>{backup();const child=spawn(process.execPath,['server.js'],{cwd:backend,env:{...process.env,PORT:String(port),ZOVRO_SECRET:'final-e2e-secret-not-production',ZOVRO_APP_VERSION:'1.0.0'},stdio:['ignore','pipe','pipe']});
try{let ready=false;for(let i=0;i<40;i++){try{const h=await call('GET','/api/health');if(h.ok&&h.stage==='FINAL'&&h.version==='1.0.0'){ready=true;break}}catch{}await sleep(100)}if(!ready)throw new Error('Final backend did not become ready with expected version/stage');
const suffix=Date.now();
const c=await call('POST','/api/auth/register',{name:'ZOVRO Customer',phone:`1313${String(suffix).slice(-7)}`,password:'StrongPass22!',role:'customer'});
const p=await call('POST','/api/auth/register',{name:'ZOVRO Provider',phone:`2484${String(suffix).slice(-7)}`,password:'StrongPass22!',role:'provider',service:'Roadside Assistance'});
await call('PATCH','/api/provider/availability',{available:true},p.token);
await call('POST','/api/provider/location',{lat:42.3223,lng:-83.1763,accuracy:10},p.token);
const nearby=await call('GET','/api/providers/nearby?lat=42.315&lng=-83.19&service=Roadside%20Assistance',null,c.token);if(!nearby.providers.length)throw new Error('Nearby provider matching failed');
const created=await call('POST','/api/requests',{service:'Roadside Assistance',details:'ZOVRO 1.0 Final end-to-end smoke test',address:'Dearborn, MI',location:{lat:42.315,lng:-83.19}},c.token);const id=created.request.id;
await call('POST',`/api/requests/${id}/accept`,{},p.token);
await call('POST',`/api/requests/${id}/messages`,{text:'On my way for ZOVRO 1.0 Final test.'},p.token);
for(const status of ['On the way','Arrived','In progress','Completed'])await call('POST',`/api/requests/${id}/status`,{status},p.token);
await call('POST',`/api/requests/${id}/rating`,{stars:5},c.token);
const reqs=await call('GET','/api/requests',null,c.token);const final=reqs.requests.find(x=>x.id===id);if(!final||final.status!=='Completed'||final.rating!==5)throw new Error('Final request state/rating failed');
const notes=await call('GET','/api/notifications',null,c.token);if(!notes.notifications.length)throw new Error('Customer notifications failed');
console.log('ZOVRO 1.0 Final end-to-end smoke test passed.');
}finally{child.kill('SIGTERM');await sleep(200);restore()}})().catch(e=>{console.error(e.stack||e);process.exitCode=1});
