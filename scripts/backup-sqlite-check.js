'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {DatabaseSync}=require('node:sqlite'),{snapshot}=require('./backup-sqlite');
(async()=>{const root=fs.mkdtempSync(path.join(os.tmpdir(),'zovro-backup-')),source=path.join(root,'source.sqlite'),dest=path.join(root,'snapshot');let db;
try{
 db=new DatabaseSync(source);db.exec('PRAGMA journal_mode=WAL; CREATE TABLE service_requests(id TEXT PRIMARY KEY,data TEXT);');
 db.prepare('INSERT INTO service_requests VALUES (?,?)').run('test','{"startCodeRequired":true,"startCodeLockedUntil":9999999999999}');
 const m=await snapshot(source,dest);assert.equal(m.tables.service_requests,1);assert.equal(m.integrity,'ok');
 assert.equal(fs.statSync(dest).mode&0o777,0o700);assert.equal(fs.statSync(path.join(dest,'zovro.sqlite')).mode&0o777,0o600);
 // Restore into a separate location and verify the WAL-backed record.
 const restored=path.join(root,'restored.sqlite');fs.copyFileSync(path.join(dest,'zovro.sqlite'),restored);
 const restore=new DatabaseSync(restored,{readOnly:true});try{assert.deepEqual(restore.prepare('SELECT * FROM service_requests').get(),db.prepare('SELECT * FROM service_requests').get())}finally{restore.close()}
 await assert.rejects(snapshot(source,dest));assert.ok(fs.existsSync(path.join(dest,'manifest.json')));
 await assert.rejects(snapshot(path.join(root,'missing.sqlite'),path.join(root,'missing-out')));assert.ok(!fs.existsSync(path.join(root,'missing.sqlite')));
 assert.equal(db.prepare('SELECT COUNT(*) AS n FROM service_requests').get().n,1);
 console.log('SQLite backup: online WAL snapshot, integrity, isolated restore, private permissions, missing source and overwrite refusal passed.');
}finally{if(db)db.close();fs.rmSync(root,{recursive:true,force:true})}})().catch(e=>{console.error(e);process.exitCode=1});
