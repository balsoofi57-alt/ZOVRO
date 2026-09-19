'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const {spawn}=require('node:child_process');
const root=path.resolve(__dirname,'..');
async function frontend(){
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
 const script=html.match(/<script>([\s\S]*?)<\/script>/)[1].replace(/boot\(\);setInterval\([\s\S]*$/, '');
 const nodes=new Map(),node=id=>{if(!nodes.has(id))nodes.set(id,{textContent:'',disabled:false,classList:{add(){},remove(){}}});return nodes.get(id)};
 let geoCount=0,calls=[],mode='ok',release;
 const context=vm.createContext({crypto,AbortController,setTimeout,clearTimeout,window:{},localStorage:{},navigator:{},document:{getElementById:node},console});
 vm.runInContext(script,context);
 context.testGeo=async()=>{geoCount++;if(mode==='deny')throw {code:1};if(mode==='wait')await new Promise(r=>release=r);return {lat:42.315,lng:-83.19,accuracy:10,capturedAt:new Date().toISOString()}};
 context.testApi=async(p,o)=>{calls.push(JSON.parse(o.body));if(mode==='network')throw Error('Offline');return {request:{id:'request-1'},dispatch:{notifiedProviders:0}}};
 vm.runInContext("me={id:'customer-1',role:'customer'};geo=testGeo;api=testApi;loadJobs=()=>{};openAuth=()=>{}",context);
 const run=()=>vm.runInContext('quickSOS()',context);
 mode='wait';const pending=run();await run();assert.equal(geoCount,1);release();await pending;
 assert.equal(calls.length,1);assert.equal(calls[0].source,'sos');assert.equal(calls[0].urgent,true);assert.equal(calls[0].location.lat,42.315);assert.match(node('sosStatus').textContent,/no available nearby providers/i);
 mode='deny';await run();assert.equal(calls.length,1);assert.match(node('sosStatus').textContent,/No SOS request was sent/);assert.equal(node('sosButton').disabled,false);
 mode='network';await run();const first=calls.at(-1);mode='ok';await run();assert.deepEqual(calls.at(-1),first,'Uncertain delivery must retry the identical request');
 vm.runInContext("me={id:'provider-1',role:'provider'}",context);const count=calls.length;await run();assert.equal(calls.length,count);
 vm.runInContext('me=null',context);await run();assert.equal(calls.length,count);assert.match(node('sosStatus').textContent,/Sign in/);
 console.log('SOS UI: one tap, double tap, GPS denial, uncertain retry, no-provider message and account guards passed.');
}
async function backend(){
 const data=fs.mkdtempSync(path.join(os.tmpdir(),'zovro-sos-'));
 const net=require('node:net');const probe=net.createServer();await new Promise(r=>probe.listen(0,'127.0.0.1',r));const port=probe.address().port;await new Promise(r=>probe.close(r));
 const server=spawn(process.execPath,['backend/server-core.js'],{cwd:root,env:{...process.env,PORT:String(port),NODE_ENV:'production',ZOVRO_DATA_DIR:data,ZOVRO_DB_MIRROR_MODE:'off',DATABASE_URL:'',ONESIGNAL_REST_API_KEY:'',ZOVRO_SECRET:'sos-local-test-secret-12345678901234567890',ZOVRO_OPS_TOKEN:'sos-local-test-ops-1234567890'},stdio:'ignore'});
 const base=`http://127.0.0.1:${port}`;
 const call=async(method,url,payload,token)=>{const r=await fetch(base+url,{method,headers:{'content-type':'application/json',...(token?{authorization:'Bearer '+token}:{})},body:payload?JSON.stringify(payload):undefined});return {status:r.status,data:await r.json()}};
 try{
  let ready=false;for(let i=0;i<50;i++){try{if((await call('GET','/api/health')).status===200){ready=true;break}}catch{}await new Promise(r=>setTimeout(r,50))}assert.ok(ready,'Backend ready');
  const register=async(role,phone)=>{const r=await call('POST','/api/auth/register',{name:'SOS Test '+role,phone,password:'StrongPass22!',role,service:'Roadside Assistance'});assert.equal(r.status,201);return r.data};
  const c=await register('customer','13135550101'),p=await register('provider','13135550102');
  await call('POST','/api/provider/location',{lat:42.32,lng:-83.18,accuracy:10},p.token);
  const payload={source:'sos',clientRequestId:crypto.randomUUID(),service:'Roadside Assistance',details:'SOS test',urgent:true,location:{lat:42.315,lng:-83.19,accuracy:10,capturedAt:new Date().toISOString()}};
  assert.equal((await call('POST','/api/requests',payload)).status,401);
  assert.equal((await call('POST','/api/requests',payload,p.token)).status,403);
  for(const location of [null,{...payload.location,lat:91},{...payload.location,lng:null},{...payload.location,capturedAt:'2000-01-01T00:00:00Z'},{...payload.location,accuracy:5000}])assert.equal((await call('POST','/api/requests',{...payload,location},c.token)).status,400);
  const created=await call('POST','/api/requests',payload,c.token);assert.equal(created.status,201);assert.equal(created.data.dispatch.notifiedProviders,1);const id=created.data.request.id;
  for(const clientRequestId of [payload.clientRequestId,crypto.randomUUID()]){const r=await call('POST','/api/requests',{...payload,clientRequestId},c.token);assert.equal(r.status,200);assert.equal(r.data.request.id,id);assert.equal(r.data.reused,true)}
  const notes=await call('GET','/api/notifications',null,p.token);assert.equal(notes.data.notifications.filter(n=>n.meta.requestId===id).length,1,'Retries must not repeat dispatch');
  const rows=await call('GET','/api/requests',null,c.token);assert.equal(rows.data.requests.length,1);
  await call('POST',`/api/requests/${id}/cancel`,{reason:'Test complete'},c.token);
  const replay=await call('POST','/api/requests',payload,c.token);assert.equal(replay.data.request.id,id);assert.equal(replay.data.request.status,'Cancelled');
  const next=await call('POST','/api/requests',{...payload,clientRequestId:crypto.randomUUID()},c.token);assert.equal(next.status,201);assert.notEqual(next.data.request.id,id);
  console.log('SOS API: authentication, coordinates/freshness, nearby dispatch, retry/active-request deduplication and cancellation passed.');
 }finally{server.kill('SIGTERM');await new Promise(r=>{if(server.exitCode!==null||server.signalCode!==null)return r();server.once('exit',r)});fs.rmSync(data,{recursive:true,force:true})}
}
(async()=>{await frontend();await backend()})().catch(e=>{console.error(e);process.exitCode=1});
