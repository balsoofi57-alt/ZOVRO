'use strict';
const APP_ID=String(process.env.ONESIGNAL_APP_ID||'').trim();
const REST_KEY=String(process.env.ONESIGNAL_REST_API_KEY||'').trim();
const API='https://api.onesignal.com/notifications';
function configured(){return /^[0-9a-f-]{36}$/i.test(APP_ID)&&REST_KEY.length>=16}
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
module.exports={configured,deliver,deliverMany};
