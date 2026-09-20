'use strict';
// No HTTP server, no real credentials and no network transport are used.
const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),vm=require('node:vm');
const {Readable}=require('node:stream');
const root=path.resolve(__dirname,'..'),temp=fs.mkdtempSync(path.join(os.tmpdir(),'zovro-sms-safety-'));
process.env.ZOVRO_DATA_DIR=temp;process.env.ZOVRO_DB_MIRROR_MODE='off';process.env.DATABASE_URL='';process.env.ZOVRO_PUSH_MODE='disabled';process.env.ONESIGNAL_REST_API_KEY='';
const token='dummy-auth-token-for-local-tests',base='https://sms.example.test',route='/api/webhooks/twilio/sms';
let database=require('../backend/database');
function load(mode){
 const env={ZOVRO_SMS_MODE:mode,TWILIO_AUTH_TOKEN:token,PUBLIC_API_BASE_URL:base};
 const smsContext={module:{exports:{}},require,process:{env},Buffer,URLSearchParams,globalThis:{fetch:()=>{throw Error('Network forbidden');}}};
 vm.runInNewContext(fs.readFileSync(path.join(root,'backend/sms-fallback.js'),'utf8'),smsContext);
 const sms=smsContext.module.exports;
 const context={module:{exports:{}},process:{env},Buffer,URL,URLSearchParams,console,require(name){
  if(name==='http')return {createServer(){throw Error('Network forbidden');}};
  if(name==='./sms-fallback')return sms;
  if(name==='./database')return database;
  if(name==='./request-privacy')return {currentUser:()=>({user:database.readDb().users[0]}),acceptanceEligibility:()=>({ok:true})};
  return require(name);
 }};
 vm.runInNewContext(fs.readFileSync(path.join(root,'backend/server-sms.js'),'utf8'),context);
 return {sms,bridge:context.module.exports};
}
function seed(){const db=database.readDb();db.users=[{id:'p1',role:'provider',name:'Test',phone:'+13135550123',phoneVerified:true,availability:true,smsJobAlertsOptIn:true}];db.requests=[];db.messages=[];db.notifications=[];db.audit=[];db.smsReceipts=[];database.writeDb(db,{suppressPush:true});}
function addOffer(sms,id='r1'){const db=database.readDb();db.requests.push({id,status:'Looking for providers',customerId:'c1',service:'Plumbing',smsOffers:[sms.createOffer({requestId:id,providerId:'p1'})]});database.writeDb(db,{suppressPush:true});}
async function inbound(loaded,body,sid,extra={},bad=false){
 const params={From:'+13135550123',Body:body,MessageSid:sid,...extra};
 const req=Readable.from([new URLSearchParams(params).toString()]);req.method='POST';req.url=route;req.headers={'x-twilio-signature':bad?'bad':loaded.sms.twilioSignature(token,base+route,params)};
 const res={writeHead(status,headers){this.status=status;this.headers=headers;},end(text){this.text=text;}};
 await loaded.bridge.router(req,res,()=>{throw Error('Unexpected route');});return res;
}
(async()=>{try{
 let loaded=load('live');seed();addOffer(loaded.sms);
 assert.equal((await inbound(loaded,'1','bad',{},true)).status,403);assert.equal(database.readDb().requests[0].providerId,undefined);
 let result=await inbound(loaded,'1','accept');assert.match(result.text,/Accepted/);assert.equal(database.readDb().requests[0].providerId,'p1');assert.equal(database.readDb().messages.length,1);
 result=await inbound(loaded,'1','accept');assert.doesNotMatch(result.text,/<Message>/);assert.equal(database.readDb().messages.length,1);
 // Audit eviction and SQLite reopen must not lose replay protection.
 let db=database.readDb();db.audit=Array.from({length:1100},(_,i)=>({id:`audit-${i}`,action:'other'}));database.writeDb(db,{suppressPush:true});database.closeDb();delete require.cache[require.resolve('../backend/database')];database=require('../backend/database');loaded=load('live');
 addOffer(loaded.sms,'r2');result=await inbound(loaded,'1','accept');assert.doesNotMatch(result.text,/<Message>/);assert.equal(database.readDb().requests[1].providerId,undefined);
 seed();addOffer(loaded.sms);result=await inbound(loaded,'2','decline');assert.match(result.text,/Declined/);assert.equal(database.readDb().requests[0].smsOffers[0].status,'declined');
 seed();addOffer(loaded.sms);addOffer(loaded.sms,'r2');result=await inbound(loaded,'1','ambiguous');assert.match(result.text,/multiple/);assert(database.readDb().requests.every(r=>!r.providerId));
 seed();addOffer(loaded.sms);result=await inbound(loaded,'custom-stop','stop',{OptOutType:'STOP'});assert.doesNotMatch(result.text,/<Message>/);assert.equal(database.readDb().users[0].smsOptedOut,true);assert.equal(loaded.sms.smsEligible(database.readDb().users[0]),false);
 result=await inbound(loaded,'START','start',{OptOutType:'START'});assert.doesNotMatch(result.text,/<Message>/);assert.equal(database.readDb().users[0].smsOptedOut,true);
 result=await inbound(loaded,'HELP','help',{OptOutType:'HELP'});assert.doesNotMatch(result.text,/<Message>/);
 for(const body of ['STOPALL','REVOKE','OPTOUT','إلغاء']){seed();await inbound(loaded,body,'stop-'+body);assert.equal(database.readDb().users[0].smsOptedOut,true);}
 // Disabled blocks both job mutations and all application reply TwiML, but honors STOP.
 loaded=load('disabled');seed();addOffer(loaded.sms);result=await inbound(loaded,'1','disabled-accept');assert.doesNotMatch(result.text,/<Message>/);assert.equal(database.readDb().requests[0].providerId,undefined);
 result=await inbound(loaded,'STOP','disabled-stop');assert.doesNotMatch(result.text,/<Message>/);assert.equal(database.readDb().users[0].smsOptedOut,true);
 result=await inbound(loaded,'hello','unknown',{From:'+13135550124'});assert.doesNotMatch(result.text,/<Message>/);
 loaded=load('mock');seed();addOffer(loaded.sms);db=database.readDb();await loaded.bridge.deliverPrepared([{user:db.users[0],offer:db.requests[0].smsOffers[0],service:'Plumbing'}]);assert.match(database.readDb().requests[0].smsOffers[0].gatewayMessageSid,/mock-/);
 // Re-check persisted consent before dispatch, not the stale queued user object.
 const stale=database.readDb();db=database.readDb();db.users[0].smsOptedOut=true;database.writeDb(db,{suppressPush:true});await loaded.bridge.deliverPrepared([{user:stale.users[0],offer:stale.requests[0].smsOffers[0],service:'Plumbing'}]);assert.equal(database.readDb().requests[0].smsOffers[0].gatewayStatus,'skipped');
 // Exercise PostgreSQL serialization/restore using an in-memory pg client, never a server.
 const remote=new Map();let schema='';
 class FakePgClient{async connect(){}async end(){}async query(sql,values){
  if(sql.includes('CREATE TABLE')){schema=sql;return {rows:[]};}
  let match=sql.match(/^DELETE FROM (\w+)/);if(match){remote.set(match[1],[]);return {rows:[]};}
  match=sql.match(/^INSERT INTO (\w+)\(/);if(match&&match[1]!=='meta'){remote.get(match[1]).push(JSON.parse(JSON.stringify(values.at(-1))));return {rows:[]};}
  match=sql.match(/^SELECT data FROM (\w+)/);if(match)return {rows:(remote.get(match[1])||[]).map(data=>({data}))};
  return {rows:[]};
 }}
 const pgContext={module:{exports:{}},__dirname:path.join(root,'backend'),process:{env:{DATABASE_URL:'dummy'}},console,require(name){return name==='pg'?{Client:FakePgClient}:require(name);}};
 vm.runInNewContext(fs.readFileSync(path.join(root,'backend/postgres-mirror.js'),'utf8'),pgContext);
 const mirror=pgContext.module.exports;await mirror.initialize();assert.match(schema,/CREATE TABLE IF NOT EXISTS sms_receipts/);
 const snapshot=database.readDb();snapshot.smsReceipts=[{id:'receipt-hash',createdAt:new Date().toISOString()}];await mirror.persist(snapshot);
 const restored=await mirror.load();assert.equal(restored.state.schemaVersion,7);assert.equal(restored.state.smsReceipts[0].id,'receipt-hash');
 database.writeDb(restored.state,{suppressPush:true});assert.equal(database.readDb().smsReceipts[0].id,'receipt-hash');
 console.log('sms-inbound-safety-test: PASS (isolated SQLite, signed fixtures, no network)');
 }finally{database.closeDb();fs.rmSync(temp,{recursive:true,force:true});}
})().catch(e=>{console.error(e);process.exitCode=1;});
