'use strict';
const http=require('http');
const store=require('./workflow-store');
const {currentUser}=require('./request-privacy');
const originalCreateServer=http.createServer.bind(http);

const json=(res,code,obj)=>{if(res.headersSent)return;res.writeHead(code,{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff','referrer-policy':'no-referrer'});res.end(JSON.stringify(obj));};
const body=req=>new Promise((resolve,reject)=>{let s='';req.on('data',c=>{s+=c;if(s.length>100000){reject(Error('Body too large'));req.destroy();}});req.on('end',()=>{try{resolve(s?JSON.parse(s):{})}catch{reject(Error('Invalid JSON'));}});req.on('error',reject);});
const isAdmin=actor=>actor?.user?.role==='admin';
const owns=(rec,actor)=>Boolean(actor&&(isAdmin(actor)||rec.user===actor.user.id||rec.providerId===actor.user.id));
const safeData=d=>{const x=d&&typeof d==='object'&&!Array.isArray(d)?d:{};const text=JSON.stringify(x);if(text.length>50000)throw Error('Workflow data too large');return x;};
const safeStatus=s=>String(s||'active').trim().slice(0,40)||'active';
const safeType=t=>String(t||'').trim().toLowerCase().replace(/[^a-z0-9_-]/g,'').slice(0,64);

async function workflowApi(req,res,next){
  let url;try{url=new URL(req.url||'/','http://localhost')}catch{return next(req,res)}
  if(!url.pathname.startsWith('/api/workflows'))return next(req,res);
  const actor=currentUser(req);
  if(!actor)return json(res,401,{error:'Authentication required'});

  try{
    if(req.method==='GET'&&url.pathname==='/api/workflows'){
      const type=safeType(url.searchParams.get('type'))||null;
      const requestId=String(url.searchParams.get('requestId')||'').slice(0,120)||null;
      const status=String(url.searchParams.get('status')||'').slice(0,40)||null;
      const rows=store.list({type,requestId,status}).filter(r=>owns(r,actor)).slice(0,200);
      return json(res,200,{records:rows});
    }

    if(req.method==='POST'&&url.pathname==='/api/workflows'){
      const b=await body(req),type=safeType(b.type);
      if(!type)return json(res,400,{error:'workflow type is required'});
      const providerId=b.providerId?String(b.providerId).slice(0,120):null;
      if(providerId&&providerId!==actor.user.id&&!isAdmin(actor))return json(res,403,{error:'providerId is not allowed for this account'});
      const rec=store.create({type,userId:isAdmin(actor)&&b.userId?String(b.userId).slice(0,120):actor.user.id,requestId:b.requestId?String(b.requestId).slice(0,120):null,providerId,status:safeStatus(b.status),data:safeData(b.data)});
      return json(res,201,{record:rec});
    }

    const m=url.pathname.match(/^\/api\/workflows\/([^/]+)$/);
    if(m){
      const recordId=decodeURIComponent(m[1]);
      const current=store.records().find(r=>r.id===recordId);
      if(!current||!owns(current,actor))return json(res,404,{error:'Workflow record not found'});
      if(req.method==='GET')return json(res,200,{record:current});
      if(req.method==='PATCH'){
        const b=await body(req);
        const rec=store.update(recordId,{status:b.status==null?undefined:safeStatus(b.status),data:b.data==null?undefined:safeData(b.data)});
        return json(res,200,{record:rec});
      }
      if(req.method==='DELETE'){
        store.remove(recordId);
        return json(res,200,{deleted:true,id:recordId});
      }
    }

    if(req.method==='POST'&&url.pathname==='/api/workflows/upsert'){
      const b=await body(req),type=safeType(b.type);
      if(!type)return json(res,400,{error:'workflow type is required'});
      const providerId=b.providerId?String(b.providerId).slice(0,120):null;
      if(providerId&&providerId!==actor.user.id&&!isAdmin(actor))return json(res,403,{error:'providerId is not allowed for this account'});
      const rec=store.upsertUnique({type,userId:isAdmin(actor)&&b.userId?String(b.userId).slice(0,120):actor.user.id,requestId:b.requestId?String(b.requestId).slice(0,120):null,providerId,key:String(b.key||'default').slice(0,120),status:safeStatus(b.status),data:safeData(b.data)});
      return json(res,200,{record:rec});
    }

    return json(res,405,{error:'Method not allowed'});
  }catch(e){return json(res,400,{error:e.message||'Invalid request'});}
}

http.createServer=function(handler,...args){return originalCreateServer((req,res)=>workflowApi(req,res,handler),...args);};
module.exports={workflowApi,owns};
