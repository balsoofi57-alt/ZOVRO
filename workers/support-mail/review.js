'use strict';
const {config,SUPPORT}=require('./bridge');
const pending=['human_review','delivery_unconfirmed','reserved','oversized','skipped'];
const resolutions=['answered_manually','no_action','verified_delivered'];
const keyPattern=/^[a-f0-9]{64}$/;
function parseArgs(args){
 const [action='list',key,...rest]=args;
 if(['list','summary'].includes(action)&&args.length<=1)return {action};
 if(action==='inspect'&&keyPattern.test(key||'')&&rest.length===0)return {action,key};
 if(action==='resolve'&&keyPattern.test(key||'')&&rest.length===4&&rest[0]==='--resolution'&&resolutions.includes(rest[1])&&rest[2]==='--confirm'&&rest[3]===key)return {action,key,resolution:rest[1]};
 throw Error('Use list, summary, inspect KEY, or resolve KEY --resolution answered_manually|no_action|verified_delivered --confirm KEY');
}
async function listPending(db){
 return (await db.query(`SELECT r.message_key,r.uid,r.uid_validity,r.status,r.answer_id,r.created_at
FROM zovro_support_mail_receipts r LEFT JOIN zovro_support_mail_reviews v USING(message_key)
WHERE r.mailbox=$1 AND r.status=ANY($2::text[]) AND v.message_key IS NULL
AND (r.status<>'reserved' OR r.updated_at<now()-interval '10 minutes')
ORDER BY r.created_at,r.message_key LIMIT 100`,[SUPPORT,pending])).rows;
}
async function summary(db){
 return (await db.query(`SELECT r.status,count(*)::int AS count,min(r.created_at) AS oldest_pending
FROM zovro_support_mail_receipts r LEFT JOIN zovro_support_mail_reviews v USING(message_key)
WHERE r.mailbox=$1 AND r.status=ANY($2::text[]) AND v.message_key IS NULL
AND (r.status<>'reserved' OR r.updated_at<now()-interval '10 minutes') GROUP BY r.status ORDER BY r.status`,[SUPPORT,pending])).rows;
}
async function inspect(db,imap,key){
 if(!keyPattern.test(key||''))throw Error('Invalid review key');
 const row=(await db.query('SELECT uid,uid_validity,status FROM zovro_support_mail_receipts WHERE message_key=$1 AND mailbox=$2',[key,SUPPORT])).rows[0];
 if(!row)throw Error('Review record not found');
 const lock=await imap.getMailboxLock('INBOX',{readOnly:true});
 try{
  if(String(imap.mailbox.uidValidity)!==row.uid_validity)throw Error('Mailbox identity changed; do not inspect by old UID');
  const uid=Number(row.uid);if(!Number.isSafeInteger(uid)||uid<1)throw Error('Invalid message UID');
  // Fetch envelope only. Do not render HTML, open attachments, or mark mail read.
  const message=await imap.fetchOne(uid,{envelope:true},{uid:true});
  if(!message)throw Error('Original message is no longer in INBOX');
  const clean=value=>String(value||'').replace(/[\u0000-\u001f\u007f]/g,' ').slice(0,500);
  return {key,status:row.status,subject:clean(message.envelope?.subject),from:(message.envelope?.from||[]).slice(0,5).map(x=>clean(x.address)),messageId:clean(message.envelope?.messageId),instruction:'Find this message in the support inbox and review it manually. This command does not send or resolve it.'};
 }finally{lock.release();}
}
async function resolve(db,key,resolution){
 if(!keyPattern.test(key||'')||!resolutions.includes(resolution))throw Error('Invalid resolution');
 const result=await db.query(`INSERT INTO zovro_support_mail_reviews(message_key,resolution)
SELECT message_key,$2 FROM zovro_support_mail_receipts WHERE message_key=$1 AND mailbox=$3 AND status=ANY($4::text[])
AND (status<>'reserved' OR updated_at<now()-interval '10 minutes')
ON CONFLICT(message_key) DO NOTHING RETURNING message_key`,[key,resolution,SUPPORT,pending]);
 return {resolved:result.rowCount===1};
}
async function main(args=process.argv.slice(2)){
 const request=parseArgs(args);
 // Explicit operator commands work while the scheduled sender stays disabled.
 const cfg=config({...process.env,ZOVRO_SUPPORT_MAIL_MODE:'preview'});
 const {Client}=require('pg');const db=new Client({connectionString:cfg.databaseUrl,connectionTimeoutMillis:15000});let imap;
 try{
  await db.connect();let output;
  if(request.action==='list')output={pending:await listPending(db),limit:100};
  if(request.action==='summary')output={pending:await summary(db)};
  if(request.action==='resolve')output=await resolve(db,request.key,request.resolution);
  if(request.action==='inspect'){
   const {ImapFlow}=require('imapflow');
   imap=new ImapFlow({host:'mail.spacemail.com',port:993,secure:true,tls:{rejectUnauthorized:true},auth:{user:cfg.user,pass:cfg.password},logger:false,connectionTimeout:15000,socketTimeout:30000});
   await imap.connect();output=await inspect(db,imap,request.key);
  }
  console.log(JSON.stringify(output));
 }finally{if(imap)await imap.logout().catch(()=>{});await db.end().catch(()=>{});}
}
if(require.main===module)main().catch(()=>{console.error('Support review stopped. Verify arguments, schema, credentials and mailbox identity. No automatic reply was sent.');process.exitCode=1;});
module.exports={parseArgs,listPending,summary,inspect,resolve};
