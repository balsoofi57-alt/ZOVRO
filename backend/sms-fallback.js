'use strict';
const crypto=require('crypto');

const MODE=String(process.env.ZOVRO_SMS_MODE||'disabled').trim().toLowerCase();
const OFFER_TTL_MS=Math.max(60000,Number(process.env.ZOVRO_SMS_OFFER_TTL_MS||300000));
const ACCEPT=new Set(['1','موافق']);
const DECLINE=new Set(['2','رفض','لا','لا أريد']);

function normalizeReply(value){return String(value||'').normalize('NFKC').trim().replace(/\s+/g,' ').toLowerCase();}
function classifyReply(value){const v=normalizeReply(value);if(ACCEPT.has(v))return 'accept';if(DECLINE.has(v))return 'decline';return 'unknown';}
function maskPhone(value){const p=String(value||'').replace(/\s+/g,'');return p.length<5?'***':`${p.slice(0,2)}***${p.slice(-2)}`;}
function smsEligible(user){return Boolean(user&&user.role==='provider'&&(user.accountStatus||'active')==='active'&&user.availability!==false&&user.phoneVerified===true&&user.smsJobAlertsOptIn===true&&user.smsOptedOut!==true&&/^\+[1-9][0-9]{7,14}$/.test(String(user.phone||'')));}
function createOffer({requestId,providerId,now=Date.now()}){if(!requestId||!providerId)throw Error('requestId and providerId are required');return {id:crypto.randomUUID(),requestId:String(requestId),providerId:String(providerId),status:'pending',createdAt:new Date(now).toISOString(),expiresAt:new Date(now+OFFER_TTL_MS).toISOString()};}
function offerActive(offer,now=Date.now()){return Boolean(offer&&offer.status==='pending'&&Date.parse(offer.expiresAt)>now);}
function messageForOffer(){return 'ZOVRO: New job offer. Reply 1 or موافق to accept, 2 or رفض to decline. Reply STOP to stop SMS.';}

class DisabledSmsProvider{async send(){return {skipped:true,reason:'sms_disabled'};}}
class MockSmsProvider{constructor(){this.sent=[];}async send({to,body,offerId}){const row={id:`mock-${this.sent.length+1}`,to:maskPhone(to),body:String(body||''),offerId:String(offerId||''),mock:true};this.sent.push(row);return row;}}
function provider(){return MODE==='mock'?new MockSmsProvider():new DisabledSmsProvider();}

async function sendJobOffer({smsProvider=provider(),user,offer}){
 if(!smsEligible(user))return {skipped:true,reason:'not_eligible'};
 if(!offerActive(offer))return {skipped:true,reason:'offer_inactive'};
 return smsProvider.send({to:user.phone,body:messageForOffer(),offerId:offer.id});
}

function evaluateAcceptance({offer,providerUser,request,now=Date.now()}){
 if(!offerActive(offer,now))return {ok:false,reason:'offer_expired'};
 if(!smsEligible(providerUser))return {ok:false,reason:'provider_unavailable'};
 if(!request||request.id!==offer.requestId||request.status!=='Open'||request.providerId)return {ok:false,reason:'job_unavailable'};
 return {ok:true};
}

module.exports={MODE,OFFER_TTL_MS,normalizeReply,classifyReply,maskPhone,smsEligible,createOffer,offerActive,messageForOffer,DisabledSmsProvider,MockSmsProvider,provider,sendJobOffer,evaluateAcceptance};
