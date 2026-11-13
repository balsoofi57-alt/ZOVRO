'use strict';
// Synthetic API contract tests. No network traffic, real identity documents, or secrets.
const assert=require('node:assert/strict');
const test=require('node:test');
const fs=require('node:fs');
const vm=require('node:vm');
const crypto=require('node:crypto');
const {EventEmitter}=require('node:events');
const source=fs.readFileSync('backend/identity-verification-api.js','utf8');
const clone=o=>JSON.parse(JSON.stringify(o));

function harness({strict=false,minor=false,restricted=true,preapproved=false}={}){
 const env={
  STRIPE_SECRET_KEY:'sk_live_synthetictestcredential',
  ZOVRO_PROFILE_ENCRYPTION_KEY:'unit-test-encryption-key-over-32-bytes-long',
  ZOVRO_STRIPE_IDENTITY_RESULTS_KEY:restricted?'rk_live_synthetictestcredential':''
 };
 const user={id:'provider_fixture',role:'provider',identityVerified:preapproved,
  identityAgeConfirmed:preapproved,identityVerification:preapproved?{status:'verified',faceVerifiedLive:false}:null};
 const db={users:[user]};
 let handler,session;
 const calls=[];
 const fakeHttp={createServer(fn){handler=fn;return {}}};
 const policy={
  liveFaceRequired:()=>strict,
  canProviderWork:u=>u?.identityVerified===true&&u?.identityAgeConfirmed===true&&u?.identityVerification?.status==='verified'&&(!strict||u?.identityVerification?.faceVerifiedLive===true)
 };
 const mod={exports:{}};
 async function fakeFetch(url,options={}){
  const path=new URL(url).pathname;
  const method=options.method||'GET';
  calls.push({method,path,auth:options.headers?.authorization,body:options.body});
  if(method==='POST'){
   assert.equal(path,'/v1/identity/verification_sessions');
   const params=new URLSearchParams(options.body);
   session={
    id:'vs_synthetic123',client_reference_id:'provider_fixture',
    metadata:{zovro_provider_id:'provider_fixture'},
    type:'document',status:'requires_input',livemode:true,
    url:'https://verify.stripe.com/synthetic',
    options:{document:{
     require_matching_selfie:params.get('options[document][require_matching_selfie]')==='true',
     require_live_capture:params.get('options[document][require_live_capture]')==='true'
    }}
   };
   return {ok:true,json:async()=>clone(session)};
  }
  if(method==='GET'&&path==='/v1/identity/verification_sessions/vs_synthetic123'){
   return {ok:true,json:async()=>clone(session)};
  }
  throw new Error('Unexpected external URL in test '+path);
 }
 const requireMock=name=>{
  if(name==='node:http')return fakeHttp;
  if(name==='node:crypto')return crypto;
  if(name==='./database')return {readDb:()=>db,writeDb:()=>{}};
  if(name==='./request-privacy')return {currentUser:()=>({user})};
  if(name==='./profile-privacy')return {encryptSensitive:()=>'encrypted_synthetic'};
  if(name==='./provider-live-face-policy')return policy;
  throw new Error('Unexpected dependency '+name);
 };
 vm.runInNewContext(source,{
  require:requireMock,module:mod,process:{env},fetch:fakeFetch,
  URL,URLSearchParams,Buffer,AbortSignal,Date,console
 },{filename:'identity-verification-api.js'});
 fakeHttp.createServer((req,res)=>{res.writeHead(404);res.end('{"error":"Not found"}')});
 async function send(method,path,body={}){
  const req=new EventEmitter();
  req.method=method;req.url=path;req.headers={};
  let responseText='',status=0;
  const res={headersSent:false,
   writeHead(code){status=code;this.headersSent=true;return this},
   end(text=''){responseText=String(text);return this}
  };
  const promise=handler(req,res);
  if(method==='POST'){
   req.emit('data',Buffer.from(JSON.stringify(body)));
   req.emit('end');
  }
  await promise;
  return {status,body:responseText?JSON.parse(responseText):{}};
 }
 function markVerified(){
  assert(session,'Verification session was not created');
  session.status='verified';
  session.verified_outputs={first_name:'Test',last_name:'Provider',
   dob:minor?{year:2009,month:12,day:1}:{year:1990,month:1,day:1}};
 }
 return {user,db,calls,send,markVerified,session:()=>session};
}

test('default-off still starts government-ID check and approves a consenting adult',async()=>{
 const h=harness();
 let status=await h.send('GET','/api/provider/identity');
 assert.equal(status.status,200);
 assert.equal(status.body.identity.enforced,false);
 assert.equal(status.body.identity.configured,true);
 const start=await h.send('POST','/api/provider/identity/start',{consent:true,legalName:'Test Provider'});
 assert.equal(start.status,201);
 assert.equal(start.body.verificationUrl,'https://verify.stripe.com/synthetic');
 const form=new URLSearchParams(h.calls.find(c=>c.method==='POST').body);
 assert.equal(form.get('options[document][require_matching_selfie]'),'true');
 assert.equal(form.has('options[document][require_live_capture]'),false);
 h.markVerified();
 const checked=await h.send('POST','/api/provider/identity/check');
 assert.equal(checked.status,200);
 assert.equal(checked.body.identity.canWork,true);
 assert.equal(h.user.identityVerification.faceVerifiedLive,false);
 assert.equal(h.calls.filter(c=>c.method==='GET').at(-1).auth,'Bearer sk_live_synthetictestcredential');
});

test('default-off refuses a minor even with a completed ID check',async()=>{
 const h=harness({minor:true});
 assert.equal((await h.send('POST','/api/provider/identity/start',{consent:true,legalName:'Test Provider'})).status,201);
 h.markVerified();
 const result=await h.send('POST','/api/provider/identity/check');
 assert.equal(result.body.identity.canWork,false);
 assert.equal(h.user.identityVerification.status,'manual_review');
});

test('strict-on requires real camera capture, matching selfie, and restricted DOB results',async()=>{
 const h=harness({strict:true});
 const start=await h.send('POST','/api/provider/identity/start',{consent:true,legalName:'Test Provider'});
 assert.equal(start.status,201);
 const form=new URLSearchParams(h.calls.find(c=>c.method==='POST').body);
 assert.equal(form.get('options[document][require_live_capture]'),'true');
 assert.equal(form.get('options[document][require_matching_selfie]'),'true');
 h.markVerified();
 const result=await h.send('POST','/api/provider/identity/check');
 assert.equal(result.status,200);
 assert.equal(result.body.identity.enforced,true);
 assert.equal(result.body.identity.canWork,true);
 assert.equal(h.user.identityVerification.faceVerifiedLive,true);
 assert.equal(h.calls.filter(c=>c.method==='GET').at(-1).auth,'Bearer rk_live_synthetictestcredential');
});

test('strict-on blocks previous approval without live-face proof',async()=>{
 const h=harness({strict:true,preapproved:true});
 const result=await h.send('GET','/api/provider/identity');
 assert.equal(result.body.identity.canWork,false);
 assert.equal(result.body.identity.status,'reverification_required');
});

test('default-off retains eligibility for existing officially approved providers',async()=>{
 const h=harness({preapproved:true});
 const result=await h.send('GET','/api/provider/identity');
 assert.equal(result.body.identity.canWork,true);
 assert.equal(result.body.identity.enforced,false);
});

test('strict-on does not start paid checks with missing restricted results permission',async()=>{
 const h=harness({strict:true,restricted:false});
 assert.equal((await h.send('GET','/api/provider/identity')).body.identity.configured,false);
 const result=await h.send('POST','/api/provider/identity/start',{consent:true,legalName:'Test Provider'});
 assert.equal(result.status,503);
 assert.equal(h.calls.length,0);
});

test('consent is required before any Stripe verification session is created',async()=>{
 const h=harness();
 const result=await h.send('POST','/api/provider/identity/start',{consent:false,legalName:'Test Provider'});
 assert.equal(result.status,400);
 assert.equal(h.calls.length,0);
});
