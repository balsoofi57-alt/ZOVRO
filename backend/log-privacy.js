'use strict';
const crypto=require('crypto');
const SECRET=String(process.env.ZOVRO_SECRET||'dev-only-change-before-production');
const hashIp=value=>crypto.createHmac('sha256',SECRET).update(String(value||'')).digest('hex').slice(0,16);

function sanitizeArg(arg){
  if(typeof arg!=='string'||!arg.startsWith('{'))return arg;
  try{
    const parsed=JSON.parse(arg);
    if(parsed&&typeof parsed==='object'&&parsed.ip){
      parsed.ipHash=hashIp(parsed.ip);
      delete parsed.ip;
      return JSON.stringify(parsed);
    }
  }catch{}
  return arg;
}

for(const method of ['log','error','warn']){
  const original=console[method].bind(console);
  console[method]=(...args)=>original(...args.map(sanitizeArg));
}

module.exports={hashIp,sanitizeArg};
