'use strict';
const {spawn}=require('child_process'),crypto=require('crypto'),path=require('path');
const backend=path.resolve(__dirname,'../backend'),port=18923,base=`http://127.0.0.1:${port}`,sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const env={...process.env,NODE_ENV:'production',PORT:String(port),ZOVRO_SECRET:crypto.randomBytes(32).toString('hex'),ZOVRO_OPS_TOKEN:crypto.randomBytes(24).toString('hex'),ZOVRO_ALLOWED_ORIGINS:'capacitor://localhost,http://localhost'};
 const child=spawn(process.execPath,['server.js'],{cwd:backend,env,stdio:['ignore','pipe','pipe']});
 try{
  for(let i=0;i<60;i++){try{if((await fetch(base+'/api/health')).ok)break}catch{}await sleep(100)}
  let r=await fetch(base+'/api/payments/config',{headers:{origin:'capacitor://localhost'}});
  if(!r.ok)throw new Error('Payment config did not respond');
  if(r.headers.get('access-control-allow-origin')!=='capacitor://localhost')throw new Error('Capacitor CORS header missing');
  if(!r.headers.get('strict-transport-security'))throw new Error('HSTS missing');
  if(!r.headers.get('content-security-policy'))throw new Error('CSP missing');
  if(r.headers.get('cross-origin-resource-policy')!=='cross-origin')throw new Error('CORP blocks mobile API access');
  r=await fetch(base+'/api/payments/config',{method:'OPTIONS',headers:{origin:'capacitor://localhost','access-control-request-method':'GET'}});
  if(r.status!==204||r.headers.get('access-control-allow-origin')!=='capacitor://localhost')throw new Error('CORS preflight failed');
  r=await fetch(base+'/api/payments/config',{headers:{origin:'https://evil.example'}});
  if(r.headers.get('access-control-allow-origin'))throw new Error('Untrusted origin was allowed');
  console.log('ZOVRO wrapper CORS/security check passed.');
 }finally{child.kill('SIGTERM');await sleep(200)}
})().catch(e=>{console.error(e.stack||e);process.exitCode=1});
