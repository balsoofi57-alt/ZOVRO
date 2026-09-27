'use strict';
const {config,SUPPORT,TEST_RECIPIENT}=require('./bridge');
const {summary}=require('./review');
const {assess}=require('./monitor');
async function ensureAlerts(db){
 await db.query(`CREATE TABLE IF NOT EXISTS zovro_support_mail_alerts(id bigserial PRIMARY KEY,kind text NOT NULL CHECK(kind IN ('test','urgent','overdue')),status text NOT NULL,created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS zovro_support_mail_alerts_recent ON zovro_support_mail_alerts(kind,created_at);`);
}
async function notify({db,send,result,test=false}){
 if(!test&&!result.attentionRequired)return 'healthy';
 const kind=test?'test':result.urgent>0?'urgent':'overdue';
 const hours=kind==='urgent'?1:kind==='overdue'?6:24;
 let id;
 await db.query('BEGIN');
 try{
  await db.query('SELECT pg_advisory_xact_lock(9262303)');
  const recent=await db.query("SELECT 1 FROM zovro_support_mail_alerts WHERE kind=$1 AND created_at>now()-($2::int*interval '1 hour') LIMIT 1",[kind,hours]);
  if(recent.rows.length){await db.query('COMMIT');return 'throttled';}
  id=(await db.query("INSERT INTO zovro_support_mail_alerts(kind,status) VALUES($1,'reserved') RETURNING id",[kind])).rows[0].id;
  await db.query('COMMIT');
 }catch(error){await db.query('ROLLBACK').catch(()=>{});throw error;}
 // Reserve before SMTP. Every uncertain attempt consumes its notification window.
 const subject=test?'ZOVRO Support — alert connection test':'ZOVRO Support — '+kind+' review alert';
 const text=test?'تم ربط تنبيهات دعم ZOVRO ببريد الشركة. هذه رسالة اختبار، ولا تعني تفعيل الردود التلقائية للعملاء.\n\nZOVRO support alert delivery test. Customer auto-replies remain separately controlled.':`تنبيه دعم ZOVRO: توجد رسائل تحتاج مراجعة.\nPending: ${result.pending}\nUncertain deliveries: ${result.urgent}\nRecords in overdue categories: ${result.overdue}\n\nOpen the support inbox and run the protected review queue. Do not retry uncertain deliveries automatically. This alert does not contain customer message content.`;
 let status='sent';
 try{await send({from:SUPPORT,to:TEST_RECIPIENT,subject,text,messageId:`<zovro-support-alert-${id}@zovro.work>`,headers:{'Auto-Submitted':'auto-generated','X-Auto-Response-Suppress':'All'}});}
 catch{status='delivery_unconfirmed';}
 await db.query('UPDATE zovro_support_mail_alerts SET status=$2,updated_at=now() WHERE id=$1',[id,status]);
 return status;
}
async function main(args=process.argv.slice(2)){
 if(args.length!==1||!['--notify','--test'].includes(args[0]))throw Error('Use --notify or --test');
 const cfg=config({...process.env,ZOVRO_SUPPORT_MAIL_MODE:'preview'});
 const {Client}=require('pg'),nodemailer=require('nodemailer');
 const db=new Client({connectionString:cfg.databaseUrl,connectionTimeoutMillis:10000,statement_timeout:15000});let smtp;
 try{
  await db.connect();await ensureAlerts(db);
  const result=assess(await summary(db));
  smtp=nodemailer.createTransport({host:'mail.spacemail.com',port:465,secure:true,tls:{rejectUnauthorized:true},auth:{user:cfg.user,pass:cfg.password},logger:false,debug:false,connectionTimeout:10000,socketTimeout:20000,disableFileAccess:true,disableUrlAccess:true});
  const status=await notify({db,result,test:args[0]==='--test',send:async data=>{const out=await smtp.sendMail(data);if(!out.accepted?.includes(TEST_RECIPIENT))throw Error('Alert recipient not accepted');}});
  console.log(JSON.stringify({event:'support_mail_alert',status}));
  if(status==='delivery_unconfirmed')process.exitCode=1;
 }finally{if(smtp)smtp.close();await db.end().catch(()=>{});}
}
if(require.main===module)main().catch(()=>{console.error('Support alert check failed; inspect hosting logs and database connectivity.');process.exitCode=1;});
module.exports={notify,ensureAlerts};
