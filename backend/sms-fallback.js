'use strict';
const crypto=require('crypto');

const MODE=String(process.env.ZOVRO_SMS_MODE||'disabled').trim().toLowerCase();
const OFFER_TTL_MS=Math.max(60000,Number(process.env.ZOVRO_SMS_OFFER_TTL_MS||300000));
const ACCEPT=new Set(['1','yes','accept','موافق','نعم']);
const DECLINE=new Set(['2','no','decline','رفض','لا','لا أريد']);
const STOP=new Set(['stop','stopall','revoke','optout','unsubscribe','cancel','end','quit','إيقاف','الغاء','إلغاء']);
const START=new Set(['start','unstop']);
const HELP=new Set(['help','مساعدة']);

function normalizeReply(value){return String(value||'').normalize('NFKC').trim().replace(/\s+/g,' ').toLowerCase();}
function classifyReply(value){const v=normalizeReply(value);if(ACCEPT.has(v))return 'accept';if(DECLINE.has(v))return 'decline';if(STOP.has(v))return 'stop';if(HELP.has(v))return 'help';if(START.has(v))return 'start';return 'unknown';}
function normalizeE164(value){const v=String(value||'').trim().replace(/[\s().-]/g,'');return /^\+[1-9]\d{7,14}$/.test(v)?v:null;}
function maskPhone(value){const p=normalizeE164(value);return p?`***${p.slice(-4)}`:'[redacted-phone]';}
function configured(){return /^AC[0-9a-f]{32}$/i.test(String(process.env.TWILIO_ACCOUNT_SID||''))&&String(process.env.TWILIO_AUTH_TOKEN||'').length>=20&&/^MG[0-9a-f]{32}$/i.test(String(process.env.TWILIO_MESSAGING_SERVICE_SID||''));}
function smsEligible(user,now=Date.now()){
 if(!user||user.role!=='provider'||(user.accountStatus||'active')!=='active'||user.availability===false||user.phoneVerified!==true||!normalizeE164(user.phone))return false;
 if(user.smsOptedOut===true)return false;
 const consent=user.smsConsent||{};
 const legacyOptIn=user.smsJobAlertsOptIn===true;
 const recordedOptIn=Boolean(consent.consentedAt&&consent.policyVersion&&!consent.optedOutAt&&(!consent.expiresAt||Date.parse(consent.expiresAt)>now));
 return legacyOptIn||recordedOptIn;
}
function createOffer({requestId,providerId,now=Date.now()}){if(!requestId||!providerId)throw Error('requestId and providerId are required');return {id:crypto.randomUUID(),requestId:String(requestId),providerId:String(providerId),status:'pending',createdAt:new Date(now).toISOString(),expiresAt:new Date(now+OFFER_TTL_MS).toISOString()};}
function offerActive(offer,now=Date.now()){return Boolean(offer&&offer.status==='pending'&&Date.parse(offer.expiresAt)>now);}
function messageForOffer({service='service request'}={}){const s=String(service).replace(/[\r\n]/g,' ').slice(0,60);return `ZOVRO: New ${s} job available. Reply 1 or موافق to accept, 2 or رفض to decline. Reply STOP to opt out.`;}
function safeEqual(a,b){const aa=Buffer.from(String(a||'')),bb=Buffer.from(String(b||''));return aa.length===bb.length&&crypto.timingSafeEqual(aa,bb);}
function twilioSignature(authToken,url,params={}){const payload=String(url)+Object.keys(params).sort().map(k=>k+String(params[k]??'')).join('');return crypto.createHmac('sha1',String(authToken)).update(payload,'utf8').digest('base64');}
function verifyTwilioSignature({authToken,url,params={},signature}){if(!authToken||!url||!signature)return false;return safeEqual(twilioSignature(authToken,url,params),signature);}
function replyIdempotencyKey(messageSid){return crypto.createHash('sha256').update(String(messageSid||'')).digest('hex');}

class DisabledSmsProvider{constructor(reason='sms_disabled'){this.reason=reason;}async send(){return {skipped:true,reason:this.reason};}}
class MockSmsProvider{constructor(){this.sent=[];}async send({to,body,offerId}){const row={id:`mock-${this.sent.length+1}`,to:maskPhone(to),body:String(body||''),offerId:String(offerId||''),mock:true};this.sent.push(row);return row;}}
class TwilioSmsProvider{
 constructor({fetchImpl=globalThis.fetch,accountSid=process.env.TWILIO_ACCOUNT_SID,authToken=process.env.TWILIO_AUTH_TOKEN,messagingServiceSid=process.env.TWILIO_MESSAGING_SERVICE_SID}={}){this.fetchImpl=fetchImpl;this.accountSid=String(accountSid||'');this.authToken=String(authToken||'');this.messagingServiceSid=String(messagingServiceSid||'');}
 isConfigured(){return /^AC[0-9a-f]{32}$/i.test(this.accountSid)&&this.authToken.length>=20&&/^MG[0-9a-f]{32}$/i.test(this.messagingServiceSid)&&typeof this.fetchImpl==='function';}
 async send({to,body,offerId}){
  if(!this.isConfigured())return {skipped:true,reason:'twilio_not_configured'};
  const form=new URLSearchParams({To:String(to),MessagingServiceSid:this.messagingServiceSid,Body:String(body||'')});
  const response=await this.fetchImpl(`https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`,{method:'POST',headers:{authorization:`Basic ${Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64')}`,'content-type':'application/x-www-form-urlencoded'},body:form.toString()});
  const data=await response.json().catch(()=>({}));
  if(!response.ok){const error=new Error(data?.message||`Twilio request failed (${response.status})`);error.status=response.status;error.code=data?.code||'twilio_error';throw error;}
  return {id:data.sid||null,to:maskPhone(to),offerId:String(offerId||''),status:data.status||'queued'};
 }
}
function provider(){if(MODE==='mock')return new MockSmsProvider();if(MODE==='live')return configured()?new TwilioSmsProvider():new DisabledSmsProvider('twilio_not_configured');return new DisabledSmsProvider();}

async function sendJobOffer({smsProvider=provider(),user,offer,service}){
 if(!smsEligible(user))return {skipped:true,reason:'not_eligible'};
 if(!offerActive(offer))return {skipped:true,reason:'offer_inactive'};
 return smsProvider.send({to:user.phone,body:messageForOffer({service}),offerId:offer.id});
}
function evaluateAcceptance({offer,providerUser,request,now=Date.now()}){
 if(!offerActive(offer,now))return {ok:false,reason:'offer_expired'};
 if(!smsEligible(providerUser,now))return {ok:false,reason:'provider_unavailable'};
 if(!request||request.id!==offer.requestId||!['Open','Looking for providers','Looking for replacement'].includes(request.status)||request.providerId)return {ok:false,reason:'job_unavailable'};
 return {ok:true};
}

module.exports={MODE,OFFER_TTL_MS,normalizeReply,classifyReply,normalizeE164,maskPhone,configured,smsEligible,createOffer,offerActive,messageForOffer,verifyTwilioSignature,twilioSignature,replyIdempotencyKey,DisabledSmsProvider,MockSmsProvider,TwilioSmsProvider,provider,sendJobOffer,evaluateAcceptance};
