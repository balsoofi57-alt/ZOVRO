'use strict';
const {config}=require('./bridge');
const {summary}=require('./review');
function assess(rows,now=Date.now()){
 let pending=0,urgent=0,overdue=0;
 for(const row of rows){
  const count=Number(row.count),oldest=Date.parse(row.oldest_pending);
  if(!Number.isSafeInteger(count)||count<0||!Number.isFinite(oldest))throw Error('Invalid health data');
  pending+=count;
  if(['reserved','delivery_unconfirmed'].includes(row.status))urgent+=count;
  if(now-oldest>=60*60*1000)overdue+=count;
 }
 return {event:'support_mail_monitor',pending,urgent,overdue,attentionRequired:urgent>0||overdue>0};
}
async function main(){
 // Read-only checks are explicit and independent of the disabled sending mode.
 const cfg=config({...process.env,ZOVRO_SUPPORT_MAIL_MODE:'preview'});
 const {Client}=require('pg');
 const db=new Client({connectionString:cfg.databaseUrl,connectionTimeoutMillis:15000,statement_timeout:15000});
 try{
  await db.connect();
  await db.query('BEGIN READ ONLY');
  const result=assess(await summary(db));
  await db.query('COMMIT');
  console.log(JSON.stringify(result));
  if(result.attentionRequired)process.exitCode=2;
 }finally{await db.end().catch(()=>{});}
}
if(require.main===module)main().catch(()=>{console.error('Support mail monitoring failed; check database access and schema.');process.exitCode=1;});
module.exports={assess};
