'use strict';
const crypto=require('crypto');

const MODE=String(process.env.ZOVRO_SMS_MODE||'disabled').trim().toLowerCase();
const OFFER_TTL_MS=Math.max(60000,Number(process.env.ZOVRO_SMS_OFFER_TTL_MS||300000));
const ACCEPT=new Set(['1','yes','accept','موافق','نعم']);
const DECLINE=new Set(['2','no','decline','رفض','لا','لا أريد']);
const STOP=new Set(['stop','unsubscribe','cancel','end','quit','إيقاف','الغاء','إلغاء']);
const HELP=new Set(['help','مساعدة']);

function normalizeReply(value){return String(value||'').normalize('NFKC').trim().replace(/\s+/g,' ').toLowerCase();}
function classifyReply(value){const v=normalizeReply(value);if(ACCEPT.has(v))return 'accept';if(DECLINE.has(v))return 'decline';if(STOP.has(v))return 'stop';if(HELP.has(v))return 'help';return 'unknown';}
function normalizeE164(value){const v=String(value||'').trim().replace(/[\s().-]/g,'');return /^\+[1-9]\d{7,14}$/.test(v)?v:null;}
function maskPhone(value){const p=normalizeE164(value);return p?`***${p.slice(-4)}`:'[redacted-phone]';}
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

class DisabledSmsProvider{async send(){return {skipped:true,reason:'sms_disabled'};}}
class MockSmsProvider{constructor(){this.sent=[];}async send({to,body,offerId}){const row={id:`mock-${this.sent.length+1}`,to:maskPhone(to),body:String(body||''),offerId:String(offerId||''),mock:true};this.sent.push(row);return row;}}
function provider(){return MODE==='mock'?new MockSmsProvider():new DisabledSmsProvider();}

async function sendJobOffer({smsProvider=provider(),user,offer,service}){
 if(!smsEligible(user))return {skipped:true,reason:'not_eligible'};
 if(!offerActive(offer))return {skipped:true,reason:'offer_inactive'};
 return smsProvider.send({to:user.phone,body:messageForOffer({service}),offerId:offer.id});
}
function evaluateAcceptance({offer,providerUser,request,now=Date.now()}){
 if(!offerActive(offer,now))return {ok:false,reason:'offer_expired'};
 if(!smsEligible(providerUser,now))return {ok:false,reason:'provider_unavailable'};
 if(!request||request.id!==offer.requestId||request.status!=='Open'||request.providerId)return {ok:false,reason:'job_unavailable'};
 return {ok:true};
}

module.exports={MODE,OFFER_TTL_MS,normalizeReply,classifyReply,normalizeE164,maskPhone,smsEligible,createOffer,offerActive,messageForOffer,verifyTwilioSignature,twilioSignature,replyIdempotencyKey,DisabledSmsProvider,MockSmsProvider,provider,sendJobOffer,evaluateAcceptance};
