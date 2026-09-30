'use strict';
const assert = require('node:assert/strict');
const {spawn} = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {once} = require('node:events');
const root = path.resolve(__dirname, '..');
const data = fs.mkdtempSync(path.join(os.tmpdir(), 'zovro-password-'));
const port = 18939;
const server = spawn(process.execPath, ['backend/server.js'], {cwd:root, env:{...process.env,NODE_ENV:'development',PORT:String(port),ZOVRO_DATA_DIR:data,ZOVRO_DB_MIRROR_MODE:'off',DATABASE_URL:''},stdio:['ignore','pipe','pipe']});
let logs='';server.stdout.on('data',x=>logs+=x);server.stderr.on('data',x=>logs+=x);
async function request(route, body, token) {
 return fetch(`http://127.0.0.1:${port}/api/auth/${route}`, {method:'POST',headers:{'content-type':'application/json','x-zovro-terms-version':'2026-09-27','x-zovro-privacy-version':'2026-09-22','x-zovro-lawful-use-attestation':'accepted-v1',...(token?{authorization:`Bearer ${token}`}:{})},body:JSON.stringify(body)});
}
(async()=>{
 try {
  let ready=false;
  for(let i=0;i<60;i++){try{ready=(await fetch(`http://127.0.0.1:${port}/api/health`)).ok;if(ready)break;}catch{}await new Promise(r=>setTimeout(r,100));}
  assert(ready,logs);
  const user={name:'Password Policy Test',phone:'+13135550193',email:'test@example.com',role:'customer'};
  for(const password of ['Abcd123','abcdefgh','12345678','A1'+'a'.repeat(127)]){
   assert.equal((await request('register',{...user,password})).status,400);
  }
  const registered=await request('register',{...user,password:'Abcd1234'});
  assert.equal(registered.status,201);const {token}=await registered.json();
  assert.equal((await request('login',{phone:user.phone,password:'Abcd1234'})).status,200);
  assert.equal((await request('password',{currentPassword:'Abcd1234',newPassword:'Abcd123'},token)).status,400);
  assert.equal((await request('password',{currentPassword:'Abcd1234',newPassword:'Efgh5678'},token)).status,200);
  assert.equal((await request('login',{phone:user.phone,password:'Abcd1234'})).status,401);
  assert.equal((await request('login',{phone:user.phone,password:'Efgh5678'})).status,200);
  assert.equal((await request('register',{...user,phone:'+13135550194',password:'LongerPassword123'})).status,201);
  console.log('Password policy: 8-character registration, login and change passed; short, letters-only, numbers-only and oversized values rejected; longer passwords accepted.');
 } finally {const exited=once(server,'exit');server.kill('SIGTERM');await exited;fs.rmSync(data,{recursive:true,force:true});}
})().catch(e=>{console.error(e);process.exitCode=1;});
