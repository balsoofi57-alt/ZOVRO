'use strict';
// Loaded only by the local recovery integration test process.
const fs=require('node:fs');
const sms=require('../backend/sms-provider');
sms.safeStatus=()=>({configured:true,enabled:true});
sms.sendSms=async({body})=>{
  fs.writeFileSync(process.env.ZOVRO_RECOVERY_SMS_CAPTURE_PATH,String(body),'utf8');
  return {ok:true,messageSid:'test-only-message'};
};
