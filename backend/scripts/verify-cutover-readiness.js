'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const {DatabaseSync}=require('node:sqlite');
const {Client}=require('pg');

const DATABASE_URL=String(process.env.DATABASE_URL||'').trim();
if(!DATABASE_URL){console.error('DATABASE_URL is required.');process.exit(1)}
const dataDir=process.env.ZOVRO_DATA_DIR?path.resolve(process.env.ZOVRO_DATA_DIR):path.join(__dirname,'..','data');
const sqlitePath=path.join(dataDir,'zovro.sqlite');
if(!fs.existsSync(sqlitePath)){console.error('SQLite source not found: '+sqlitePath);process.exit(1)}

const TABLES=['users','service_requests','messages','ratings','audit_log','verification_requests','provider_locations','device_sessions','notifications'];
const PK={users:'id',service_requests:'id',messages:'id',ratings:'id',audit_log:'id',verification_requests:'id',provider_locations:'provider_id',device_sessions:'id',notifications:'id'};
const canonical=value=>JSON.stringify(value&&typeof value==='object'?sortObject(value):value);
function sortObject(value){if(Array.isArray(value))return value.map(sortObject);if(!value||typeof value!=='object')return value;return Object.fromEntries(Object.keys(value).sort().map(k=>[k,sortObject(value[k])]));}
const hashRows=rows=>crypto.createHash('sha256').update(rows.map(r=>canonical(r)).sort().join('\n')).digest('hex');

(async()=>{
 const sqlite=new DatabaseSync(sqlitePath,{readOnly:true});
 const pg=new Client({connectionString:DATABASE_URL,ssl:process.env.PGSSLMODE==='disable'?false:{rejectUnauthorized:false}});
 const result={ok:false,modeRequired:'mirror',sqlitePath,tables:{},totalLocal:0,totalRemote:0,mismatches:[]};
 try{
  await pg.connect();
  const schema=await pg.query("select value from meta where key='schemaVersion'");
  result.schemaVersion=schema.rows[0]?.value||null;
  if(result.schemaVersion!=='5')result.mismatches.push('schemaVersion');
  for(const table of TABLES){
   const pk=PK[table];
   const local=sqlite.prepare(`SELECT ${pk} AS pk,data FROM ${table} ORDER BY ${pk}`).all().map(r=>({pk:String(r.pk),data:JSON.parse(r.data)}));
   const remote=(await pg.query(`SELECT ${pk} AS pk,data FROM ${table} ORDER BY ${pk}`)).rows.map(r=>({pk:String(r.pk),data:r.data}));
   const localHash=hashRows(local),remoteHash=hashRows(remote);
   result.tables[table]={localCount:local.length,remoteCount:remote.length,localHash,remoteHash,match:local.length===remote.length&&localHash===remoteHash};
   result.totalLocal+=local.length;result.totalRemote+=remote.length;
   if(!result.tables[table].match)result.mismatches.push(table);
  }
  result.nonEmpty=result.totalLocal>0&&result.totalRemote>0;
  if(!result.nonEmpty)result.mismatches.push('nonEmptyRepresentativeData');
  result.ok=result.schemaVersion==='5'&&result.nonEmpty&&result.mismatches.length===0;
  console.log(JSON.stringify(result,null,2));
  if(!result.ok)process.exitCode=2;
 }catch(e){console.error(e.stack||e.message||String(e));process.exitCode=1}
 finally{try{sqlite.close()}catch{}try{await pg.end()}catch{}}
})();
