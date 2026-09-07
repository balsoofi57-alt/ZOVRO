'use strict';
const fs=require('fs'),path=require('path');
const {DatabaseSync}=require('node:sqlite');
const DATA=path.join(__dirname,'data'), SQLITE=path.join(DATA,'zovro.sqlite'), LEGACY=path.join(DATA,'db.json');
fs.mkdirSync(DATA,{recursive:true});
const db=new DatabaseSync(SQLITE);
db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS meta(key TEXT PRIMARY KEY,value TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY,data TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS service_requests(id TEXT PRIMARY KEY,customer_id TEXT,provider_id TEXT,status TEXT,created_at TEXT,data TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS messages(id TEXT PRIMARY KEY,request_id TEXT,user_id TEXT,created_at TEXT,data TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS ratings(id TEXT PRIMARY KEY,request_id TEXT,provider_id TEXT,customer_id TEXT,created_at TEXT,data TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS audit_log(id TEXT PRIMARY KEY,user_id TEXT,created_at TEXT,data TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS verification_requests(id TEXT PRIMARY KEY,provider_id TEXT,status TEXT,created_at TEXT,data TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS provider_locations(provider_id TEXT PRIMARY KEY,updated_at TEXT,data TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS device_sessions(id TEXT PRIMARY KEY,user_id TEXT,data TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS notifications(id TEXT PRIMARY KEY,user_id TEXT,created_at TEXT,data TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS idx_requests_customer ON service_requests(customer_id);
CREATE INDEX IF NOT EXISTS idx_requests_provider ON service_requests(provider_id);
CREATE INDEX IF NOT EXISTS idx_messages_request ON messages(request_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id,created_at);`);
const shape=d=>{d=d||{};d.schemaVersion=5;for(const k of ['users','requests','messages','ratings','audit','verificationRequests','providerLocations','deviceSessions','notifications'])if(!Array.isArray(d[k]))d[k]=[];return d};
function rows(table){return db.prepare(`SELECT data FROM ${table}`).all().map(r=>JSON.parse(r.data))}
function readDb(){return shape({schemaVersion:5,users:rows('users'),requests:rows('service_requests'),messages:rows('messages'),ratings:rows('ratings'),audit:rows('audit_log'),verificationRequests:rows('verification_requests'),providerLocations:rows('provider_locations'),deviceSessions:rows('device_sessions'),notifications:rows('notifications')})}
function replace(table,items,sql,params){db.exec(`DELETE FROM ${table}`);const st=db.prepare(sql);for(const x of items)st.run(...params(x))}
function writeDb(input){const d=shape(input);db.exec('BEGIN IMMEDIATE');try{
 replace('users',d.users,'INSERT INTO users(id,data) VALUES(?,?)',x=>[x.id,JSON.stringify(x)]);
 replace('service_requests',d.requests,'INSERT INTO service_requests(id,customer_id,provider_id,status,created_at,data) VALUES(?,?,?,?,?,?)',x=>[x.id,x.customerId||null,x.providerId||null,x.status||null,x.createdAt||null,JSON.stringify(x)]);
 replace('messages',d.messages,'INSERT INTO messages(id,request_id,user_id,created_at,data) VALUES(?,?,?,?,?)',x=>[x.id,x.requestId||null,x.userId||null,x.createdAt||null,JSON.stringify(x)]);
 replace('ratings',d.ratings,'INSERT INTO ratings(id,request_id,provider_id,customer_id,created_at,data) VALUES(?,?,?,?,?,?)',x=>[x.id,x.requestId||null,x.providerId||null,x.customerId||null,x.createdAt||null,JSON.stringify(x)]);
 replace('audit_log',d.audit,'INSERT INTO audit_log(id,user_id,created_at,data) VALUES(?,?,?,?)',x=>[x.id,x.user||null,x.at||null,JSON.stringify(x)]);
 replace('verification_requests',d.verificationRequests,'INSERT INTO verification_requests(id,provider_id,status,created_at,data) VALUES(?,?,?,?,?)',x=>[x.id,x.providerId||null,x.status||null,x.createdAt||null,JSON.stringify(x)]);
 replace('provider_locations',d.providerLocations,'INSERT INTO provider_locations(provider_id,updated_at,data) VALUES(?,?,?)',x=>[x.providerId,x.updatedAt||null,JSON.stringify(x)]);
 replace('device_sessions',d.deviceSessions,'INSERT INTO device_sessions(id,user_id,data) VALUES(?,?,?)',x=>[x.id||x.token||require('crypto').randomUUID(),x.userId||null,JSON.stringify(x)]);
 replace('notifications',d.notifications,'INSERT INTO notifications(id,user_id,created_at,data) VALUES(?,?,?,?)',x=>[x.id,x.userId||null,x.createdAt||null,JSON.stringify(x)]);
 db.prepare("INSERT OR REPLACE INTO meta(key,value) VALUES('schemaVersion','5')").run();db.exec('COMMIT');}catch(e){db.exec('ROLLBACK');throw e}}
function migrateLegacy(){const count=db.prepare('SELECT COUNT(*) n FROM users').get().n;if(count===0&&fs.existsSync(LEGACY)){try{const old=JSON.parse(fs.readFileSync(LEGACY,'utf8'));writeDb(old);fs.renameSync(LEGACY,LEGACY+'.stage13.backup');console.log('Migrated legacy JSON data to SQLite.')}catch(e){console.error('Legacy migration skipped:',e.message)}}}
migrateLegacy();
function closeDb(){try{db.exec('PRAGMA wal_checkpoint(TRUNCATE)')}catch{}try{db.close()}catch{}}
module.exports={readDb,writeDb,closeDb,dbInfo:()=>({engine:'sqlite',schemaVersion:5,file:SQLITE})};
