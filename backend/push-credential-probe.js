'use strict';
const push=require('./push');
async function runPushCredentialProbe(){
  const raw=String(process.env.ONESIGNAL_REST_API_KEY||'').trim();
  const result=await push.validateCredentials();
  const out={
    event:'onesignal.credential_probe',
    configured:push.configured(),
    ok:result.verified===true,
    status:result.status,
    keyType:raw.startsWith('os_v2_app_')?'app_v2':raw.startsWith('os_v2_org_')?'org_v2':'other',
    keyLength:raw.length,
    error:result.error||null
  };
  console.log(JSON.stringify(out));
  return out;
}
module.exports={runPushCredentialProbe};
