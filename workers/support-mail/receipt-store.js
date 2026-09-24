'use strict';
const {SUPPORT}=require('./bridge');
const LIMITS=Object.freeze({senderHour:3,globalHour:30,globalDay:100});
async function reserveReceipt(db,record){
 await db.query('BEGIN');
 try{
  await db.query('SELECT pg_advisory_xact_lock(9262302)');
  if((await db.query('SELECT 1 FROM zovro_support_mail_receipts WHERE message_key=$1 OR (mailbox=$2 AND uid_validity=$3 AND uid=$4)',[record.key,SUPPORT,record.uidValidity,record.uid])).rows.length){await db.query('COMMIT');return false;}
  let status=record.status;
  if(status==='reserved'){
   if(!/^[a-f0-9]{64}$/.test(record.senderHash||''))throw Error('Sender identity required for rate accounting');
   const counts=(await db.query(`SELECT
count(*) FILTER(WHERE sender_hash=$2 AND created_at>now()-interval '1 hour')::int AS sender_hour,
count(*) FILTER(WHERE created_at>now()-interval '1 hour')::int AS global_hour,
count(*)::int AS global_day FROM zovro_support_mail_receipts
WHERE mailbox=$1 AND status=ANY($3::text[]) AND created_at>now()-interval '1 day'`,[SUPPORT,record.senderHash,['reserved','sent','delivery_unconfirmed']])).rows[0];
   if(counts.sender_hour>=LIMITS.senderHour||counts.global_hour>=LIMITS.globalHour||counts.global_day>=LIMITS.globalDay)status='rate_limited';
  }
  await db.query('INSERT INTO zovro_support_mail_receipts(message_key,mailbox,uid_validity,uid,status,answer_id,policy_version,sender_hash) VALUES($1,$2,$3,$4,$5,$6,$7,$8)',[record.key,SUPPORT,record.uidValidity,record.uid,status,record.answerId,record.policyVersion,record.senderHash||null]);
  await db.query('COMMIT');record.status=status;return true;
 }catch(error){await db.query('ROLLBACK').catch(()=>{});throw error;}
}
module.exports={reserveReceipt,LIMITS};
