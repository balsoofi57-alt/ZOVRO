'use strict';
const required=['ZOVRO_SECRET','ZOVRO_OPS_TOKEN','ZOVRO_ALLOWED_ORIGINS'];
const missing=required.filter(k=>!String(process.env[k]||'').trim());
if(missing.length){console.error('Missing production environment values: '+missing.join(', '));process.exit(1)}
const secret=String(process.env.ZOVRO_SECRET||'');
const ops=String(process.env.ZOVRO_OPS_TOKEN||'');
if(secret.length<32||/change|example/i.test(secret)){console.error('ZOVRO_SECRET must be a strong non-example secret of at least 32 characters.');process.exit(1)}
if(ops.length<24||/change|example/i.test(ops)){console.error('ZOVRO_OPS_TOKEN must be a strong non-example token of at least 24 characters.');process.exit(1)}
const origins=String(process.env.ZOVRO_ALLOWED_ORIGINS||'').split(',').map(x=>x.trim()).filter(Boolean);
if(!origins.length){console.error('ZOVRO_ALLOWED_ORIGINS must contain at least one production origin.');process.exit(1)}
console.log('ZOVRO production environment check passed.');
