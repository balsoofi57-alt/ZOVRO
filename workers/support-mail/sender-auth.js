'use strict';
const {Resolver}=require('node:dns').promises;
const {dkimVerify}=require('mailauth/lib/dkim/verify');
async function verifySender(raw,expectedSender,{resolver}={}){
 if(!Buffer.isBuffer(raw)||raw.length>262144)return {verified:false,reason:'invalid_source'};
 const end=raw.indexOf('\r\n\r\n');
 if(end<0||end>65536)return {verified:false,reason:'invalid_headers'};
 const lines=raw.subarray(0,end).toString('latin1').replace(/\r\n[ \t]+/g,' ').split('\r\n');
 const names=lines.map(line=>line.split(':',1)[0].toLowerCase());
 if(names.filter(n=>n==='from').length!==1||names.filter(n=>n==='message-id').length!==1||['to','content-type','mime-version'].some(name=>names.filter(n=>n===name).length>1)||names.filter(n=>n==='dkim-signature').length>5)return {verified:false,reason:'ambiguous_headers'};
 const required=['from','to','message-id',...['content-type','mime-version'].filter(n=>names.includes(n))];
 const domain=String(expectedSender||'').split('@').pop().toLowerCase();
 const dns=resolver?null:new Resolver({timeout:1500,tries:1});let lookups=0,timer;
 try{
  const result=await Promise.race([
   dkimVerify(raw,{minBitLength:2048,resolver:async(name,type)=>{
    if(++lookups>5||type!=='TXT')throw Error('DNS budget exceeded');
    return resolver?resolver(name,type):dns.resolve(name,type);
   }}),
   new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('Verification timeout')),8000);})
  ]);
  if(result.headerFrom.length!==1||result.headerFrom[0].toLowerCase()!==String(expectedSender).toLowerCase())return {verified:false,reason:'sender_mismatch'};
  const verified=result.results.some(r=>r.status?.result==='pass'&&r.signatureTimeValid&&r.signingDomain?.toLowerCase()===domain&&r.algo?.endsWith('-sha256')&&!r.canonBodyLengthLimited&&required.every(name=>r.signingHeaders?.keys?.toLowerCase().split(':').map(v=>v.trim()).includes(name)));
  return {verified,reason:verified?'aligned_dkim':'authentication_review'};
 }catch{return {verified:false,reason:'authentication_review'};}
 finally{clearTimeout(timer);if(dns)dns.cancel();}
}
module.exports={verifySender};
