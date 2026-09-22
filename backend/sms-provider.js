'use strict';

const crypto=require('crypto');
const ENABLED=/^(1|true|yes|on)$/i.test(String(process.env.ZOVRO_SMS_ENABLED||''));
const ACCOUNT_SID=String(process.env.TWILIO_ACCOUNT_SID||'');
const AUTH_TOKEN=String(process.env.TWILIO_AUTH_TOKEN||'');
const FROM=String(process.env.TWILIO_FROM_NUMBER||'');
const MESSAGING_SERVICE_SID=String(process.env.TWILIO_MESSAGING_SERVICE_SID||'');
const STATUS_CALLBACK=String(process.env.ZOVRO_SMS_STATUS_CALLBACK_URL||'');
const MAX_ATTEMPTS=Math.max(1,Math.min(5,Number(process.env.ZOVRO_SMS_MAX_ATTEMPTS||3)));
const TIMEOUT_MS=Math.max(1000,Math.min(15000,Number(process.env.ZOVRO_SMS_TIMEOUT_MS||7000)));

function configured(){
  return Boolean(ENABLED&&/^AC[a-f0-9]{32}$/i.test(ACCOUNT_SID)&&AUTH_TOKEN.length>=20&&(FROM||/^MG[a-f0-9]{32}$/i.test(MESSAGING_SERVICE_SID)));
}
function safeStatus(){
  return {enabled:ENABLED,configured:configured(),fromConfigured:Boolean(FROM||MESSAGING_SERVICE_SID),statusCallbackConfigured:Boolean(STATUS_CALLBACK),maxAttempts:MAX_ATTEMPTS};
}
function formBody(to,body){
  const p=new URLSearchParams({To:to,Body:body});
  if(MESSAGING_SERVICE_SID)p.set('MessagingServiceSid',MESSAGING_SERVICE_SID); else p.set('From',FROM);
  if(STATUS_CALLBACK)p.set('StatusCallback',STATUS_CALLBACK);
  return p.toString();
}
async function sendSms({to,body,idempotencyKey}){
  if(!configured())return {ok:false,skipped:true,reason:ENABLED?'sms_not_configured':'sms_disabled'};
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),TIMEOUT_MS);
  try{
    const auth=Buffer.from(ACCOUNT_SID+':'+AUTH_TOKEN).toString('base64');
    const res=await fetch('https://api.twilio.com/2010-04-01/Accounts/'+encodeURIComponent(ACCOUNT_SID)+'/Messages.json',{
      method:'POST',signal:controller.signal,
      headers:{authorization:'Basic '+auth,'content-type':'application/x-www-form-urlencoded','user-agent':'ZOVRO/1.0','x-zovro-idempotency':String(idempotencyKey||crypto.randomUUID())},
      body:formBody(to,String(body||'').slice(0,320))
    });
    const data=await res.json().catch(()=>({}));
    if(!res.ok)return {ok:false,status:res.status,errorCode:data.code||null,retryable:res.status===429||res.status>=500};
    return {ok:true,messageSid:data.sid||null,status:data.status||'queued'};
  }catch(e){return e.name==='AbortError'?{ok:false,error:'timeout',deliveryUnknown:true,retryable:false}:{ok:false,error:'transport_error',retryable:true};}
  finally{clearTimeout(timer)}
}
function normalizeKeyword(v){return String(v||'').trim().toUpperCase().replace(/[^A-Z]/g,'');}
function inboundPreference(body,optOutType){
  const t=String(optOutType||'').trim().toUpperCase();
  if(t==='STOP')return 'opt_out';
  if(t==='START')return 'opt_in';
  if(t==='HELP')return 'help';
  const k=normalizeKeyword(body);
  if(['STOP','STOPALL','UNSUBSCRIBE','CANCEL','END','QUIT'].includes(k))return 'opt_out';
  if(['START','UNSTOP'].includes(k))return 'opt_in';
  if(['HELP','INFO'].includes(k))return 'help';
  return 'ignore';
}
function validTwilioSignature({signature,url,params}){
  if(!AUTH_TOKEN||!signature||!url)return false;
  const base=Object.keys(params||{}).sort().reduce((s,k)=>s+k+String(params[k]??''),url);
  const expected=crypto.createHmac('sha1',AUTH_TOKEN).update(base).digest('base64');
  const a=Buffer.from(expected),b=Buffer.from(String(signature));
  return a.length===b.length&&crypto.timingSafeEqual(a,b);
}
module.exports={sendSms,safeStatus,inboundPreference,validTwilioSignature,MAX_ATTEMPTS};
