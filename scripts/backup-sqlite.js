'use strict';
// Online SQLite snapshot; never imports application startup or writes to the source.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {DatabaseSync,backup}=require('node:sqlite');
async function snapshot(source,destination){
 source=fs.realpathSync(source);destination=path.resolve(destination);
 if(!fs.statSync(source).isFile())throw new Error('Source must be an existing SQLite file');
 const oldMask=process.umask(0o077);let created=false,db;
 try{
  fs.mkdirSync(destination,{mode:0o700});created=true;
  db=new DatabaseSync(source,{readOnly:true});
  const target=path.join(destination,'zovro.sqlite');
  await backup(db,target);db.close();db=null;
  fs.chmodSync(target,0o600);
  const check=new DatabaseSync(target,{readOnly:true});let tables;
  try{
   const integrity=check.prepare('PRAGMA integrity_check').all();
   if(integrity.length!==1||integrity[0].integrity_check!=='ok')throw new Error('Backup integrity check failed');
   tables={};
   for(const {name} of check.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all()){
    const quoted='"'+name.replaceAll('"','""')+'"';
    tables[name]=check.prepare('SELECT COUNT(*) AS n FROM '+quoted).get().n;
   }
  }finally{check.close()}
  const manifest={createdAt:new Date().toISOString(),file:'zovro.sqlite',sha256:crypto.createHash('sha256').update(fs.readFileSync(target)).digest('hex'),integrity:'ok',tables};
  fs.writeFileSync(path.join(destination,'manifest.json'),JSON.stringify(manifest,null,2)+'\n',{flag:'wx',mode:0o600});
  return manifest;
 }catch(error){if(db)db.close();if(created)fs.rmSync(destination,{recursive:true,force:true});throw error}
 finally{process.umask(oldMask)}
}
if(require.main===module){const [source,destination]=process.argv.slice(2);if(!source||!destination){console.error('Usage: node scripts/backup-sqlite.js <existing-database> <new-private-directory>');process.exitCode=1}else snapshot(source,destination).then(m=>console.log(JSON.stringify({ok:true,integrity:m.integrity,sha256:m.sha256,tables:m.tables}))).catch(()=>{console.error('Backup failed; source was not modified. Check source access and use a new destination directory.');process.exitCode=1})}
module.exports={snapshot};
