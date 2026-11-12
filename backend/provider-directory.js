'use strict';
// Provider directory: lets customers browse every provider for a service, read
// ratings/reviews and send a request directly to the provider they choose.
// The existing automatic nearby dispatch stays unchanged.
const http=require('http'),crypto=require('crypto');
const {readDb,writeDb}=require('./database');
const {currentUser,locationFresh,milesBetween}=require('./request-privacy');
const {publicProfile}=require('./profile-privacy');
const {matchesService}=require('../src/provider-services');
const originalCreateServer=http.createServer.bind(http);

const json=(res,code,obj)=>{if(res.headersSent)return;res.writeHead(code,{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff','referrer-policy':'no-referrer'});res.end(JSON.stringify(obj));};
const body=req=>new Promise((resolve,reject)=>{let s='';req.on('data',c=>{s+=c;if(s.length>20000){reject(Error('Body too large'));req.destroy();}});req.on('end',()=>{try{resolve(s?JSON.parse(s):{})}catch{reject(Error('Invalid JSON'))}});req.on('error',reject);});
const now=()=>new Date().toISOString();
const activeProvider=u=>u&&u.role==='provider'&&(u.accountStatus||'active')==='active';

function ratingsFor(db,providerId){return (db.ratings||[]).filter(x=>x.providerId===providerId&&x.targetRole==='provider')}
function summary(db,u){
  const rows=ratingsFor(db,u.id),avg=rows.length?rows.reduce((n,x)=>n+Number(x.stars||0),0)/rows.length:null;
  const completed=(db.requests||[]).filter(r=>r.status==='Completed'&&r.completedProviderId===u.id).length;
  const breakdown=[5,4,3,2,1].map(s=>({stars:s,count:rows.filter(x=>Number(x.stars)===s).length}));
  return {rating:avg===null?null:+avg.toFixed(1),ratingCount:rows.length,reviewCount:rows.filter(x=>x.comment).length,completedJobs:completed,breakdown};
}
function reviewerLabel(db,id){const n=String(db.users.find(u=>u.id===id)?.name||'Customer').trim().split(/\s+/);return n[0]+(n[1]?' '+n[1].charAt(0)+'.':'')}
function reviews(db,providerId,limit=50){
  return ratingsFor(db,providerId).sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt))).slice(0,limit).map(x=>{
    const r=(db.requests||[]).find(q=>q.id===x.requestId);
    return {id:x.id,stars:x.stars,comment:x.comment||'',service:r?.service||null,reviewer:reviewerLabel(db,x.fromUserId),createdAt:x.createdAt};
  });
}
function card(db,u){
  const p=publicProfile(u);
  return {...p,id:u.id,name:u.name||'Provider',available:u.availability!==false,verified:!!u.providerVerified,summary:summary(db,u)};
}
function notify(db,userId,title,text,meta={}){if(!userId)return;db.notifications=db.notifications||[];db.notifications.unshift({id:crypto.randomUUID(),userId,title:String(title).slice(0,120),text:String(text).slice(0,500),meta,read:false,createdAt:now()});db.notifications=db.notifications.slice(0,5000)}
function audit(db,uid,action,meta){db.audit=db.audit||[];db.audit.unshift({id:crypto.randomUUID(),user:uid,action,meta,at:now()});db.audit=db.audit.slice(0,10000)}

async function directoryApi(req,res,next){
  let url;try{url=new URL(req.url||'/','http://localhost')}catch{return next(req,res)}
  const p=url.pathname;
  const isDir=p==='/api/providers/directory'||/^\/api\/providers\/[^/]+\/(profile|reviews)$/.test(p);
  const decline=p.match(/^\/api\/requests\/([^/]+)\/decline-direct$/);
  const choose=p.match(/^\/api\/requests\/([^/]+)\/choose-provider$/);
  if(!isDir&&!decline&&!choose)return next(req,res);
  const actor=currentUser(req);
  if(!actor)return json(res,401,{error:'Authentication required'});
  const me=actor.user;
  try{
    if(req.method==='GET'&&p==='/api/providers/directory'){
      const db=readDb(),service=String(url.searchParams.get('service')||'').slice(0,80),q=String(url.searchParams.get('q')||'').trim().toLowerCase().slice(0,60);
      const sort=url.searchParams.get('sort')||'rating';
      let rows=(db.users||[]).filter(u=>activeProvider(u)&&(!service||matchesService(u,service))&&(!q||String(u.name||'').toLowerCase().includes(q))).map(u=>card(db,u));
      rows.sort((a,b)=>sort==='reviews'?b.summary.ratingCount-a.summary.ratingCount:sort==='jobs'?b.summary.completedJobs-a.summary.completedJobs:((b.summary.rating??0)-(a.summary.rating??0))||(b.summary.ratingCount-a.summary.ratingCount));
      rows.sort((a,b)=>Number(b.available)-Number(a.available));
      return json(res,200,{providers:rows.slice(0,200),total:rows.length,service:service||null});
    }
    const prof=p.match(/^\/api\/providers\/([^/]+)\/(profile|reviews)$/);
    if(req.method==='GET'&&prof){
      const db=readDb(),u=(db.users||[]).find(x=>x.id===decodeURIComponent(prof[1]));
      if(!activeProvider(u))return json(res,404,{error:'Provider not found'});
      if(prof[2]==='reviews')return json(res,200,{reviews:reviews(db,u.id,100),summary:summary(db,u)});
      const c=card(db,u);return json(res,200,{provider:c,summary:c.summary,available:c.available,verified:c.verified,reviews:reviews(db,u.id,20)});
    }
    if(req.method==='POST'&&decline){
      if(me.role!=='provider')return json(res,403,{error:'Provider role required'});
      const b=await body(req),db=readDb(),r=(db.requests||[]).find(x=>x.id===decline[1]);
      if(!r||r.preferredProviderId!==me.id||r.providerId)return json(res,404,{error:'Direct request not found'});
      const reason=String(b.reason||'').trim().slice(0,300);
      r.declinedProviderIds=[...new Set([...(r.declinedProviderIds||[]),me.id])];
      r.preferredProviderId=null;r.preferredProviderName=null;r.status='Provider declined';r.updatedAt=now();r.lastDeclineReason=reason||null;
      notify(db,r.customerId,'Provider is not available',(me.name||'The provider')+' could not take your '+r.service+' request. Choose another provider or send it to all nearby pros.'+(reason?' Reason: '+reason:''),{requestId:r.id,type:'direct_declined'});
      audit(db,me.id,'request.direct_decline',{requestId:r.id});
      writeDb(db);return json(res,200,{declined:true,id:r.id});
    }
    if(req.method==='POST'&&choose){
      if(me.role!=='customer')return json(res,403,{error:'Customer role required'});
      const b=await body(req),db=readDb(),r=(db.requests||[]).find(x=>x.id===choose[1]);
      if(!r||r.customerId!==me.id)return json(res,404,{error:'Request not found'});
      if(r.providerId||['Completed','Cancelled'].includes(r.status))return json(res,409,{error:'This request already has a provider or is closed'});
      if(b.open===true){
        r.preferredProviderId=null;r.preferredProviderName=null;r.directRequest=false;r.status='Looking for providers';r.updatedAt=now();
        // Match the normal dispatch radius when GPS was explicitly provided. Never
        // notify unrelated or far-away providers simply because a direct pro declined.
        const candidates=(db.users||[]).filter(u=>activeProvider(u)&&u.availability!==false&&matchesService(u,r.service)&&!(r.declinedProviderIds||[]).includes(u.id));
        const within=radius=>candidates.map(u=>{
          if(!r.location)return {user:u,distanceMiles:null};
          const loc=(db.providerLocations||[]).find(x=>x.providerId===u.id);
          if(!locationFresh(loc))return null;
          const distance=milesBetween(+r.location.lat,+r.location.lng,+loc.lat,+loc.lng);
          return distance<=radius?{user:u,distanceMiles:+distance.toFixed(1)}:null;
        }).filter(Boolean).sort((a,b)=>(a.distanceMiles??0)-(b.distanceMiles??0));
        let radius=r.urgent?15:25,pros=within(radius);
        if(!pros.length&&r.location){radius=r.urgent?30:50;pros=within(radius);}
        pros=pros.slice(0,r.urgent?12:20);
        for(const entry of pros)notify(db,entry.user.id,'New service request',r.service+': '+String(r.details||'').slice(0,120),{requestId:r.id,type:'new_request',distanceMiles:entry.distanceMiles});
        r.notifiedProviders=pros.length;r.dispatchRadiusMiles=r.location?radius:null;
        audit(db,me.id,'request.open_to_all',{requestId:r.id,notifiedProviders:pros.length,radiusMiles:r.dispatchRadiusMiles});writeDb(db);
        return json(res,200,{id:r.id,status:r.status,notifiedProviders:pros.length});
      }
      const pro=(db.users||[]).find(u=>u.id===String(b.providerId||''));
      if(!activeProvider(pro))return json(res,404,{error:'Selected provider is not available'});
      if(!matchesService(pro,r.service))return json(res,400,{error:'Selected provider does not offer this service'});
      if((r.declinedProviderIds||[]).includes(pro.id))return json(res,409,{error:'This provider already declined this request'});
      r.preferredProviderId=pro.id;r.preferredProviderName=pro.name||'Provider';r.directRequest=true;r.status='Waiting for provider reply';r.updatedAt=now();
      notify(db,pro.id,'New direct request for you',(me.name||'A customer')+' chose you for '+r.service+': '+String(r.details||'').slice(0,120),{requestId:r.id,type:'direct_request'});
      audit(db,me.id,'request.direct_choose',{requestId:r.id,preferredProviderId:pro.id});writeDb(db);
      return json(res,200,{id:r.id,status:r.status,preferredProviderId:pro.id});
    }
    return json(res,405,{error:'Method not allowed'});
  }catch(e){return json(res,400,{error:e.message||'Invalid request'})}
}

http.createServer=function(handler,...args){return originalCreateServer((req,res)=>directoryApi(req,res,handler),...args);};
module.exports={directoryApi,summary,reviews};
