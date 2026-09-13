'use strict';
const assert=require('assert');
const crypto=require('crypto');
const fs=require('fs');
const os=require('os');
const path=require('path');
const {EventEmitter}=require('events');

const dir=fs.mkdtempSync(path.join(os.tmpdir(),'zovro-workflow-api-'));
process.env.ZOVRO_DATA_DIR=dir;
process.env.ZOVRO_DB_MIRROR_MODE='off';
process.env.ZOVRO_SECRET='workflow-api-test-secret';

const database=require('../backend/database');
const store=require('../backend/workflow-store');
const {workflowApi}=require('../backend/workflow-api');

const expiry=Date.now()+60*60*1000;
const state=database.readDb();
state.users.push({id:'u1',role:'customer',accountStatus:'active'},{id:'u2',role:'customer',accountStatus:'active'});
state.deviceSessions.push({id:'s1',userId:'u1',expiresAt:expiry},{id:'s2',userId:'u2',expiresAt:expiry});
database.writeDb(state,{suppressPush:true,suppressMirror:true});

function token(uid,sid){
  const payload=Buffer.from(JSON.stringify({uid,sid,exp:expiry})).toString('base64url');
  const sig=crypto.createHmac('sha256',process.env.ZOVRO_SECRET).update(payload).digest('base64url');
  return payload+'.'+sig;
}

function invoke({method='GET',url='/api/workflows',auth=null,json=null}){
  return new Promise((resolve,reject)=>{
    const req=new EventEmitter();
    req.method=method;req.url=url;req.headers={};
    if(auth)req.headers.authorization='Bearer '+auth;
    req.destroy=()=>{};
    let status=0,headers={};
    const res={headersSent:false,writeHead(code,h){status=code;headers=h||{};this.headersSent=true;},end(chunk){let body=null;try{body=chunk?JSON.parse(Buffer.isBuffer(chunk)?chunk.toString('utf8'):String(chunk)):null;}catch(e){return reject(e)}resolve({status,headers,body});}};
    Promise.resolve(workflowApi(req,res,()=>resolve({status:599,body:{next:true}}))).catch(reject);
    process.nextTick(()=>{if(json!=null)req.emit('data',Buffer.from(JSON.stringify(json)));req.emit('end');});
  });
}

(async()=>{
  const unauth=await invoke({method:'GET'});
  assert.equal(unauth.status,401,'Unauthenticated workflow list must be rejected');

  const a1=token('u1','s1'),a2=token('u2','s2');
  const created=await invoke({method:'POST',auth:a1,json:{type:'favorite-provider',data:{providerId:'p9'}}});
  assert.equal(created.status,201,'Authenticated workflow create failed');
  assert.equal(created.body.record.user,'u1','Workflow owner must come from authenticated user');
  const id=created.body.record.id;

  const list=await invoke({method:'GET',url:'/api/workflows?type=favorite-provider',auth:a1});
  assert.equal(list.status,200);assert.equal(list.body.records.length,1,'Owner list should include created workflow');

  const hidden=await invoke({method:'GET',url:'/api/workflows/'+id,auth:a2});
  assert.equal(hidden.status,404,'Another user must not read workflow record');

  const patched=await invoke({method:'PATCH',url:'/api/workflows/'+id,auth:a1,json:{status:'paused',data:{note:'later'}}});
  assert.equal(patched.status,200);assert.equal(patched.body.record.status,'paused');assert.equal(patched.body.record.data.note,'later');

  const up1=await invoke({method:'POST',url:'/api/workflows/upsert',auth:a1,json:{type:'notification-preferences',key:'main',data:{push:true}}});
  const up2=await invoke({method:'POST',url:'/api/workflows/upsert',auth:a1,json:{type:'notification-preferences',key:'main',data:{push:false}}});
  assert.equal(up1.status,200);assert.equal(up2.status,200);assert.equal(up1.body.record.id,up2.body.record.id,'Upsert must preserve unique record id');
  assert.equal(up2.body.record.data.push,false,'Upsert must update data');

  const blockedProvider=await invoke({method:'POST',auth:a1,json:{type:'team',providerId:'someone-else',data:{}}});
  assert.equal(blockedProvider.status,403,'User must not assign another provider id');

  const deleted=await invoke({method:'DELETE',url:'/api/workflows/'+id,auth:a1});
  assert.equal(deleted.status,200);assert.equal(store.records().some(r=>r.id===id),false,'Delete must remove workflow record');

  database.closeDb();
  fs.rmSync(dir,{recursive:true,force:true});
  console.log(JSON.stringify({ok:true,authentication:true,ownershipIsolation:true,create:true,list:true,patch:true,upsert:true,delete:true}));
})().catch(e=>{try{database.closeDb()}catch{};try{fs.rmSync(dir,{recursive:true,force:true})}catch{};console.error(e);process.exit(1);});
