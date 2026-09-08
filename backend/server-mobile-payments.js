'use strict';
const http=require('http');
const payments=require('./payments');
const originalCreateServer=http.createServer.bind(http);

const flag=(name)=>/^(1|true|yes|on)$/i.test(String(process.env[name]||''));
const publishableKey=()=>{
  const key=String(process.env.STRIPE_PUBLISHABLE_KEY||'').trim();
  return /^pk_(?:live|test)_[A-Za-z0-9]+$/.test(key)?key:null;
};
const applePayMerchantId=()=>{
  const id=String(process.env.ZOVRO_APPLE_PAY_MERCHANT_ID||'').trim();
  return /^merchant\.[A-Za-z0-9.-]+$/.test(id)?id:null;
};
const json=(res,code,obj)=>{
  res.writeHead(code,{
    'content-type':'application/json; charset=utf-8',
    'cache-control':'no-store',
    'x-content-type-options':'nosniff',
    'referrer-policy':'no-referrer'
  });
  res.end(JSON.stringify(obj));
};

function mobilePaymentConfig(req,res,next){
  let url;
  try{url=new URL(req.url,'http://localhost')}catch{return next(req,res)}
  if(req.method==='GET'&&url.pathname==='/api/payments/config'){
    const merchantId=applePayMerchantId();
    return json(res,200,{
      stripeConfigured:payments.configured(),
      webhookConfigured:payments.webhookConfigured(),
      publishableKey:publishableKey(),
      currency:payments.currency,
      platformFeeBps:payments.feeBps(),
      savedCardsEnabled:payments.configured(),
      applePayEnabled:flag('ZOVRO_APPLE_PAY_ENABLED')&&Boolean(merchantId),
      applePayMerchantId:merchantId,
      googlePayEnabled:flag('ZOVRO_GOOGLE_PAY_ENABLED'),
      googlePayTestEnv:flag('ZOVRO_GOOGLE_PAY_TEST_ENV')
    });
  }
  return next(req,res);
}

http.createServer=function(handler,...args){
  return originalCreateServer((req,res)=>mobilePaymentConfig(req,res,handler),...args);
};

require('./server-payments');
