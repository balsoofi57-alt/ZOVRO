'use strict';
const http=require('http'),crypto=require('crypto');
const {readDb}=require('./database');

const originalCreateServer=http.createServer.bind(http);
const SECRET=process.env.ZOVRO_SECRET||'dev-only-change-before-production';

function json(res,code,obj){
  if(res.headersSent)return;
  res.writeHead(code,{'content-type':'application/json; charset=utf-8','cache-control':'no-store'});
  res.end(JSON.stringify(obj));
}

function currentUser(req){
  const raw=String(req.headers.authorization||'').replace(/^Bearer /,'');
  if(!raw)return null;
  const [payload,sig]=raw.split('.');
  if(!payload||!sig)return null;
  const expected=crypto.createHmac('sha256',SECRET).update(payload).digest('base64url');
  if(expected.length!==sig.length||!crypto.timingSafeEqual(Buffer.from(expected),Buffer.from(sig)))return null;
  try{
    const token=JSON.parse(Buffer.from(payload,'base64url'));
    if(token.exp<=Date.now()||!token.sid)return null;
    const db=readDb();
    const session=(db.deviceSessions||[]).find(s=>s.id===token.sid&&s.userId===token.uid&&s.expiresAt>Date.now());
    if(!session)return null;
    const user=(db.users||[]).find(u=>u.id===token.uid);
    if(!user||(user.accountStatus||'active')!=='active')return null;
    return {token,user};
  }catch{return null}
}

function publicDiscoveryRequest(r){
  return {
    id:r.id,
    service:r.service,
    details:r.details,
    time:r.time,
    pricing:r.pricing,
    urgent:!!r.urgent,
    status:r.status,
    createdAt:r.createdAt,
    privacy:'Exact customer identity, address, location and messages are shared only after you accept the job.'
  };
}

function publicProviderView(provider){
  if(!provider||typeof provider!=='object')return provider;
  const {
    phone,
    email,
    license,
    stripeCustomerId,
    stripeRecipientAccountId,
    passwordHash,
    ...safe
  }=provider;
  return safe;
}

function canUsePrivateRequest(r,uid){return r.customerId===uid||r.providerId===uid}

function isCompatibleProvider(user,r){
  if(user.role!=='provider')return false;
  if((user.accountStatus||'active')!=='active')return false;
  if(user.availability===false)return false;
  if(user.service&&r.service&&user.service!==r.service)return false;
  return true;
}

function locationFresh(location,maxAgeMs=15*60*1000){
  if(!location||!Number.isFinite(+location.lat)||!Number.isFinite(+location.lng))return false;
  const updated=Date.parse(location.updatedAt||0);
  return Number.isFinite(updated)&&Date.now()-updated<=maxAgeMs&&updated<=Date.now()+30000;
}

function milesBetween(aLat,aLng,bLat,bLng){
  const rad=x=>x*Math.PI/180,R=3958.8;
  const dLat=rad(bLat-aLat),dLng=rad(bLng-aLng);
  const q=Math.sin(dLat/2)**2+Math.cos(rad(aLat))*Math.cos(rad(bLat))*Math.sin(dLng/2)**2;
  return 2*R*Math.asin(Math.sqrt(q));
}

function acceptanceEligibility(db,user,r){
  if(!isCompatibleProvider(user,r))return {ok:false,reason:'This request is not eligible for your provider account'};
  if(!r.location)return {ok:true,distanceMiles:null,radiusMiles:null};
  const providerLocation=(db.providerLocations||[]).find(x=>x.providerId===user.id);
  if(!locationFresh(providerLocation))return {ok:false,reason:'Update your current location before accepting this request'};
  const distanceMiles=milesBetween(+r.location.lat,+r.location.lng,+providerLocation.lat,+providerLocation.lng);
  const radiusMiles=r.source==='sos'||r.urgent===true?15:25;
  if(distanceMiles>radiusMiles)return {ok:false,reason:'This request is outside your current service range',distanceMiles:+distanceMiles.toFixed(1),radiusMiles};
  return {ok:true,distanceMiles:+distanceMiles.toFixed(1),radiusMiles};
}

function rewriteJsonResponse(res,transform){
  const chunks=[];
  const originalEnd=res.end.bind(res);
  res.write=(chunk,enc,cb)=>{
    if(chunk)chunks.push(Buffer.isBuffer(chunk)?chunk:Buffer.from(chunk,enc));
    if(typeof cb==='function')cb();
    return true;
  };
  res.end=(chunk,enc,cb)=>{
    if(chunk)chunks.push(Buffer.isBuffer(chunk)?chunk:Buffer.from(chunk,enc));
    try{
      const parsed=JSON.parse(Buffer.concat(chunks).toString('utf8'));
      const transformed=transform(parsed);
      return originalEnd(Buffer.from(JSON.stringify(transformed)),undefined,cb);
    }catch{}
    return originalEnd(Buffer.concat(chunks),undefined,cb);
  };
}

http.createServer=function(handler,...args){
  return originalCreateServer((req,res)=>{
    const url=new URL(req.url||'/','http://localhost');
    const actor=currentUser(req);
    const msg=url.pathname.match(/^\/api\/requests\/([^/]+)\/messages$/);
    if(msg&&actor){
      const db=readDb(),r=(db.requests||[]).find(x=>x.id===msg[1]);
      if(!r||!canUsePrivateRequest(r,actor.user.id))return json(res,404,{error:'Request not found'});
    }
    const accept=url.pathname.match(/^\/api\/requests\/([^/]+)\/accept$/);
    if(accept&&actor){
      const db=readDb(),r=(db.requests||[]).find(x=>x.id===accept[1]);
      if(r&&!r.providerId){
        const eligibility=acceptanceEligibility(db,actor.user,r);
        if(!eligibility.ok)return json(res,403,{error:eligibility.reason,distanceMiles:eligibility.distanceMiles??null,radiusMiles:eligibility.radiusMiles??null});
      }
    }
    if(req.method==='GET'&&url.pathname==='/api/requests'&&actor?.user.role==='provider'){
      rewriteJsonResponse(res,parsed=>{
        if(Array.isArray(parsed.requests))parsed.requests=parsed.requests.map(r=>r.providerId===actor.user.id?r:publicDiscoveryRequest(r));
        return parsed;
      });
      return handler(req,res);
    }
    if(req.method==='GET'&&url.pathname==='/api/providers/nearby'){
      rewriteJsonResponse(res,parsed=>{
        if(Array.isArray(parsed.providers))parsed.providers=parsed.providers.map(row=>({...row,provider:publicProviderView(row.provider)}));
        return parsed;
      });
      return handler(req,res);
    }
    const publicProfile=url.pathname.match(/^\/api\/providers\/([^/]+)\/profile$/);
    if(req.method==='GET'&&publicProfile){
      rewriteJsonResponse(res,parsed=>{
        if(parsed.provider)parsed.provider=publicProviderView(parsed.provider);
        return parsed;
      });
      return handler(req,res);
    }
    return handler(req,res);
  },...args);
};

module.exports={publicDiscoveryRequest,publicProviderView,canUsePrivateRequest,isCompatibleProvider,locationFresh,milesBetween,acceptanceEligibility};
