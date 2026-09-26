'use strict';
const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {spawnSync}=require('node:child_process');
const {Client}=require('pg');
const {ensureSchema}=require('../schema');
const {reserveReceipt}=require('../receipt-store');
const {summary,resolve}=require('../review');
const {SUPPORT,TEST_RECIPIENT}=require('../bridge');
const {ensureAlerts,notify}=require('../alerts');
const source=process.env.ZOVRO_TEST_DATABASE_URL;
const url=new URL(source);
// Destructive restore tests are permitted only against this disposable local DB.
if(!['localhost','127.0.0.1'].includes(url.hostname)||url.pathname!=='/zovro_support_test')throw Error('Disposable local test database required');
const schema='support_test_'+crypto.randomBytes(8).toString('hex');
url.searchParams.set('options','-c search_path='+schema);
const testUrl=url.toString();
const directory=fs.mkdtempSync(path.join(os.tmpdir(),'zovro-postgres-'));
const accepted=path.join(directory,'accepted.txt');
const db=new Client({connectionString:testUrl});
const run=scenario=>spawnSync(process.execPath,[path.join(__dirname,'../fixtures/worker-integration.cjs')],{encoding:'utf8',timeout:20000,env:{...process.env,ZOVRO_SUPPORT_MAIL_DATABASE_URL:testUrl,ZOVRO_SUPPORT_MAIL_MODE:scenario.startsWith('customer')?'customer':'test',ZOVRO_SUPPORT_MAIL_CUSTOMER_APPROVED:scenario==='customer'?'yes':'no',ZOVRO_SUPPORT_MAIL_USER:SUPPORT,ZOVRO_SUPPORT_MAIL_PASSWORD:'isolated-fixture',ZOVRO_SUPPORT_MAIL_TEST_RECIPIENT:TEST_RECIPIENT,ZOVRO_FIXTURE_SCENARIO:scenario,ZOVRO_FIXTURE_ACCEPTANCES:accepted}});
const monitor=()=>spawnSync(process.execPath,[path.join(__dirname,'../monitor.js')],{encoding:'utf8',timeout:20000,env:{...process.env,ZOVRO_SUPPORT_MAIL_DATABASE_URL:testUrl,ZOVRO_SUPPORT_MAIL_MODE:'disabled',ZOVRO_SUPPORT_MAIL_USER:SUPPORT,ZOVRO_SUPPORT_MAIL_PASSWORD:'isolated-fixture'}});
const acceptances=()=>fs.existsSync(accepted)?fs.readFileSync(accepted,'utf8').trim().split('\n').length:0;
async function state(){return {receipts:(await db.query('SELECT status FROM zovro_support_mail_receipts')).rows,cursor:Number((await db.query('SELECT last_uid FROM zovro_support_mail_cursor')).rows[0].last_uid)};}
async function reset(){
 await db.query('TRUNCATE zovro_support_mail_reviews,zovro_support_mail_receipts,zovro_support_mail_cursor');
 await db.query('INSERT INTO zovro_support_mail_cursor VALUES($1,$2,0)',[SUPPORT,'17']);
 fs.rmSync(accepted,{force:true});
}
async function main(){
 await db.connect();
 await db.query('CREATE SCHEMA '+schema);
 try{
  await ensureSchema(db);
  for(const scenario of ['normal','ambiguous','kill-after-acceptance']){
   await reset();
   const first=run(scenario);assert.ifError(first.error);
   assert.equal(first.signal,scenario==='kill-after-acceptance'?'SIGKILL':null);
   assert.equal(first.status,scenario==='kill-after-acceptance'?null:0,first.stderr);
   const expected=scenario==='normal'?'sent':scenario==='ambiguous'?'delivery_unconfirmed':'reserved';
   assert.deepEqual(await state(),{receipts:[{status:expected}],cursor:scenario==='kill-after-acceptance'?0:1});
   const replay=run('normal');assert.ifError(replay.error);assert.equal(replay.status,0,replay.stderr);
   assert.deepEqual(await state(),{receipts:[{status:expected}],cursor:1});
   assert.equal(acceptances(),1);
  }
  console.log('PASS real worker: durable reservation, SIGKILL, ambiguous SMTP, cursor recovery, no duplicate acceptance');
  await reset();
  const unapproved=run('customer-unapproved');assert.ifError(unapproved.error);assert.equal(unapproved.status,1);
  assert.deepEqual(await state(),{receipts:[],cursor:0});assert.equal(acceptances(),0);
  const customer=run('customer');assert.ifError(customer.error);assert.equal(customer.status,0,customer.stderr);
  assert.deepEqual(await state(),{receipts:[{status:'sent'}],cursor:1});assert.equal(acceptances(),1);
  const customerReplay=run('customer');assert.ifError(customerReplay.error);assert.equal(customerReplay.status,0,customerReplay.stderr);assert.equal(acceptances(),1);
  console.log('PASS candidate customer worker requires approval and preserves correct recipient and replay protection with fake transport');
  await reset();
  const changed=run('changed-validity');assert.ifError(changed.error);assert.equal(changed.status,1);
  assert.deepEqual(await state(),{receipts:[],cursor:0});assert.equal(acceptances(),0);
  console.log('PASS changed mailbox identity stops before sending or cursor mutation');
  // Concurrent independent PostgreSQL sessions must share the same budget.
  const clients=Array.from({length:8},()=>new Client({connectionString:testUrl}));
  try{
   await Promise.all(clients.map(c=>c.connect()));
   const records=clients.map((_,i)=>({key:crypto.createHash('sha256').update('budget'+i).digest('hex'),uid:i+10,uidValidity:'17',status:'reserved',senderHash:'a'.repeat(64),answerId:null,policyVersion:null}));
   await Promise.all(clients.map((c,i)=>reserveReceipt(c,records[i])));
   assert.equal(records.filter(r=>r.status==='reserved').length,3);
   assert.equal(records.filter(r=>r.status==='rate_limited').length,5);
  }finally{await Promise.all(clients.map(c=>c.end()));}
  console.log('PASS concurrent PostgreSQL reservations enforce sender budget');
  await reset();
  const killed=run('kill-after-acceptance');assert.ifError(killed.error);assert.equal(killed.signal,'SIGKILL');
  await db.query("UPDATE zovro_support_mail_receipts SET updated_at=now()-interval '20 minutes'");
  assert.equal((await summary(db))[0].status,'reserved');
  const alert=monitor();assert.ifError(alert.error);assert.equal(alert.status,2,alert.stderr);
  assert.equal(JSON.parse(alert.stdout).urgent,1);
  const key=(await db.query('SELECT message_key FROM zovro_support_mail_receipts')).rows[0].message_key;
  assert.deepEqual(await resolve(db,key,'verified_delivered'),{resolved:true});
  assert.deepEqual(await summary(db),[]);
  const healthy=monitor();assert.ifError(healthy.error);assert.equal(healthy.status,0,healthy.stderr);
  assert.equal(JSON.parse(healthy.stdout).attentionRequired,false);
  assert.equal(acceptances(),1);
  console.log('PASS read-only monitor detects stale reservation and clears after operator resolution while sender disabled');
  await ensureAlerts(db);await ensureAlerts(db);
  const alertDb=new Client({connectionString:testUrl});await alertDb.connect();
  let alertSends=0;
  try{
   const results=await Promise.all([db,alertDb].map(client=>notify({db:client,result:{attentionRequired:false},test:true,send:async()=>{alertSends++;}})));
   assert.deepEqual(results.sort(),['sent','throttled']);assert.equal(alertSends,1);
  }finally{await alertDb.end();}
  console.log('PASS concurrent alert jobs persist one reservation and send only one company notification');
  // Logical backup includes cursor, reservations and review dispositions together.
  const env={...process.env,PGHOST:url.hostname,PGPORT:url.port||'5432',PGDATABASE:'zovro_support_test',PGUSER:decodeURIComponent(url.username),PGPASSWORD:decodeURIComponent(url.password),PGOPTIONS:''};
  const dumpPath=path.join(directory,'support.sql');
  const dump=spawnSync('pg_dump',['--schema='+schema,'--no-owner','--no-acl','--file='+dumpPath],{env,encoding:'utf8',timeout:20000});
  assert.ifError(dump.error);assert.equal(dump.status,0,dump.stderr);
  await db.query('DROP SCHEMA '+schema+' CASCADE');
  const restore=spawnSync('psql',['--set=ON_ERROR_STOP=1','--file='+dumpPath],{env,encoding:'utf8',timeout:20000});
  assert.ifError(restore.error);assert.equal(restore.status,0,restore.stderr);
  await ensureSchema(db);
  assert.deepEqual(await state(),{receipts:[{status:'reserved'}],cursor:0});
  assert.deepEqual(await summary(db),[]);
  assert.equal((await db.query('SELECT resolution FROM zovro_support_mail_reviews')).rows[0].resolution,'verified_delivered');
  assert.equal((await db.query('SELECT count(*)::int AS count FROM zovro_support_mail_alerts')).rows[0].count,1);
  const afterRestore=run('normal');assert.ifError(afterRestore.error);assert.equal(afterRestore.status,0,afterRestore.stderr);
  assert.equal((await state()).cursor,1);assert.equal(acceptances(),1);
  console.log('PASS PostgreSQL dump/restore preserves reservations, cursor, dispositions and replay prevention');
 }finally{
  await db.query('DROP SCHEMA IF EXISTS '+schema+' CASCADE');
  await db.end();
  fs.rmSync(directory,{recursive:true,force:true});
 }
}
main().catch(error=>{console.error(error);process.exitCode=1;});
