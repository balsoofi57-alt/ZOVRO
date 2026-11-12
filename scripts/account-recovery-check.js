'use strict';
const assert=require('node:assert/strict');
const {spawn}=require('node:child_process');
const {once}=require('node:events');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const data=fs.mkdtempSync(path.join(os.tmpdir(),'zovro-recovery-'));
const port=18948;
const capture=path.join(data,'recovery-sms.txt');
const server=spawn(process.execPath,['-r','./scripts/recovery-sms-stub.js','backend/server.js'],{
 cwd:root,env:{...process.env,NODE_ENV:'development',PORT:String(port),ZOVRO_DATA_DIR:data,
 ZOVRO_DB_MIRROR_MODE:'off',DATABASE_URL:'',ZOVRO_SECRET:'local-recovery-test-secret-is-not-production',
 ZOVRO_RECOVERY_SMS_CAPTURE_PATH:capture},stdio:['ignore','pipe','pipe']
});
let logs='';server.stdout.on('data',x=>logs+=x);server.stderr.on('data',x=>logs+=x);
const base='http://127.0.0.1:'+port;
async function post(endpoint,data){
 return fetch(base+'/api/auth/'+endpoint,{method:'POST',
 headers:{'content-type':'application/json','x-zovro-lawful-use-attestation':'accepted-v1'},
 body:JSON.stringify(data)});
}
(async()=>{
 try{
  let ready=false;
  for(let i=0;i<90;i++){try{ready=(await fetch(base+'/api/health')).ok;if(ready)break;}catch{}await new Promise(r=>setTimeout(r,100))}
  assert(ready,logs);
  let response=await fetch(base+'/api/auth/recovery/status');
  assert.equal(response.status,200);
  assert.equal((await response.json()).available,true);
  const original={name:'Recovery Example',phone:'+13135550195',email:'recover@example.com',role:'customer',password:'OriginalPass123'};
  response=await post('register',original);assert.equal(response.status,201);const {token}=await response.json();
  response=await post('login',{identifier:'RECOVER@EXAMPLE.COM',password:original.password});
  assert.equal(response.status,200,'Known unique email should work as login');
  response=await post('forgot-password',{identifier:'recover@example.com'});
  assert.equal(response.status,200);
  const start=await response.json();
  assert.match(start.challenge,/^[0-9a-f-]{36}$/i);
  const message=fs.readFileSync(capture,'utf8');
  const match=message.match(/(\d{6})/);assert(match,'SMS code should be captured by test stub');
  const code=match[1],wrong=code==='000000'?'000001':'000000';
  response=await post('reset-password',{challenge:start.challenge,code:wrong,newPassword:'ChangedPass123'});
  assert.equal(response.status,400,'An incorrect code is rejected');
  response=await post('reset-password',{challenge:start.challenge,code,newPassword:'ChangedPass123'});
  assert.equal(response.status,200,'Correct code resets password');
  response=await post('reset-password',{challenge:start.challenge,code,newPassword:'AnotherPass123'});
  assert.equal(response.status,400,'A challenge cannot be reused');
  response=await fetch(base+'/api/me',{headers:{authorization:'Bearer '+token}});
  assert.equal(response.status,401,'Existing sessions must be revoked');
  assert.equal((await post('login',{phone:original.phone,password:original.password})).status,401);
  assert.equal((await post('login',{identifier:'recover@example.com',password:'ChangedPass123'})).status,200);
  response=await post('register',{...original,phone:'+13135550196',password:'AnotherPass123'});
  assert.equal(response.status,201);
  assert.equal((await post('login',{identifier:'recover@example.com',password:'ChangedPass123'})).status,401,'Shared legacy emails must not select a random account');
  fs.unlinkSync(capture);
  response=await post('forgot-password',{identifier:'nonexistent@example.com'});
  assert.equal(response.status,200,'Unknown accounts receive the same public start response');
  assert.equal(fs.existsSync(capture),false,'No SMS for unknown accounts');
  console.log('Account recovery: email sign-in, OTP reset, wrong/reused codes, session revocation and ambiguous emails passed.');
 } finally {
  const exited=once(server,'exit');server.kill('SIGTERM');await exited;
  fs.rmSync(data,{recursive:true,force:true});
 }
})().catch(e=>{console.error(e);console.error(logs.slice(-1200));process.exitCode=1});
