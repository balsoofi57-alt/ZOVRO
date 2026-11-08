'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),crypto=require('node:crypto');
const {spawn}=require('node:child_process');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');

// SOS is retired from both public web and packaged Capacitor source.
const html=read('index.html'),website=read('website-final.js'),consent=read('consent-client.js');
const features=require('../src/product-features.js');
const listing=JSON.parse(read('store/listing.en-US.json'));
assert(!html.includes('id="sosButton"')&&!html.includes('quickSOS('),'SOS must not appear in public mobile/web UI');
assert(!website.includes('id="sosButton"')&&!website.includes('quickSOS'),'Website must not add SOS again');
assert.equal(features.PRODUCT_FEATURES.launchCore.sosDispatch,false,'SOS flag must be disabled');
assert.match(consent,/SOS dispatch is discontinued/,'Old SOS submissions must be blocked by consent client');
assert(!listing.apple.description.includes('SOS')&&!listing.googlePlay.fullDescription.includes('SOS'),'Store copy must not advertise retired SOS');

// Validate old installed clients cannot create a new SOS request, but normal
// urgent roadside service requests still work and preserve their lifecycle.
(async()=>{
 const data=fs.mkdtempSync(path.join(os.tmpdir(),'zovro-retired-sos-'));
 const net=require('node:net'),probe=net.createServer();
 await new Promise(ok=>probe.listen(0,'127.0.0.1',ok));const port=probe.address().port;await new Promise(ok=>probe.close(ok));
 let log='';
 const server=spawn(process.execPath,['backend/server-core.js'],{cwd:root,env:{...process.env,PORT:String(port),NODE_ENV:'production',ZOVRO_DATA_DIR:data,ZOVRO_DB_MIRROR_MODE:'off',DATABASE_URL:'',ONESIGNAL_REST_API_KEY:'',ZOVRO_SECRET:'retired-sos-test-secret-12345678901234567890',ZOVRO_OPS_TOKEN:'retired-sos-test-ops-1234567890'},stdio:['ignore','pipe','pipe']});
 server.stdout.on('data',d=>{log=(log+d).slice(-8000)});server.stderr.on('data',d=>{log=(log+d).slice(-8000)});
 const base='http://127.0.0.1:'+port;
 const call=async(method,url,payload,token)=>{const r=await fetch(base+url,{method,headers:{'content-type':'application/json',...(token?{authorization:'Bearer '+token}:{})},body:payload?JSON.stringify(payload):undefined});return {status:r.status,data:await r.json()}};
 try{
  let started=false;
  for(let i=0;i<200;i++){try{if((await call('GET','/api/health')).status===200){started=true;break}}catch{}if(server.exitCode!==null||server.signalCode!==null)break;await new Promise(ok=>setTimeout(ok,50))}
  assert(started,'Backend did not start: '+log);
  const registration=await call('POST','/api/auth/register',{name:'Customer',phone:'13135550991',password:'StrongPass22!',role:'customer'});
  assert.equal(registration.status,201);
  const token=registration.data.token;
  const sos={source:'sos',clientRequestId:crypto.randomUUID(),service:'Roadside Assistance',details:'Legacy SOS',urgent:true,location:{lat:42.315,lng:-83.19,accuracy:10,capturedAt:new Date().toISOString()}};
  assert.equal((await call('POST','/api/requests',sos)).status,401,'Unauthenticated old client remains blocked');
  const refused=await call('POST','/api/requests',sos,token);
  assert.equal(refused.status,410,'New SOS attempts must be retired');
  assert.match(refused.data.error,/SOS dispatch is discontinued/);
  const normal=await call('POST','/api/requests',{service:'Roadside Assistance',serviceSelectionManual:true,details:'Flat tire, need help',urgent:true,clientRequestId:crypto.randomUUID()},token);
  assert.equal(normal.status,201,'Urgent roadside assistance must remain available');
  assert.equal(normal.data.request.service,'Roadside Assistance');
  assert.equal(normal.data.request.urgent,true);
  const rows=await call('GET','/api/requests',null,token);
  assert.equal(rows.data.requests.length,1,'Retired SOS must not create records or erase ordinary requests');
  assert.equal(rows.data.requests[0].id,normal.data.request.id);
  console.log('SOS retirement QA passed: public UI/store copy removed, new SOS rejected, urgent roadside preserved.');
 }finally{server.kill('SIGTERM');await new Promise(ok=>{if(server.exitCode!==null||server.signalCode!==null)return ok();server.once('exit',ok)});fs.rmSync(data,{recursive:true,force:true})}
})().catch(e=>{console.error(e);process.exitCode=1});
