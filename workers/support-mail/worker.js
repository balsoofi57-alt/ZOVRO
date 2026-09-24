'use strict';
const {config,processMessage,SUPPORT}=require('./bridge');
const {ensureSchema}=require('./schema');
async function run(){
 const cfg=config();if(cfg.mode==='disabled'){console.log('Support mail bridge disabled; no connections opened.');return;}
 const {ImapFlow}=require('imapflow'),{simpleParser}=require('mailparser'),nodemailer=require('nodemailer'),{Client}=require('pg');
 const db=new Client({connectionString:cfg.databaseUrl,connectionTimeoutMillis:15000});
 const imap=new ImapFlow({host:'mail.spacemail.com',port:993,secure:true,tls:{rejectUnauthorized:true},auth:{user:cfg.user,pass:cfg.password},logger:false,connectionTimeout:15000,socketTimeout:30000});
 const smtp=nodemailer.createTransport({host:'mail.spacemail.com',port:465,secure:true,tls:{rejectUnauthorized:true},auth:{user:cfg.user,pass:cfg.password},logger:false,debug:false,connectionTimeout:15000,socketTimeout:30000,disableFileAccess:true,disableUrlAccess:true});
 let stop=false,lock;
 const shutdown=()=>{stop=true};process.on('SIGTERM',shutdown);process.on('SIGINT',shutdown);
 try{
  await db.connect();
  const locked=await db.query('SELECT pg_try_advisory_lock(9262301) AS acquired');if(!locked.rows[0].acquired)throw Error('Another support mail run is active');
  await ensureSchema(db);
  await imap.connect();lock=await imap.getMailboxLock('INBOX',{readOnly:true});
  const validity=String(imap.mailbox.uidValidity),latest=Number(imap.mailbox.uidNext)-1;
  const saved=await db.query('SELECT * FROM zovro_support_mail_cursor WHERE mailbox=$1',[SUPPORT]);
  if(!saved.rows.length){
   if(!process.argv.includes('--initialize'))throw Error('Initialize the mailbox cursor explicitly before processing');
   await db.query('INSERT INTO zovro_support_mail_cursor VALUES($1,$2,$3)',[SUPPORT,validity,latest]);console.log('Mailbox cursor initialized; existing messages will not be answered.');return;
  }
  if(process.argv.includes('--initialize'))throw Error('Mailbox already initialized; cursor was not changed');
  if(saved.rows[0].uid_validity!==validity)throw Error('Mailbox UID validity changed; manual review required');
  const cursor=Number(saved.rows[0].last_uid);if(latest<=cursor)return;
  const ids=(await imap.search({uid:(cursor+1)+':'+latest},{uid:true})).filter(uid=>uid>cursor&&uid<=latest).sort((a,b)=>a-b).slice(0,25);
  const store={
   reserve:async r=>(await db.query('INSERT INTO zovro_support_mail_receipts(message_key,mailbox,uid_validity,uid,status,answer_id,policy_version) VALUES($1,$2,$3,$4,$5,$6,$7) ON CONFLICT DO NOTHING RETURNING message_key',[r.key,SUPPORT,r.uidValidity,r.uid,r.status,r.answerId,r.policyVersion])).rowCount===1,
   finish:async(key,status)=>db.query('UPDATE zovro_support_mail_receipts SET status=$2,updated_at=now() WHERE message_key=$1',[key,status])
  };
  for(const uid of ids){
   if(stop)break;
   const meta=await imap.fetchOne(uid,{size:true},{uid:true});
   if(!meta)continue;
   let result='oversized';
   if(meta.size<=262144){
    const message=await imap.fetchOne(uid,{source:true},{uid:true});if(!message)continue;
    const mail=await simpleParser(message.source,{skipHtmlToText:true,skipTextToHtml:true,skipImageLinks:true,maxHtmlLengthToParse:262144});
    result=await processMessage({mail,uid,uidValidity:validity,mode:cfg.mode,store,send:async data=>{const out=await smtp.sendMail(data);if(!out.accepted?.includes(data.to))throw Error('Recipient was not accepted');}});
   }else{
    const key=require('node:crypto').createHash('sha256').update(SUPPORT+'\0oversized:'+validity+':'+uid).digest('hex');
    await store.reserve({key,uid,uidValidity:validity,status:'oversized',answerId:null,policyVersion:null});
   }
   await db.query('UPDATE zovro_support_mail_cursor SET last_uid=$2 WHERE mailbox=$1',[SUPPORT,uid]);
   // No sender addresses, subjects, message bodies, credentials or raw errors in logs.
   console.log(JSON.stringify({event:'support_mail_processed',status:result}));
  }
 }finally{
  if(lock)lock.release();await imap.logout().catch(()=>{});smtp.close();await db.end().catch(()=>{});process.off('SIGTERM',shutdown);process.off('SIGINT',shutdown);
 }
}
if(require.main===module)run().catch(()=>{console.error('Support mail bridge stopped; verify configuration/connectivity and review unconfirmed deliveries.');process.exitCode=1});
module.exports={run};
