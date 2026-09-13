'use strict';
const crypto=require('crypto');
const {servicesFor}=require('../src/provider-services');

const PUBLIC_PROFILE_FIELDS=new Set(['id','name','photoUrl','role','service','providerVerified','identityVerified','licensed','insured','rating','ratingCount','availability']);
const PRIVATE_PROFILE_FIELDS=new Set(['phone','email','dateOfBirth','residentialAddress','licenseNumber','insuranceDetails','identityDocuments','paymentProfile','emergencyContact']);

// Copy only public aggregates, never raw audit rows or handoff reasons.
function publicProviderStats(stats){
  if(!stats||typeof stats!=='object'||Array.isArray(stats))return undefined;
  const out={};
  for(const field of ['completedJobs','ratingCount','providerCancellations','emergencyHandoffs','reliabilityScore','dispatchPriorityScore']){
    if(typeof stats[field]==='number'&&Number.isFinite(stats[field]))out[field]=stats[field];
  }
  for(const field of ['rating','completionRate']){
    if(stats[field]===null||(typeof stats[field]==='number'&&Number.isFinite(stats[field])))out[field]=stats[field];
  }
  if(['Excellent','Good','Needs improvement','Low'].includes(stats.professionalLevel))out.professionalLevel=stats.professionalLevel;
  return out;
}

function publicProfile(user={}){
  const out={};
  for(const key of PUBLIC_PROFILE_FIELDS) if(user[key]!==undefined) out[key]=user[key];
  if(user.role==='provider')out.services=servicesFor(user);
  const stats=publicProviderStats(user.stats);
  if(stats)out.stats=stats;
  return out;
}

function privateProfile(user={}){
  const out={...publicProfile(user)};
  for(const key of PRIVATE_PROFILE_FIELDS) if(user[key]!==undefined) out[key]=user[key];
  return out;
}

function isPrivateField(field){return PRIVATE_PROFILE_FIELDS.has(field)}

function encryptSensitive(value,key){
  if(value===undefined||value===null||value==='') return value;
  if(!key||Buffer.from(String(key)).length<32) throw new Error('ZOVRO_PROFILE_ENCRYPTION_KEY must be at least 32 bytes');
  const iv=crypto.randomBytes(12), k=crypto.createHash('sha256').update(String(key)).digest();
  const cipher=crypto.createCipheriv('aes-256-gcm',k,iv);
  const ciphertext=Buffer.concat([cipher.update(String(value),'utf8'),cipher.final()]);
  return ['v1',iv.toString('base64url'),cipher.getAuthTag().toString('base64url'),ciphertext.toString('base64url')].join('.');
}

function decryptSensitive(payload,key){
  if(!payload||typeof payload!=='string'||!payload.startsWith('v1.')) return payload;
  const [,ivB64,tagB64,dataB64]=payload.split('.');
  const k=crypto.createHash('sha256').update(String(key)).digest();
  const decipher=crypto.createDecipheriv('aes-256-gcm',k,Buffer.from(ivB64,'base64url'));
  decipher.setAuthTag(Buffer.from(tagB64,'base64url'));
  return Buffer.concat([decipher.update(Buffer.from(dataB64,'base64url')),decipher.final()]).toString('utf8');
}

module.exports={PUBLIC_PROFILE_FIELDS,PRIVATE_PROFILE_FIELDS,publicProfile,privateProfile,isPrivateField,encryptSensitive,decryptSensitive};
