'use strict';
const http=require('http'),crypto=require('crypto');
const {readDb,writeDb}=require('./database');
const originalCreateServer=http.createServer.bind(http);
const SECRET=String(process.env.ZOVRO_SECRET||'dev-only-change-before-production');
const TERMS_VERSION='2026-09-09';
const PRIVACY_VERSION='2026-09-09';
const REQUEST_VERSION='service-request-v1';

function json(res,code,obj){if(res.headersSent)return;res.writeHead(code,{'content-type':'application/json; charset=utf-8','cache-control':'no-store'});res.end(JSON.stringify(obj))}
function versions(req){return {terms:String(req.headers['x-zovro-terms-version']||''),privacy:String(req.headers['x-zovro-privacy-version']||''),request:String(req.headers['x-zovro-request-consent']||''),kind:String(req.headers['x-zovro-request-kind']||'')}}
function currentUser(req){
  const raw=String(req.headers.authorization||'').replace(/^Bearer /,'');if(!raw)return null;
  const [payload,sig]=raw.split('.');if(!payload||!sig)return null;
  const expected=crypto.createHmac('sha256',SECRET).update(payload).digest('base64url');
  if(expected.length!==sig.length||!crypto.timingSafeEqual(Buffer.from(expected),Buffer.from(sig)))return null;
  try{const token=JSON.parse(Buffer.from(payload,'base64url'));if(token.exp<=Date.now()||!token.sid)return null;const db=readDb(),session=(db.deviceSessions||[]).find(s=>s.id===token.sid&&s.userId===token.uid&&s.expiresAt>Date.now());return session?token:null}catch{return null}
}
function appendConsent(db,row){db.consents=db.consents||[];db.consents.unshift({id:crypto.randomUUID(),...row,acceptedAt:new Date().toISOString()});db.consents=db.consents.slice(0,10000);db.audit=db.audit||[];db.audit.unshift({id:crypto.randomUUID(),user:row.userId||null,action:'legal.consent',meta:{type:row.type,termsVersion:row.termsVersion,privacyVersion:row.privacyVersion,requestVersion:row.requestVersion||null,requestId:row.requestId||null},at:new Date().toISOString()});db.audit=db.audit.slice(0,1000)}
function captureJson(res,onSuccess){
  let status=200;const originalWriteHead=res.writeHead.bind(res),originalEnd=res.end.bind(res);
  res.writeHead=(code,...args)=>{status=code;return originalWriteHead(code,...args)};
  res.end=(chunk,enc,cb)=>{if(status>=200&&status<300&&chunk){try{onSuccess(JSON.parse(Buffer.isBuffer(chunk)?chunk.toString('utf8'):String(chunk)))}catch{}}return originalEnd(chunk,enc,cb)};
}

http.createServer=function(handler,...args){return originalCreateServer((req,res)=>{
  const url=new URL(req.url||'/','http://localhost'),v=versions(req);
  const registering=req.method==='POST'&&url.pathname==='/api/auth/register';
  const creating=req.method==='POST'&&url.pathname==='/api/requests';
  if(registering){
    if(v.terms!==TERMS_VERSION||v.privacy!==PRIVACY_VERSION)return json(res,428,{error:'Current Terms and Privacy acceptance is required',termsVersion:TERMS_VERSION,privacyVersion:PRIVACY_VERSION});
    captureJson(res,payload=>{const userId=payload?.user?.id;if(!userId)return;const db=readDb();appendConsent(db,{userId,type:'account',termsVersion:TERMS_VERSION,privacyVersion:PRIVACY_VERSION});writeDb(db)});
  }
  if(creating){
    const me=currentUser(req);if(!me)return handler(req,res);
    if(v.terms!==TERMS_VERSION||v.privacy!==PRIVACY_VERSION)return json(res,428,{error:'Current Terms and Privacy acceptance is required',termsVersion:TERMS_VERSION,privacyVersion:PRIVACY_VERSION});
    const sos=v.kind==='sos';
    if(!sos&&v.request!==REQUEST_VERSION)return json(res,428,{error:'Service request consent is required',requestConsentVersion:REQUEST_VERSION});
    captureJson(res,payload=>{const requestId=payload?.request?.id;if(!requestId)return;const db=readDb();appendConsent(db,{userId:me.uid,type:sos?'sos_request':'service_request',termsVersion:TERMS_VERSION,privacyVersion:PRIVACY_VERSION,requestVersion:sos?'sos-v1':REQUEST_VERSION,requestId});writeDb(db)});
  }
  return handler(req,res);
},...args)};

module.exports={TERMS_VERSION,PRIVACY_VERSION,REQUEST_VERSION,versions,appendConsent};
