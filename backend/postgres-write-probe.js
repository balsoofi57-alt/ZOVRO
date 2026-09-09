'use strict';
const crypto=require('crypto');
let Client=null;try{Client=require('pg').Client}catch{}
const URL=String(process.env.DATABASE_URL||'').trim();
const ssl=process.env.PGSSLMODE==='disable'?false:{rejectUnauthorized:false};
async function runPostgresWriteProbe(){
 if(!URL)throw Error('DATABASE_URL is required for postgres write probe');
 if(!Client)throw Error('pg runtime is required for postgres write probe');
 const c=new Client({connectionString:URL,ssl});
 const id='probe-'+crypto.randomUUID();
 let result={ok:false,schemaVersion:null,writeRead:false,rollbackClean:false};
 await c.connect();
 try{
  const schema=await c.query("SELECT value FROM meta WHERE key='schemaVersion'");
  result.schemaVersion=schema.rows[0]?.value||null;
  if(result.schemaVersion!=='6')throw Error('Expected PostgreSQL schemaVersion 6');
  await c.query('BEGIN');
  const record={id,kind:'workflow:postgres-probe',user:null,requestId:null,providerId:null,status:'probe',at:new Date().toISOString(),updatedAt:new Date().toISOString(),data:{probe:true}};
  await c.query('INSERT INTO workflow_records(id,user_id,provider_id,request_id,kind,status,created_at,updated_at,data) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)',[record.id,null,null,null,record.kind,record.status,record.at,record.updatedAt,record]);
  const inside=await c.query('SELECT data FROM workflow_records WHERE id=$1',[id]);
  result.writeRead=inside.rows.length===1&&inside.rows[0].data?.id===id;
  if(!result.writeRead)throw Error('PostgreSQL write/read probe failed');
  await c.query('ROLLBACK');
  const after=await c.query('SELECT COUNT(*)::int AS n FROM workflow_records WHERE id=$1',[id]);
  result.rollbackClean=Number(after.rows[0]?.n||0)===0;
  if(!result.rollbackClean)throw Error('PostgreSQL probe rollback did not clean up');
  result.ok=true;
  console.log(JSON.stringify({event:'postgres_write_probe_pass',...result}));
  return result;
 }catch(e){
  try{await c.query('ROLLBACK')}catch{}
  console.error(JSON.stringify({event:'postgres_write_probe_failed',message:e.message,schemaVersion:result.schemaVersion,writeRead:result.writeRead,rollbackClean:result.rollbackClean}));
  throw e;
 }finally{await c.end().catch(()=>{})}
}
module.exports={runPostgresWriteProbe};
