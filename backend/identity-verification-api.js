'use strict';
// Government ID check. Identity images and ID numbers go directly to Stripe Identity,
// never into ZOVRO's JSON database, application logs, or provider profiles.
const http=require('node:http');
const crypto=require('node:crypto');
const {readDb,writeDb}=require('./database');
const {currentUser}=require('./request-privacy');
const {encryptSensitive}=require('./profile-privacy');
const baseCreateServer=http.createServer.bind(http);
const PROFILE_KEY=String(process.env.ZOVRO_PROFILE_ENCRYPTION_KEY||'');
const STRIPE_KEY=String(process.env.STRIPE_SECRET_KEY||'');
const isProduction=process.env.NODE_ENV==='production'||String(process.env.RENDER||'').toLowerCase()==='true'||Boolean(process.env.RENDER_SERVICE_ID);
const safeState=u=>({
 status:u.identityVerification?.status==='verified'&&!eligible(u)?'reverification_required':u.identityVerification?.status||'not_started',
 verified:eligible(u),
 legalNameProvided:!!u.identityVerification?.legalNameEncrypted,
 verifiedAt:u.identityVerification?.verifiedAt||null,
 canWork:eligible(u),
 configured:/^sk_live_[A-Za-z0-9]+/.test(STRIPE_KEY)
});
function eligible(u){return !!(u&&u.role==='provider'&&u.identityVerified===true&&u.identityAgeConfirmed===true&&u.identityVerification?.status==='verified'&&u.identityVerification?.faceVerifiedLive===true)}
function legalName(v){const name=String(v||'').trim().replace(/\s+/g,' ');return name.length>=5&&name.length<=120&&name.split(' ').length>=2?name:null}
function normalizedName(s){return String(s||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^\p{L}\p{N} ]/gu,' ').toLocaleLowerCase('en').replace(/\s+/g,' ').trim()}
function nameProof(value){const canonical=normalizedName(value).split(' ').filter(Boolean).sort().join(' ');return crypto.createHmac('sha256',PROFILE_KEY).update(canonical).digest('hex')}
function nameMatches(inputProof,output){const name=[output?.first_name,output?.last_name].filter(Boolean).join(' ');if(!/^[a-f0-9]{64}$/.test(String(inputProof||''))||normalizedName(name).split(' ').length<2)return false;const x=Buffer.from(inputProof,'hex'),y=Buffer.from(nameProof(name),'hex');return crypto.timingSafeEqual(x,y)}
function adultDob(value,now=new Date()){const year=Number(value?.year),month=Number(value?.month),day=Number(value?.day);if(!Number.isInteger(year)||!Number.isInteger(month)||!Number.isInteger(day)||year<1900||month<1||month>12||day<1||day>31)return false;const birthday=new Date(Date.UTC(year,month-1,day));if(birthday.getUTCFullYear()!==year||birthday.getUTCMonth()!==month-1||birthday.getUTCDate()!==day)return false;let age=now.getUTCFullYear()-year;if((now.getUTCMonth()+1)<month||((now.getUTCMonth()+1)===month&&now.getUTCDate()<day))age--;return age>=18&&age<125}
function json(res,status,data){if(res.headersSent)return;res.writeHead(status,{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff','referrer-policy':'no-referrer'});res.end(JSON.stringify(data))}
function requestBody(req){return new Promise((resolve,reject)=>{let data='',bytes=0,done=false;req.on('data',chunk=>{bytes+=chunk.length;if(bytes>5000){done=true;reject(new Error('Request too large'));req.resume();return}if(!done)data+=chunk});req.on('end',()=>{if(done)return;try{resolve(data?JSON.parse(data):{})}catch{reject(new Error('Invalid request'))}});req.on('error',reject)})}
async function stripe(method,path,params,idempotency){
 if(!/^sk_live_[A-Za-z0-9]+/.test(STRIPE_KEY))throw new Error('Government ID verification is not configured yet');
 const headers={authorization:'Bearer '+STRIPE_KEY};
 let url='https://api.stripe.com/v1'+path;
 let body;
 if(method==='POST'){
  headers['content-type']='application/x-www-form-urlencoded';
  if(idempotency)headers['idempotency-key']=idempotency;
  body=new URLSearchParams(params).toString();
 }else if(params){url+='?'+new URLSearchParams(params).toString()}
 const response=await fetch(url,{method,headers,body,signal:AbortSignal.timeout(12000)});
 const result=await response.json().catch(()=>({}));
 if(!response.ok)throw new Error('Identity verification service is currently unavailable');
 return result;
}
function latest(db,actor){return(db.users||[]).find(x=>x.id===actor.user.id&&(x.accountStatus||'active')==='active')}
async function refresh(u,db){
 const state=u.identityVerification||{},sessionId=state.sessionId;
 if(!/^vs_[A-Za-z0-9]+$/.test(String(sessionId||'')))return safeState(u);
 const data=await stripe('GET','/identity/verification_sessions/'+encodeURIComponent(sessionId),[['expand[]','verified_outputs']]);
 if(data.id!==sessionId||data.type!=='document'||data.client_reference_id!==u.id||data.metadata?.zovro_provider_id!==u.id)throw new Error('Identity verification could not be matched to your account');
 if(data.livemode!==true)throw new Error('Live identity verification is required');
 if(data.status==='verified'){
  if(data.options?.document?.require_matching_selfie===true&&data.options?.document?.require_live_capture===true&&adultDob(data.verified_outputs?.dob)&&nameMatches(state.legalNameProof,data.verified_outputs)){
   u.identityVerified=true;u.identityAgeConfirmed=true;state.status='verified';state.faceVerifiedLive=true;state.verifiedAt=new Date().toISOString();
  }else{
   u.identityVerified=false;u.identityAgeConfirmed=false;state.status='manual_review';state.faceVerifiedLive=false;state.reviewReason='face_capture_or_identity_check_incomplete';
  }
 }else if(['requires_input','processing','canceled'].includes(data.status)){
  u.identityVerified=false;u.identityAgeConfirmed=false;state.status=data.status;state.faceVerifiedLive=false;
 }
 state.checkedAt=new Date().toISOString();u.identityVerification=state;
 writeDb(db);
 return safeState(u);
}
async function route(req,res,next){
 const path=new URL(req.url||'/','http://localhost').pathname;
 if(!path.startsWith('/api/provider/identity'))return next(req,res);
 if(!['GET','POST'].includes(req.method))return json(res,405,{error:'Method not allowed'});
 const actor=currentUser(req);
 if(!actor)return json(res,401,{error:'Sign in to verify your identity'});
 const db=readDb(),u=latest(db,actor);
 if(!u||u.role!=='provider')return json(res,403,{error:'Provider account required'});
 try{
  if(path==='/api/provider/identity'&&req.method==='GET')return json(res,200,{identity:safeState(u)});
  if(path==='/api/provider/identity/check'&&req.method==='POST')return json(res,200,{identity:await refresh(u,db)});
  if(path==='/api/provider/identity/start'&&req.method==='POST'){
   if(eligible(u))return json(res,200,{identity:safeState(u)});
   const b=await requestBody(req);
   if(b.consent!==true)return json(res,400,{error:'Consent to the secure identity check is required'});
   const name=legalName(b.legalName);
   if(!name)return json(res,400,{error:'Enter your full legal first and last name exactly as shown on your ID'});
   if(Buffer.byteLength(PROFILE_KEY)<32)return json(res,503,{error:'Secure verification configuration is unavailable'});
   const old=u.identityVerification||{};
   if(old.sessionId&&['requires_input','processing'].includes(old.status)&&old.legalNameProof===nameProof(name)){
    const s=await stripe('GET','/identity/verification_sessions/'+encodeURIComponent(old.sessionId));
    if(s.id===old.sessionId&&s.client_reference_id===u.id&&s.status==='requires_input'&&/^https:\/\/verify\.stripe\.com\//.test(s.url||'')){
     return json(res,200,{identity:safeState(u),verificationUrl:s.url});
    }
    if(s.status==='processing')return json(res,409,{error:'Your ID is still being reviewed. Check its status before retrying.'});
   }
   if(old.createdAt&&Date.now()-Date.parse(old.createdAt)<60000)return json(res,429,{error:'Please wait before restarting verification'});
   const form={
    type:'document',
    client_reference_id:u.id,
    'metadata[zovro_provider_id]':u.id,
    'options[document][require_matching_selfie]':'true',
    'options[document][require_live_capture]':'true',
    'options[document][allowed_types][0]':'driving_license',
    'options[document][allowed_types][1]':'id_card',
    'options[document][allowed_types][2]':'passport',
    return_url:String(process.env.ZOVRO_IDENTITY_RETURN_URL||'https://zovro-web.onrender.com/?identity_verification=return#profile')
   };
   const session=await stripe('POST','/identity/verification_sessions',form,'zovro-identity-'+u.id+'-'+Date.now());
   if(!/^vs_[A-Za-z0-9]+$/.test(session?.id||'')||session.client_reference_id!==u.id||!/^https:\/\/verify\.stripe\.com\//.test(session.url||''))throw new Error('Secure verification link was not returned');
   u.identityVerified=false;u.identityAgeConfirmed=false;
   u.identityVerification={provider:'stripe',sessionId:session.id,status:'requires_input',legalNameEncrypted:encryptSensitive(name,PROFILE_KEY),legalNameProof:nameProof(name),createdAt:new Date().toISOString()};
   writeDb(db);
   return json(res,201,{identity:safeState(u),verificationUrl:session.url});
  }
  return json(res,404,{error:'Not found'});
 }catch(e){return json(res,503,{error:e.message==='Invalid request'||e.message==='Request too large'?e.message:'Identity verification is temporarily unavailable. Please try again.'})}
}
http.createServer=function(handler,...args){return baseCreateServer((req,res)=>route(req,res,handler),...args)};
module.exports={eligible,adultDob,nameMatches,safeState};
