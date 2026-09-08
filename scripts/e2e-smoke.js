'use strict';

const assert=require('assert/strict');
const fs=require('fs');
const os=require('os');
const path=require('path');
const {spawn}=require('child_process');

const root=path.resolve(__dirname,'..');
const dataDir=fs.mkdtempSync(path.join(os.tmpdir(),'zovro-e2e-'));
const port=18000+(process.pid%10000);
const base=`http://127.0.0.1:${port}`;
const server=spawn(process.execPath,['backend/server.js'],{
 cwd:root,
 env:{...process.env,NODE_ENV:'production',PORT:String(port),ZOVRO_DATA_DIR:dataDir,ZOVRO_SECRET:'e2e-secret-123456789012345678901234567890',ZOVRO_OPS_TOKEN:'e2e-ops-123456789012345678901234',ZOVRO_ALLOWED_ORIGINS:'https://localhost'},
 stdio:['ignore','ignore','inherit']
});

async function request(url,{token,body,headers={},...options}={}){
 const response=await fetch(base+url,{...options,headers:{...(body===undefined?{}:{'content-type':'application/json'}),...(token?{authorization:`Bearer ${token}`} :{}),...headers},body:body===undefined?undefined:JSON.stringify(body)});
 const json=await response.json().catch(()=>null);
 return {response,json};
}
async function expect(url,status,options){const result=await request(url,options);assert.equal(result.response.status,status,`${options?.method||'GET'} ${url}`);return result.json}
async function waitReady(){for(let i=0;i<50;i++){try{const r=await fetch(base+'/api/ready');if(r.ok)return}catch{}await new Promise(resolve=>setTimeout(resolve,100))}throw new Error('Server did not become ready')}

(async()=>{
 try{
  await waitReady();
  const health=await expect('/api/health',200);assert.equal(health.database,'sqlite');
  const ready=await expect('/api/ready',200);assert.equal(ready.ready,true);
  await expect('/api/health',403,{headers:{origin:'https://evil.example'}});
  const invalid=await fetch(base+'/api/auth/login',{method:'POST',headers:{'content-type':'application/json'},body:'{bad'});assert.equal(invalid.status,400);

  const customer=await expect('/api/auth/register',201,{method:'POST',body:{name:'E2E Customer',phone:'+13135550101',email:'customer@example.test',password:'Password1234',role:'customer'}});
  const provider=await expect('/api/auth/register',201,{method:'POST',body:{name:'E2E Provider',phone:'+13135550102',email:'provider@example.test',password:'Password1234',role:'provider',service:'Roadside Assistance'}});
  await expect('/api/auth/register',409,{method:'POST',body:{name:'Duplicate',phone:'+13135550101',password:'Password1234'}});
  await expect('/api/auth/login',401,{method:'POST',body:{phone:'+13135550101',password:'wrong-password'}});
  await expect('/api/provider/location',200,{method:'POST',token:provider.token,body:{lat:42.3223,lng:-83.1763}});
  const nearby=await expect('/api/providers/nearby?lat=42.3223&lng=-83.1763&service=Roadside%20Assistance',200,{token:customer.token});assert.equal(nearby.providers.length,1);
  const created=await expect('/api/requests',201,{method:'POST',token:customer.token,body:{service:'Roadside Assistance',details:'E2E tire help',urgent:true,location:{lat:42.3223,lng:-83.1763}}});
  await expect(`/api/requests/${created.request.id}/accept`,200,{method:'POST',token:provider.token,body:{}});
  for(const status of ['On the way','Arrived','In progress','Completed'])await expect(`/api/requests/${created.request.id}/status`,200,{method:'POST',token:provider.token,body:{status}});
  await expect(`/api/requests/${created.request.id}/messages`,201,{method:'POST',token:customer.token,body:{text:'E2E message'}});
  await expect(`/api/requests/${created.request.id}/rating`,200,{method:'POST',token:customer.token,body:{stars:5}});
  await expect('/api/me',200,{token:customer.token});
  await expect('/api/me',200,{method:'DELETE',token:customer.token,body:{confirm:'DELETE'}});
  await expect('/api/me',401,{token:customer.token});
  console.log('PASS ZOVRO local end-to-end smoke test');
 }finally{
  server.kill('SIGTERM');
  await new Promise(resolve=>server.once('exit',resolve));
  fs.rmSync(dataDir,{recursive:true,force:true});
 }
})().catch(error=>{console.error(error);process.exitCode=1});
