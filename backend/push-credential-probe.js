'use strict';
const push=require('./push');
async function runPushCredentialProbe(){
  if(!push.configured()){
    console.log(JSON.stringify({event:'onesignal.credential_probe',configured:false,ok:false}));
    return {configured:false,ok:false};
  }
  const notification={
    id:'00000000-0000-4000-8000-000000009626',
    userId:'__zovro_probe_no_real_user__',
    title:'ZOVRO',
    text:'Credential verification probe',
    meta:{probe:true}
  };
  try{
    const result=await push.deliver(notification);
    const out={event:'onesignal.credential_probe',configured:true,ok:result?.ok===true,messageIdPresent:!!result?.id};
    console.log(JSON.stringify(out));
    return out;
  }catch(error){
    const out={event:'onesignal.credential_probe',configured:true,ok:false,status:error.status||null};
    console.log(JSON.stringify(out));
    return out;
  }
}
module.exports={runPushCredentialProbe};
