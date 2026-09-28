'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {spawnSync}=require('node:child_process');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'zovro-payment-receipts-'));
const env={...process.env,ZOVRO_DATA_DIR:dir,ZOVRO_DB_MIRROR_MODE:'off',ZOVRO_PUSH_ENABLED:'false'};
function child(code){const out=spawnSync(process.execPath,['-e',code],{cwd:root,env,encoding:'utf8'});assert.equal(out.status,0,out.stderr);}
(async()=>{
 try{
  child(`const d=require('./backend/database');(async()=>{const s=d.readDb();s.requests.push({id:'req_receipt',paymentState:'refunded'});await d.writePaymentEvent(s,{eventId:'evt_persist',outcome:'processed'});s.audit=Array.from({length:1100},(_,i)=>({id:'audit_'+i}));d.writeDb(s);d.closeDb();})().catch(e=>{console.error(e);process.exitCode=1});`);
  child(`const assert=require('node:assert/strict'),d=require('./backend/database');(async()=>{assert.equal((await d.findPaymentEventReceipt('evt_persist')).outcome,'processed');assert.equal(d.readDb().requests[0].paymentState,'refunded');const s=d.readDb();s.audit=[];d.writeDb(s);assert.ok(await d.findPaymentEventReceipt('evt_persist'));d.closeDb();})().catch(e=>{console.error(e);process.exitCode=1});`);
  // Exercise the real PostgreSQL adapter with a transactional fault-injection client.
  // This verifies adapter behavior, not connectivity to a production database.
  let committed=new Map(),failCommit=false,active=0,maxActive=0;
  class Client{
   async connect(){} async end(){}
   async query(sql,args){
    if(sql==='BEGIN'){active++;maxActive=Math.max(maxActive,active);this.tx=new Map(committed);}
    if(sql.startsWith('INSERT INTO stripe_webhook_receipts'))this.tx.set(args[0],args[1]);
    if(sql==='COMMIT'){if(failCommit)throw new Error('Injected commit failure');committed=this.tx;active--;}
    if(sql==='ROLLBACK'){this.tx=null;active--;}
    if(sql.startsWith('SELECT data FROM stripe_webhook_receipts'))return {rows:committed.has(args[0])?[{data:committed.get(args[0])}]:[]};
    await new Promise(r=>setTimeout(r,1));return {rows:[]};
   }
  }
  const mod={exports:{}};
  vm.runInNewContext(fs.readFileSync(path.join(root,'backend/postgres-mirror.js'),'utf8'),{module:mod,require:n=>n==='pg'?{Client}:require(n),process:{env:{DATABASE_URL:'postgres://fixture'}},__dirname:path.join(root,'backend'),console:{error:()=>{}}});
  const mirror=mod.exports;
  failCommit=true;
  await assert.rejects(mirror.enqueue({}, {eventId:'evt_failure'}),/Injected commit failure/);
  assert.equal(await mirror.findPaymentReceipt('evt_failure'),null,'Failed transaction must not leave a receipt');
  failCommit=false;
  await Promise.all([mirror.enqueue({}, {eventId:'evt_a'}),mirror.enqueue({}, {eventId:'evt_b'})]);
  assert.equal(maxActive,1,'Snapshot writes must remain ordered');
  assert.equal((await mirror.findPaymentReceipt('evt_a')).eventId,'evt_a');
  await mirror.enqueue({});
  assert.equal((await mirror.findPaymentReceipt('evt_a')).eventId,'evt_a','Ordinary snapshots must retain receipts');
  console.log('PASS: SQLite process restart and audit pruning; PostgreSQL adapter atomic receipt rollback, error propagation, ordered writes and append-only retention (fault-injection client).');
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
})().catch(e=>{console.error(e);process.exitCode=1});
