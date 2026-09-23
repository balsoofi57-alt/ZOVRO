'use strict';
const crypto=require('node:crypto');
const {prepareSupportEmail}=require('../../backend/support-email-draft');
const SUPPORT='support@zovro.work',TEST_RECIPIENT='zovro.llc@gmail.com';
const address=v=>String(v||'').trim().toLowerCase();
function config(env=process.env){
 const mode=env.ZOVRO_SUPPORT_MAIL_MODE||'disabled';
 if(!['disabled','preview','test'].includes(mode))throw Error('Only disabled, preview or owner-test mode is supported');
 if(mode==='disabled')return {mode};
 if(env.ZOVRO_SUPPORT_MAIL_USER!==SUPPORT||!env.ZOVRO_SUPPORT_MAIL_PASSWORD||!env.ZOVRO_SUPPORT_MAIL_DATABASE_URL)throw Error('Support mailbox and durable database configuration required');
 if(mode==='test'&&env.ZOVRO_SUPPORT_MAIL_TEST_RECIPIENT!==TEST_RECIPIENT)throw Error('Owner test recipient must be explicitly configured');
 return {mode,user:SUPPORT,password:env.ZOVRO_SUPPORT_MAIL_PASSWORD,databaseUrl:env.ZOVRO_SUPPORT_MAIL_DATABASE_URL};
}
function classify(mail){
 const h=name=>{const value=mail.headers?.get(name);return String(value?.value||value||'').toLowerCase()};
 const from=mail.from?.value||[],replyTo=mail.replyTo?.value||[];
 if(from.length!==1||!from[0].address||/[\r\n]/.test(from[0].address))return {skip:'invalid_sender'};
 const recipient=address(from[0].address);
 if(!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(recipient))return {skip:'invalid_sender'};
 if(recipient===SUPPORT||/^(mailer-daemon|postmaster|no-?reply|do-?not-?reply)@/.test(recipient))return {skip:'automated_sender'};
 if((h('auto-submitted')&&h('auto-submitted')!=='no')||/bulk|list|junk/.test(h('precedence'))||h('list-id')||h('x-auto-response-suppress')||h('content-type').includes('multipart/report'))return {skip:'automated_message'};
 if(replyTo.length&&(replyTo.length!==1||address(replyTo[0].address)!==recipient))return {skip:'different_reply_to'};
 const recipients=[...(mail.to?.value||[]),...(mail.cc?.value||[])].map(x=>address(x.address));
 if(!recipients.includes(SUPPORT))return {skip:'not_addressed_to_support'};
 if(mail.attachments?.length||!mail.text||mail.text.length>10000)return {skip:'requires_manual_reading'};
 return {recipient,decision:prepareSupportEmail({text:mail.text.trim()})};
}
async function processMessage({mail,uid,uidValidity,mode,store,send}){
 if(mode==='disabled')return 'disabled';
 if(!['preview','test'].includes(mode))throw Error('Invalid mode');
 const decision=classify(mail);
 const key=crypto.createHash('sha256').update(SUPPORT+'\0'+(mail.messageId||uidValidity+':'+uid)).digest('hex');
 const record={key,uid,uidValidity:String(uidValidity),answerId:decision.decision?.answerId||null,policyVersion:decision.decision?.policyVersion||null,status:decision.skip?'skipped':decision.decision.humanReviewRequired?'human_review':mode==='preview'?'preview':decision.recipient!==TEST_RECIPIENT?'not_test_recipient':'reserved'};
 // Reservation is committed before SMTP. Uncertain delivery is never retried automatically.
 if(!await store.reserve(record))return 'duplicate';
 if(record.status!=='reserved')return record.status;
 try{
  await send({from:SUPPORT,to:TEST_RECIPIENT,subject:'ZOVRO Support — automated policy test',text:decision.decision.body,messageId:'<zovro-support-'+key+'@zovro.work>',headers:{'Auto-Submitted':'auto-replied','X-Auto-Response-Suppress':'All'}});
  await store.finish(key,'sent');return 'sent';
 }catch{await store.finish(key,'delivery_unconfirmed');return 'delivery_unconfirmed';}
}
module.exports={config,classify,processMessage,SUPPORT,TEST_RECIPIENT};
