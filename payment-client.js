(function(){
  'use strict';
  const cfg=()=>window.ZOVRO_CONFIG||{};
  const apiBase=()=>String(cfg().apiBase||'https://zovro-api-final.onrender.com').replace(/\/$/,'');
  const token=()=>localStorage.getItem('zovro_token')||localStorage.getItem('token')||'';
  const stripePlugin=()=>window.Capacitor?.Plugins?.Stripe||window.Capacitor?.Plugins?.StripePlugin||null;

  async function api(path,options={}){
    const headers=Object.assign({'content-type':'application/json'},options.headers||{});
    const t=token(); if(t) headers.authorization='Bearer '+t;
    const res=await fetch(apiBase()+path,Object.assign({},options,{headers}));
    const data=await res.json().catch(()=>({}));
    if(!res.ok) throw new Error(data.error||('Request failed: '+res.status));
    return data;
  }

  async function getPaymentConfig(){
    return api('/api/payments/config',{method:'GET',headers:{}});
  }

  async function initializeStripe(){
    const p=stripePlugin();
    if(!p) throw new Error('Native Stripe plugin is unavailable on this device');
    const c=await getPaymentConfig();
    if(!c.publishableKey) throw new Error('Stripe publishable key is not configured');
    await p.initialize({publishableKey:c.publishableKey});
    return {plugin:p,config:c};
  }

  async function payRequest(requestId){
    if(!requestId) throw new Error('requestId is required');
    const {plugin,config}=await initializeStripe();
    const intent=await api('/api/requests/'+encodeURIComponent(requestId)+'/payment-intent',{method:'POST',body:'{}'});
    const opts={
      paymentIntentClientSecret:intent.clientSecret,
      merchantDisplayName:'ZOVRO',
      returnURL:'zovro://stripe-redirect',
      countryCode:'US'
    };
    if(intent.customerId&&intent.customerEphemeralKeySecret){
      opts.customerId=intent.customerId;
      opts.customerEphemeralKeySecret=intent.customerEphemeralKeySecret;
    }
    if(config.applePayEnabled&&config.applePayMerchantId){
      opts.enableApplePay=true;
      opts.applePayMerchantId=config.applePayMerchantId;
    }
    if(config.googlePayEnabled){
      opts.enableGooglePay=true;
      opts.GooglePayIsTesting=!!config.googlePayTestEnv;
    }
    await plugin.createPaymentSheet(opts);
    const result=await plugin.presentPaymentSheet();
    if(result?.paymentResult&&String(result.paymentResult).toLowerCase().includes('cancel')) throw new Error('Payment cancelled');
    return result;
  }

  async function capabilities(){
    const c=await getPaymentConfig().catch(()=>({}));
    return {
      native:!!stripePlugin(),
      configured:!!c.stripeConfigured,
      applePay:!!(c.applePayEnabled&&c.applePayMerchantId),
      googlePay:!!c.googlePayEnabled,
      savedCards:!!c.savedCardsEnabled,
      cardScan:'native-when-supported'
    };
  }

  window.ZOVRO_PAYMENTS={getPaymentConfig,initializeStripe,payRequest,capabilities};
})();
