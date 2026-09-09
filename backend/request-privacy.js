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

function canUsePrivateRequest(r,uid){return r.customerId===uid||r.providerId===uid}

function isCompatibleProvider(user,r){
  if(user.role!=='provider')return false;
  if(user.availability===false)return false;
  if(user.service&&r.service&&user.service!==r.service)return false;
  return true;
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
      if(r&&!r.providerId&&!isCompatibleProvider(actor.user,r))return json(res,403,{error:'This request is not eligible for your provider account'});
    }
    if(req.method==='GET'&&url.pathname==='/api/requests'&&actor?.user.role==='provider'){
      const chunks=[];
      const originalWrite=res.write.bind(res),originalEnd=res.end.bind(res);
      res.write=(chunk,enc,cb)=>{if(chunk)chunks.push(Buffer.isBuffer(chunk)?chunk:Buffer.from(chunk,enc));if(typeof cb==='function')cb();return true};
      res.end=(chunk,enc,cb)=>{
        if(chunk)chunks.push(Buffer.isBuffer(chunk)?chunk:Buffer.from(chunk,enc));
        try{
          const body=Buffer.concat(chunks).toString('utf8');
          const parsed=JSON.parse(body);
          if(Array.isArray(parsed.requests)){
            parsed.requests=parsed.requests.map(r=>r.providerId===actor.user.id?r:publicDiscoveryRequest(r));
            const out=Buffer.from(JSON.stringify(parsed));
            return originalEnd(out,undefined,cb);
          }
        }catch{}
        return originalEnd(Buffer.concat(chunks),undefined,cb);
      };
      return handler(req,res);
    }
    return handler(req,res);
  },...args);
};

module.exports={publicDiscoveryRequest,canUsePrivateRequest,isCompatibleProvider};
