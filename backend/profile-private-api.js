'use strict';
const http=require('http');
const {readDb,writeDb}=require('./database');
const {currentUser}=require('./request-privacy');
const {encryptSensitive,decryptSensitive}=require('./profile-privacy');

const originalCreateServer=http.createServer.bind(http);
const KEY=String(process.env.ZOVRO_PROFILE_ENCRYPTION_KEY||'');
const ENCRYPTED_FIELDS=['dateOfBirth','residentialAddress','insuranceDetails','identityDocuments','emergencyContact'];
const PRIVATE_PLAIN_FIELDS=['phone','email'];

function json(res,code,obj){
  if(res.headersSent)return;
  res.writeHead(code,{'content-type':'application/json; charset=utf-8','cache-control':'no-store'});
  res.end(JSON.stringify(obj));
}
function body(req){return new Promise((resolve,reject)=>{let s='',n=0;req.on('data',c=>{n+=c.length;if(n>200000)return reject(Object.assign(new Error('Body too large'),{status:413}));s+=c});req.on('end',()=>{try{resolve(s?JSON.parse(s):{})}catch{reject(Object.assign(new Error('Invalid JSON'),{status:400}))}});req.on('error',reject)})}
function requireKey(){if(Buffer.from(KEY).length<32)throw Object.assign(new Error('Private profile encryption is not configured'),{status:503})}
function decryptPrivate(user){
  const out={phone:user.phone||'',email:user.email||''};
  const enc=user.privateProfileEncrypted||{};
  for(const field of ENCRYPTED_FIELDS){if(enc[field]){try{out[field]=decryptSensitive(enc[field],KEY)}catch{out[field]=''}}else out[field]=''}
  return out;
}
function validDate(v){if(!v)return true;return /^\d{4}-\d{2}-\d{2}$/.test(v)&&Number.isFinite(Date.parse(v))}
function cleanText(v,max){return String(v||'').trim().slice(0,max)}
function publicCompletion(user){
  const p=decryptPrivate(user);
  return {
    privateProfileComplete:!!(p.dateOfBirth&&p.residentialAddress),
    providerPublicProfileReady:user.role!=='provider'||!!(user.photoUrl&&user.name&&user.service),
    fields:{dateOfBirth:!!p.dateOfBirth,residentialAddress:!!p.residentialAddress,phone:!!p.phone,email:!!p.email,photo:!!user.photoUrl}
  };
}

http.createServer=function(handler,...args){return originalCreateServer(async(req,res)=>{
  const url=new URL(req.url||'/','http://localhost');
  if(!url.pathname.startsWith('/api/profile/'))return handler(req,res);
  const actor=currentUser(req);
  if(!actor)return json(res,401,{error:'Authentication required'});
  const db=readDb(),user=(db.users||[]).find(u=>u.id===actor.user.id);
  if(!user)return json(res,404,{error:'User not found'});
  try{
    if(req.method==='GET'&&url.pathname==='/api/profile/private'){
      requireKey();
      return json(res,200,{profile:{name:user.name,photoUrl:user.photoUrl||'',role:user.role,service:user.service||'',...decryptPrivate(user)},completion:publicCompletion(user),privacy:'Only you can access these private profile fields.'});
    }
    if(req.method==='PATCH'&&url.pathname==='/api/profile/private'){
      requireKey();
      const b=await body(req);
      if(b.dateOfBirth!==undefined&&!validDate(String(b.dateOfBirth||'')))return json(res,400,{error:'Date of birth must use YYYY-MM-DD'});
      user.privateProfileEncrypted=user.privateProfileEncrypted||{};
      for(const field of ENCRYPTED_FIELDS){
        if(b[field]===undefined)continue;
        const value=field==='identityDocuments'?JSON.stringify(b[field]||[]):cleanText(b[field],field==='residentialAddress'?300:1000);
        user.privateProfileEncrypted[field]=value?encryptSensitive(value,KEY):'';
      }
      if(b.email!==undefined)user.email=cleanText(b.email,120).toLowerCase();
      if(b.photoUrl!==undefined){
        const photo=cleanText(b.photoUrl,1000);
        if(photo&&!/^https:\/\//i.test(photo)&&!/^data:image\/(png|jpeg|webp);base64,/i.test(photo))return json(res,400,{error:'Profile photo must be a secure HTTPS image or supported image data'});
        user.photoUrl=photo;
      }
      if(b.name!==undefined){const name=cleanText(b.name,80);if(name.split(/\s+/).filter(Boolean).length<2)return json(res,400,{error:'Full first and last name required'});user.name=name}
      writeDb(db);
      return json(res,200,{ok:true,profile:{name:user.name,photoUrl:user.photoUrl||'',role:user.role,service:user.service||'',...decryptPrivate(user)},completion:publicCompletion(user)});
    }
    if(req.method==='GET'&&url.pathname==='/api/profile/public'){
      const {publicProfile}=require('./profile-privacy');
      return json(res,200,{profile:publicProfile(user),completion:publicCompletion(user)});
    }
    return json(res,404,{error:'Not found'});
  }catch(e){return json(res,e.status||500,{error:e.status?e.message:'Private profile request failed'})}
},...args)};

module.exports={ENCRYPTED_FIELDS,PRIVATE_PLAIN_FIELDS,decryptPrivate,publicCompletion};
