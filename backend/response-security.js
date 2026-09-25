'use strict';
const http=require('http');
const originalCreateServer=http.createServer.bind(http);
const allowedOrigins=new Set(String(process.env.ZOVRO_ALLOWED_ORIGINS||'http://localhost,https://localhost,capacitor://localhost').split(',').map(x=>x.trim()).filter(Boolean));
const production=process.env.NODE_ENV==='production';
function headersFor(req){
  const origin=String(req.headers.origin||'');
  const h={
    'x-content-type-options':'nosniff',
    'x-frame-options':'DENY',
    'referrer-policy':'no-referrer',
    'content-security-policy': req.url.startsWith('/api/') ? "default-src 'none'; frame-ancestors 'none'; base-uri 'none'" : "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://zovro-api-final.onrender.com https://api.stripe.com https://onesignal.com https://*.onesignal.com; frame-src https://js.stripe.com https://hooks.stripe.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
    'cross-origin-opener-policy':'same-origin',
    'cross-origin-resource-policy':'cross-origin',
    'x-permitted-cross-domain-policies':'none',
    'permissions-policy': req.url.startsWith('/api/') ? 'camera=(), microphone=(), geolocation=()' : 'camera=(self), microphone=(self), geolocation=(self)'
  };
  if(production)h['strict-transport-security']='max-age=31536000; includeSubDomains';
  if(origin&&allowedOrigins.has(origin)){
    h['access-control-allow-origin']=origin;
    h['vary']='Origin';
    h['access-control-allow-methods']='GET,POST,PATCH,DELETE,OPTIONS';
    h['access-control-allow-headers']='Content-Type, Authorization, X-ZOVRO-Ops-Token, Stripe-Signature, X-ZOVRO-Terms-Version, X-ZOVRO-Privacy-Version, X-ZOVRO-Request-Consent, X-ZOVRO-Request-Kind';
    h['access-control-max-age']='600';
  }
  return h;
}
http.createServer=function(handler,...args){
  return originalCreateServer((req,res)=>{
    const base=headersFor(req),originalWriteHead=res.writeHead.bind(res);
    res.writeHead=function(statusCode,statusMessage,headers){
      if(typeof statusMessage==='object'&&statusMessage!==null){headers=statusMessage;statusMessage=undefined}
      const merged={...base,...(headers||{})};
      return statusMessage===undefined?originalWriteHead(statusCode,merged):originalWriteHead(statusCode,statusMessage,merged);
    };
    if(req.method==='OPTIONS'&&req.headers.origin&&allowedOrigins.has(String(req.headers.origin))){res.writeHead(204);return res.end()}
    return handler(req,res);
  },...args);
};
