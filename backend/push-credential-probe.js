'use strict';
const push=require('./push');
async function runPushCredentialProbe(){
  const result=await push.validateCredentials();
  const out={event:'onesignal.credential_probe',configured:push.configured(),ok:result.verified===true,status:result.status};
  console.log(JSON.stringify(out));
  return out;
}
module.exports={runPushCredentialProbe};
