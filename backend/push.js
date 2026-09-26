'use strict';
const APP_ID=String(process.env.ONESIGNAL_APP_ID||'').trim();
const REST_KEY=String(process.env.ONESIGNAL_REST_API_KEY||'').trim();
const API='https://api.onesignal.com/notifications';
let credentialState={checked:false,verified:false,status:null};
function configured(){return /^[0-9a-f-]{36}$/i.test(APP_ID)&&REST_KEY.length>=16}
async function validateCredentials(){
  if(!configured()){credentialState={checked:true,verified:false,status:null};return credentialState;}
  try{
    const url=`${API}?app_id=${encodeURIComponent(APP_ID)}&limit=1&offset=0`;
    const res=await fetch(url,{method:'GET',headers:{accept:'application/json',authorization:`Key ${REST_KEY}`}});
    let error=null;
    if(!res.ok){
      const body=await res.text().catch(()=> '');
      error=String(body||res.statusText||'').replace(/os_v2_[A-Za-z0-9_\-]+/g,'[redacted]').slice(0,300);
    }
    credentialState={checked:true,verified:res.ok,status:res.status,error};
    return credentialState;
  }catch{credentialState={checked:true,verified:false,status:null};return credentialState;}
}
function credentialStatus(){return {...credentialState}}
async function deliver(notification){
  if(!configured()||!notification?.id||!notification?.userId)return {skipped:true};
  const payload={
    app_id:APP_ID,
    target_channel:'push',
    include_aliases:{external_id:[String(notification.userId)]},
    headings:{en:String(notification.title||'ZOVRO').slice(0,120)},
    contents:{en:String(notification.text||'').slice(0,500)},
    data:{zovro_notification_id:String(notification.id),...(notification.meta||{})},
    idempotency_key:String(notification.id),
    ttl:86400
  };
  const res=await fetch(API,{method:'POST',headers:{'content-type':'application/json',authorization:`Key ${REST_KEY}`},body:JSON.stringify(payload)});
  const data=await res.json().catch(()=>({}));
  if(!res.ok){const e=new Error(data?.errors?.[0]||data?.error||`OneSignal request failed (${res.status})`);e.status=res.status;throw e}
  return {ok:true,id:data.id||null};
}
function deliverMany(rows){
  if(!configured()||!Array.isArray(rows)||!rows.length)return;
  for(const n of rows.slice(0,100)) deliver(n).catch(e=>console.error(JSON.stringify({event:'onesignal.delivery_failed',notificationId:n?.id||null,status:e.status||null,message:e.message})));
}
module.exports={configured,validateCredentials,credentialStatus,deliver,deliverMany};
