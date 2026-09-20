'use strict';
const http=require('http'),crypto=require('crypto');
const sms=require('./sms-fallback');
const {readDb,writeDb}=require('./database');
const {currentUser,acceptanceEligibility}=require('./request-privacy');
const originalCreateServer=http.createServer.bind(http);
const SMS_CONSENT_VERSION='2026-09-19';
const PUBLIC_BASE=String(process.env.PUBLIC_API_BASE_URL||'').replace(/\/$/,'');

function json(res,code,obj){res.writeHead(code,{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'});res.end(JSON.stringify(obj));}
function twiml(res,text){if(!text||res.smsSuppressReply||sms.MODE!=='live'){res.writeHead(200,{'content-type':'text/xml; charset=utf-8','cache-control':'no-store'});return res.end('<?xml version="1.0" encoding="UTF-8"?><Response/>');}const escaped=String(text).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');res.writeHead(200,{'content-type':'text/xml; charset=utf-8','cache-control':'no-store'});res.end(`<?xml version="1.0" encoding="UTF-8"?><Response><Message>${escaped}</Message></Response>`);}
function formBody(req){return new Promise((resolve,reject)=>{let raw='',bytes=0,settled=false;req.on('data',chunk=>{if(settled)return;bytes+=chunk.length;if(bytes>65536){settled=true;const e=Error('Body too large');e.code='BODY_TOO_LARGE';reject(e);req.destroy();return;}raw+=chunk;});req.on('end',()=>{if(settled)return;settled=true;const params={};for(const [key,value] of new URLSearchParams(raw))params[key]=value;resolve(params);});req.on('error',error=>{if(!settled){settled=true;reject(error);}});});}
function notify(db,userId,title,text,meta={}){if(!userId)return;db.notifications.unshift({id:crypto.randomUUID(),userId,title:String(title).slice(0,120),text:String(text).slice(0,500),meta,read:false,createdAt:new Date().toISOString()});db.notifications=db.notifications.slice(0,5000);}
function audit(db,userId,action,meta={}){db.audit.unshift({id:crypto.randomUUID(),user:userId||null,action,meta,at:new Date().toISOString()});db.audit=db.audit.slice(0,1000);if(action==='twilio.sms.inbound'&&meta.idempotencyKey){db.smsReceipts=db.smsReceipts||[];db.smsReceipts.push({id:meta.idempotencyKey,createdAt:new Date().toISOString()});}}
function prepareOffers(request,candidates){
 if(!['live','mock'].includes(sms.MODE))return [];
 request.smsOffers=Array.isArray(request.smsOffers)?request.smsOffers:[];
 const jobs=[];
 for(const candidate of candidates){if(!sms.smsEligible(candidate.user))continue;const offer=sms.createOffer({requestId:request.id,providerId:candidate.user.id});request.smsOffers.push(offer);jobs.push({user:candidate.user,offer,service:request.service});}
 return jobs;
}
async function deliverPrepared(jobs){
 const gateway=sms.provider();
 for(const job of jobs){
  try{const state=readDb(),user=state.users.find(row=>row.id===job.user.id),offer=state.requests.flatMap(row=>row.smsOffers||[]).find(row=>row.id===job.offer.id);if(!user||!offer)continue;const result=await sms.sendJobOffer({smsProvider:gateway,...job,user,offer});const latest=readDb(),stored=latest.requests.flatMap(row=>row.smsOffers||[]).find(row=>row.id===job.offer.id);if(stored){stored.gatewayMessageSid=result.id||null;stored.gatewayStatus=result.status|| (result.skipped?'skipped':result.mock?'mock':'unknown');stored.gatewayUpdatedAt=new Date().toISOString();writeDb(latest);}console.log(JSON.stringify({event:'twilio.job_offer',offerId:job.offer.id,providerId:job.user.id,skipped:!!result.skipped,status:result.status||null,reason:result.reason||null}));}
  catch(error){console.error(JSON.stringify({event:'twilio.job_offer_failed',offerId:job.offer.id,providerId:job.user.id,status:error.status||null,code:error.code||null,message:error.message}));}
 }
}
function latestOffer(db,providerId){return (db.requests||[]).flatMap(request=>(request.smsOffers||[]).map(offer=>({request,offer}))).filter(row=>row.offer.providerId===providerId&&sms.offerActive(row.offer)).sort((a,b)=>Date.parse(b.offer.createdAt)-Date.parse(a.offer.createdAt))[0]||null;}
async function inbound(req,res,url){
 if(!PUBLIC_BASE||!process.env.TWILIO_AUTH_TOKEN)return json(res,503,{error:'SMS webhook is not configured'});
 const params=await formBody(req),signature=String(req.headers['x-twilio-signature']||''),signatureUrl=PUBLIC_BASE+url.pathname+url.search;
 if(!sms.verifyTwilioSignature({authToken:process.env.TWILIO_AUTH_TOKEN,url:signatureUrl,params,signature}))return json(res,403,{error:'Invalid Twilio signature'});
 res.smsSuppressReply=['STOP','START','HELP'].includes(params.OptOutType);
 const messageSid=String(params.MessageSid||params.SmsSid||''),key=sms.replyIdempotencyKey(messageSid),from=sms.normalizeE164(params.From),reply=res.smsSuppressReply?params.OptOutType.toLowerCase():sms.classifyReply(params.Body);
 if(!messageSid||!from)return json(res,400,{error:'Missing Twilio message identity'});
 const db=readDb();
 if((db.smsReceipts||[]).some(row=>row.id===key)||db.audit.some(row=>row.action==='twilio.sms.inbound'&&row.meta?.idempotencyKey===key))return twiml(res,'');
 const provider=db.users.find(user=>user.role==='provider'&&sms.normalizeE164(user.phone)===from);
 if(!provider){audit(db,null,'twilio.sms.inbound',{idempotencyKey:key,result:'unknown_sender'});writeDb(db);return twiml(res,'This phone is not linked to a ZOVRO provider account.');}
 if(reply==='stop'){
  provider.smsOptedOut=true;provider.smsJobAlertsOptIn=false;provider.smsConsent={...(provider.smsConsent||{}),optedOutAt:new Date().toISOString()};
  audit(db,provider.id,'twilio.sms.inbound',{idempotencyKey:key,result:'opted_out'});writeDb(db);return twiml(res,'ZOVRO job alerts are off. You will not receive more job-alert texts.');
 }
 if(reply==='start'){audit(db,provider.id,'twilio.sms.inbound',{idempotencyKey:key,result:'consent_required'});writeDb(db);return twiml(res,'Open ZOVRO and enable SMS job alerts to renew your consent.');}
 if(!['live','mock'].includes(sms.MODE)){audit(db,provider.id,'twilio.sms.inbound',{idempotencyKey:key,result:'sms_disabled'});writeDb(db);return twiml(res,'');}
 if(reply==='help'){audit(db,provider.id,'twilio.sms.inbound',{idempotencyKey:key,result:'help'});writeDb(db);return twiml(res,'ZOVRO job alerts: reply 1 to accept, 2 to decline, or STOP to opt out.');}
 const offers=(db.requests||[]).flatMap(request=>(request.smsOffers||[]).map(offer=>({request,offer}))).filter(row=>row.offer.providerId===provider.id&&sms.offerActive(row.offer));
 if(offers.length>1){audit(db,provider.id,'twilio.sms.inbound',{idempotencyKey:key,result:'ambiguous_offer'});writeDb(db);return twiml(res,'You have multiple ZOVRO offers. Open the app to choose a job.');}
 const row=offers[0]||null;
 if(!row){audit(db,provider.id,'twilio.sms.inbound',{idempotencyKey:key,result:'no_active_offer'});writeDb(db);return twiml(res,'No active ZOVRO job offer was found. Open the app for current requests.');}
 if(reply==='decline'){
  row.offer.status='declined';row.offer.repliedAt=new Date().toISOString();audit(db,provider.id,'twilio.sms.inbound',{idempotencyKey:key,result:'declined',offerId:row.offer.id,requestId:row.request.id});writeDb(db);return twiml(res,'Declined. ZOVRO will continue looking for another provider.');
 }
 if(reply!=='accept'){audit(db,provider.id,'twilio.sms.inbound',{idempotencyKey:key,result:'unknown_reply',offerId:row.offer.id});writeDb(db);return twiml(res,'Reply 1 or موافق to accept, 2 or رفض to decline, or STOP to opt out.');}
 const evaluation=sms.evaluateAcceptance({offer:row.offer,providerUser:provider,request:row.request}),location=evaluation.ok?acceptanceEligibility(db,provider,row.request):evaluation;
 if(!evaluation.ok||!location.ok){row.offer.status='rejected';row.offer.repliedAt=new Date().toISOString();audit(db,provider.id,'twilio.sms.inbound',{idempotencyKey:key,result:evaluation.reason||location.reason,offerId:row.offer.id,requestId:row.request.id});writeDb(db);return twiml(res,'This job is no longer available. Open ZOVRO for current requests.');}
 const at=new Date().toISOString();row.request.providerId=provider.id;row.request.status='Accepted';row.request.acceptedAt=at;for(const offer of row.request.smsOffers||[])if(offer.status==='pending'){offer.status=offer.id===row.offer.id?'accepted':'closed';offer.repliedAt=offer.id===row.offer.id?at:offer.repliedAt;}
 db.messages.push({id:crypto.randomUUID(),requestId:row.request.id,userId:provider.id,from:'provider',text:'I accepted your request by verified ZOVRO SMS and will keep you updated in the app.',createdAt:at});
 notify(db,row.request.customerId,'Provider accepted your request',`${provider.name||'A provider'} accepted your ${row.request.service} request.`,{requestId:row.request.id,type:'accepted'});
 audit(db,provider.id,'twilio.sms.inbound',{idempotencyKey:key,result:'accepted',offerId:row.offer.id,requestId:row.request.id});writeDb(db);return twiml(res,'Accepted. Open ZOVRO to view the job details and contact the customer.');
}
async function router(req,res,next){
 let url;try{url=new URL(req.url||'/','http://localhost');}catch{return next(req,res);}
 if(req.method==='POST'&&url.pathname==='/api/webhooks/twilio/sms'){try{return await inbound(req,res,url);}catch(error){if(error.code==='BODY_TOO_LARGE')return json(res,413,{error:'Request too large'});console.error(JSON.stringify({event:'twilio.webhook_error',message:error.message}));return json(res,500,{error:'Server error'});}}
 if(url.pathname==='/api/me/sms-preferences'){
  const actor=currentUser(req);if(!actor)return json(res,401,{error:'Authentication required'});if(actor.user.role!=='provider')return json(res,403,{error:'Provider role required'});
  if(req.method==='GET')return json(res,200,{enabled:sms.smsEligible(actor.user),phoneVerified:actor.user.phoneVerified===true,optedOut:actor.user.smsOptedOut===true,policyVersion:SMS_CONSENT_VERSION});
  if(req.method==='PATCH'){
   let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>65536)return json(res,413,{error:'Request too large'});}let body;try{body=raw?JSON.parse(raw):{};}catch{return json(res,400,{error:'Invalid JSON'});}if(typeof body.enabled!=='boolean')return json(res,400,{error:'enabled must be true or false'});
   const db=readDb(),user=db.users.find(row=>row.id===actor.user.id);if(!user)return json(res,404,{error:'User not found'});if(body.enabled&&user.phoneVerified!==true)return json(res,409,{error:'Verify your phone before enabling SMS job alerts'});const at=new Date().toISOString();user.smsJobAlertsOptIn=body.enabled;user.smsOptedOut=!body.enabled;user.smsConsent=body.enabled?{consentedAt:at,policyVersion:SMS_CONSENT_VERSION,optedOutAt:null}:{...(user.smsConsent||{}),optedOutAt:at,policyVersion:SMS_CONSENT_VERSION};audit(db,user.id,'sms.preferences',{enabled:body.enabled,policyVersion:SMS_CONSENT_VERSION});writeDb(db);return json(res,200,{enabled:body.enabled,phoneVerified:user.phoneVerified===true,optedOut:user.smsOptedOut,policyVersion:SMS_CONSENT_VERSION});
  }
  return json(res,405,{error:'Method not allowed'});
 }
 return next(req,res);
}
http.createServer=function(handler,...args){return originalCreateServer((req,res)=>router(req,res,handler),...args);};
module.exports={SMS_CONSENT_VERSION,prepareOffers,deliverPrepared,latestOffer,router};
