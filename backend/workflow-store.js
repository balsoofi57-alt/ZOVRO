'use strict';
const crypto=require('crypto');
const database=require('./database');
const PREFIX='workflow:';
const now=()=>new Date().toISOString();
const id=()=>crypto.randomUUID();
const cleanType=t=>String(t||'').trim().toLowerCase().replace(/[^a-z0-9_-]/g,'').slice(0,64);
const clone=x=>JSON.parse(JSON.stringify(x));
function records(state=database.readDb()){return (state.audit||[]).filter(x=>String(x?.kind||'').startsWith(PREFIX));}
function list({type=null,userId=null,requestId=null,providerId=null,status=null}={}){const t=type?PREFIX+cleanType(type):null;return records().filter(x=>(!t||x.kind===t)&&(!userId||x.user===userId)&&(!requestId||x.requestId===requestId)&&(!providerId||x.providerId===providerId)&&(!status||x.status===status)).map(clone);}
function create({type,userId=null,requestId=null,providerId=null,status='active',data={}}){const t=cleanType(type);if(!t)throw Error('workflow type is required');const state=database.readDb();const rec={id:id(),kind:PREFIX+t,user:userId||null,requestId:requestId||null,providerId:providerId||null,status:String(status||'active').slice(0,40),at:now(),updatedAt:now(),data:clone(data||{})};state.audit.push(rec);database.writeDb(state);return clone(rec);}
function update(recordId,patch={}){const state=database.readDb();const i=state.audit.findIndex(x=>x.id===recordId&&String(x.kind||'').startsWith(PREFIX));if(i<0)throw Error('workflow record not found');const current=state.audit[i];state.audit[i]={...current,status:patch.status==null?current.status:String(patch.status).slice(0,40),updatedAt:now(),data:patch.data==null?current.data:{...current.data,...clone(patch.data)}};database.writeDb(state);return clone(state.audit[i]);}
function remove(recordId){const state=database.readDb();const before=state.audit.length;state.audit=state.audit.filter(x=>!(x.id===recordId&&String(x.kind||'').startsWith(PREFIX)));if(state.audit.length===before)return false;database.writeDb(state);return true;}
function upsertUnique({type,userId=null,requestId=null,providerId=null,key='default',status='active',data={}}){const existing=list({type,userId,requestId,providerId}).find(x=>x.data?.key===key);return existing?update(existing.id,{status,data:{...data,key}}):create({type,userId,requestId,providerId,status,data:{...data,key}});}
module.exports={records,list,create,update,remove,upsertUnique};
