'use strict';
const assert=require('assert'),crypto=require('crypto');
const providerPath=require.resolve('../backend/sms-provider');
const managedKeys=[
  'ZOVRO_SMS_ENABLED','TWILIO_ACCOUNT_SID','TWILIO_AUTH_TOKEN',
  'TWILIO_FROM_NUMBER','TWILIO_MESSAGING_SERVICE_SID',
  'ZOVRO_SMS_STATUS_CALLBACK_URL','ZOVRO_SMS_INBOUND_URL'
];
function load(env={}){
  for(const k of managedKeys)delete process.env[k];
  Object.assign(process.env,env);
  delete require.cache[providerPath];
  return require('../backend/sms-provider');
}
(async()=>{
  const token='test_auth_token_12345678901234567890';
  const creds={
    ZOVRO_SMS_ENABLED:'true',
    TWILIO_ACCOUNT_SID:'AC'+'a'.repeat(32),
    TWILIO_AUTH_TOKEN:token,
    TWILIO_MESSAGING_SERVICE_SID:'MG'+'b'.repeat(32)
  };
  let sms=load(creds);
  let s=sms.safeStatus();
  assert.strictEqual(s.enabled,true);
  assert.strictEqual(s.configured,false);
  assert.strictEqual(s.statusCallbackConfigured,false);
  assert.strictEqual(s.inboundUrlConfigured,false);

  sms=load({...creds,
    ZOVRO_SMS_STATUS_CALLBACK_URL:'https://example.test/wrong-status',
    ZOVRO_SMS_INBOUND_URL:'https://example.test/wrong-inbound'
  });
  s=sms.safeStatus();
  assert.strictEqual(s.configured,false);

  sms=load({...creds,
    ZOVRO_SMS_STATUS_CALLBACK_URL:'https://example.test/api/sms/twilio/status',
    ZOVRO_SMS_INBOUND_URL:'https://example.test/api/sms/twilio/inbound'
  });
  s=sms.safeStatus();
  assert.strictEqual(s.configured,true);
  assert.strictEqual(s.statusCallbackConfigured,true);
  assert.strictEqual(s.inboundUrlConfigured,true);
  assert.strictEqual(sms.deliveryStatus('delivered'),'delivered');
  assert.strictEqual(sms.deliveryStatus('undelivered'),'failed');
  assert.strictEqual(sms.deliveryStatus('failed'),'failed');
  assert.strictEqual(sms.deliveryStatus('queued'),'sent');
  assert.strictEqual(sms.deliveryStatus('sent'),'sent');
  assert.strictEqual(sms.deliveryStatus('unknown'),'ignore');

  sms=load({ZOVRO_SMS_ENABLED:'false',TWILIO_AUTH_TOKEN:token});
  s=sms.safeStatus();
  assert.strictEqual(s.enabled,false);
  assert.strictEqual(s.configured,false);
  const skipped=await sms.sendSms({to:'+13135550100',body:'test',idempotencyKey:'offline-test'});
  assert.strictEqual(skipped.skipped,true);
  assert.strictEqual(skipped.reason,'sms_disabled');
  assert.strictEqual(sms.inboundPreference('anything','STOP'),'opt_out');
  assert.strictEqual(sms.inboundPreference('anything','START'),'opt_in');
  assert.strictEqual(sms.inboundPreference('HELP'),'help');
  assert.strictEqual(sms.inboundPreference('STOP ALL'),'opt_out');
  assert.strictEqual(sms.inboundPreference('1'),'ignore');
  const url='https://example.test/api/sms/twilio/inbound',params={From:'+13135550100',Body:'STOP'};
  const base=Object.keys(params).sort().reduce((x,k)=>x+k+params[k],url);
  const signature=crypto.createHmac('sha1',process.env.TWILIO_AUTH_TOKEN).update(base).digest('base64');
  assert.strictEqual(sms.validTwilioSignature({signature,url,params}),true);
  assert.strictEqual(sms.validTwilioSignature({signature:'bad',url,params}),false);
  console.log('ZOVRO SMS offline safety check passed; no network message was sent.');
})().catch(e=>{console.error(e.stack||e);process.exit(1)});