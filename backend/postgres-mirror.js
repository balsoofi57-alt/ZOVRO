'use strict';
const fs=require('fs'),path=require('path');
const URL=String(process.env.DATABASE_URL||'').trim();
let Client=null;try{Client=require('pg').Client}catch{}
const enabled=()=>Boolean(URL&&Client);
const ssl=process.env.PGSSLMODE==='disable'?false:{rejectUnauthorized:false};
const schema=()=>fs.readFileSync(path.join(__dirname,'postgres-schema.sql'),'utf8');
const tables=[
 ['users','id,data',x=>[x.id,x]],
 ['service_requests','id,customer_id,provider_id,status,created_at,data',x=>[x.id,x.customerId||null,x.providerId||null,x.status||null,x.createdAt||null,x]],
 ['messages','id,request_id,user_id,created_at,data',x=>[x.id,x.requestId||null,x.userId||null,x.createdAt||null,x]],
 ['ratings','id,request_id,provider_id,customer_id,created_at,data',x=>[x.id,x.requestId||null,x.providerId||null,x.customerId||null,x.createdAt||null,x]],
 ['audit_log','id,user_id,created_at,data',x=>[x.id,x.user||null,x.at||null,x]],
 ['workflow_records','id,type,user_id,provider_id,request_id,status,created_at,updated_at,data',x=>[x.id,x.type,x.user||null,x.providerId||null,x.requestId||null,x.status||null,x.at||null,x.updatedAt||x.at||null,x]],
 ['verification_requests','id,provider_id,status,created_at,data',x=>[x.id,x.providerId||null,x.status||null,x.createdAt||null,x]],
 ['provider_locations','provider_id,updated_at,data',x=>[x.providerId,x.updatedAt||null,x]],
 ['device_sessions','id,user_id,data',x=>[x.id||x.token,x.userId||null,x]],
 ['notifications','id,user_id,created_at,data',x=>[x.id,x.userId||null,x.createdAt||null,x]]
];
const keyMap={users:'users',service_requests:'requests',messages:'messages',ratings:'ratings',audit_log:'audit',workflow_records:'workflows',verification_requests:'verificationRequests',provider_locations:'providerLocations',device_sessions:'deviceSessions',notifications:'notifications'};
async function withClient(fn){const c=new Client({connectionString:URL,ssl});await c.connect();try{return await fn(c)}finally{await c.end().catch(()=>{})}}
async function initialize(){if(!enabled())return {enabled:false};return withClient(async c=>{await c.query(schema());return {enabled:true}})}
async function load(){if(!enabled())return null;return withClient(async c=>{const state={schemaVersion:6};let total=0;for(const [table] of tables){const r=await c.query(`SELECT data FROM ${table}`);const rows=r.rows.map(x=>x.data);state[keyMap[table]]=rows;total+=rows.length}return {state,total}})}
function placeholders(n){return Array.from({length:n},(_,i)=>'$'+(i+1)).join(',')}
async function persist(state){if(!enabled())return {enabled:false};return withClient(async c=>{await c.query('BEGIN');try{for(const [table,columns,map] of tables){await c.query(`DELETE FROM ${table}`);for(const x of state[keyMap[table]]||[]){const vals=map(x);await c.query(`INSERT INTO ${table}(${columns}) VALUES(${placeholders(vals.length)})`,vals)}}await c.query("INSERT INTO meta(key,value) VALUES('schemaVersion','6') ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value");await c.query('COMMIT');return {enabled:true}}catch(e){await c.query('ROLLBACK').catch(()=>{});throw e}})}
let queue=Promise.resolve();
function enqueue(state){if(!enabled())return;const snapshot=JSON.parse(JSON.stringify(state));queue=queue.then(()=>persist(snapshot)).catch(e=>console.error(JSON.stringify({event:'postgres_mirror_failed',message:e.message})));}
module.exports={enabled,initialize,load,persist,enqueue};
