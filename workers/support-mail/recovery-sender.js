'use strict';
const {config,SUPPORT}=require('./bridge');

function recoveryConfig(env=process.env){
  const cfg=config({...env,ZOVRO_SUPPORT_MAIL_MODE:'preview'});
  const apiBase=String(env.ZOVRO_RECOVERY_API_BASE||'').replace(/\/$/,'');
  const token=String(env.ZOVRO_RECOVERY_WORKER_TOKEN||'');
  if(!/^https:\/\//.test(apiBase))throw Error('ZOVRO_RECOVERY_API_BASE must be an https URL');
  if(token.length<32)throw Error('ZOVRO_RECOVERY_WORKER_TOKEN must be at least 32 characters');
  return {...cfg,apiBase,token};
}
async function api(cfg,path,options={}){
  const res=await fetch(cfg.apiBase+path,{...options,headers:{'content-type':'application/json','x-zovro-recovery-worker-token':cfg.token,...(options.headers||{})},signal:AbortSignal.timeout(15000)});
  const data=await res.json().catch(()=>({}));
  if(!res.ok)throw Error(data.error||('Recovery API failed '+res.status));
  return data;
}
function recoveryMail(task){
  return {
    from:SUPPORT,to:task.email,
    subject:'ZOVRO password reset code',
    text:'Your ZOVRO password reset code is '+task.code+'.\n\nThis code expires soon. If you did not request a password reset, ignore this message. Do not share this code with anyone.\n\nZOVRO Support',
    messageId:'<zovro-recovery-'+task.id+'@zovro.work>',
    headers:{'Auto-Submitted':'auto-generated','X-Auto-Response-Suppress':'All'}
  };
}
async function run(env=process.env,transportFactory){
  const cfg=recoveryConfig(env);
  const nodemailer=transportFactory?null:require('nodemailer');
  const smtp=transportFactory?transportFactory(cfg):nodemailer.createTransport({host:'mail.spacemail.com',port:465,secure:true,tls:{rejectUnauthorized:true},auth:{user:cfg.user,pass:cfg.password},logger:false,debug:false,connectionTimeout:10000,socketTimeout:20000,disableFileAccess:true,disableUrlAccess:true});
  try{
    const {tasks}=await api(cfg,'/api/internal/recovery-email/tasks',{method:'GET'});
    for(const task of tasks||[]){
      let delivered=false;
      try{
        const out=await smtp.sendMail(recoveryMail(task));
        delivered=Array.isArray(out.accepted)&&out.accepted.includes(task.email);
      }catch{}
      await api(cfg,'/api/internal/recovery-email/result',{method:'POST',body:JSON.stringify({id:task.id,delivered})});
    }
    console.log(JSON.stringify({event:'password_recovery_email_cycle',tasks:(tasks||[]).length}));
  }finally{if(smtp?.close)smtp.close();}
}
if(require.main===module)run().catch(()=>{console.error('Password recovery email cycle failed.');process.exitCode=1});
module.exports={recoveryConfig,recoveryMail,run};
