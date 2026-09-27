'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {reserveReceipt}=require('./receipt-store');
const record=()=>({key:'a'.repeat(64),senderHash:'b'.repeat(64),uid:1,uidValidity:'1',status:'reserved'});
function fixture(counts={sender_hour:0,global_hour:0,global_day:0},{duplicate=false,failInsert=false}={}){
 const calls=[];return {calls,db:{query:async(sql,params)=>{calls.push({sql,params});if(sql.startsWith('SELECT 1'))return {rows:duplicate?[{}]:[]};if(sql.startsWith('SELECT\ncount'))return {rows:[counts]};if(sql.startsWith('INSERT')&&failInsert)throw Error('insert failed');return {rows:[]}}}};
}
test('reservation checks and inserts commit before authorizing a send',async()=>{const f=fixture(),r=record();assert.equal(await reserveReceipt(f.db,r),true);assert.equal(r.status,'reserved');assert.equal(f.calls[0].sql,'BEGIN');assert.equal(f.calls.at(-1).sql,'COMMIT');assert.match(f.calls[1].sql,/pg_advisory_xact_lock/)});
test('sender hourly, global hourly and global daily budgets each block excess mail',async()=>{for(const counts of [{sender_hour:3,global_hour:3,global_day:3},{sender_hour:0,global_hour:30,global_day:30},{sender_hour:0,global_hour:0,global_day:100}]){const f=fixture(counts),r=record();await reserveReceipt(f.db,r);assert.equal(r.status,'rate_limited');assert.equal(f.calls.find(c=>c.sql.startsWith('INSERT')).params[4],'rate_limited')}});
test('duplicates consume no rate reservation and database failure cannot allow a send',async()=>{const d=fixture(undefined,{duplicate:true});assert.equal(await reserveReceipt(d.db,record()),false);assert.equal(d.calls.some(c=>c.sql.startsWith('INSERT')),false);const f=fixture(undefined,{failInsert:true}),r=record();await assert.rejects(reserveReceipt(f.db,r),/insert failed/);assert.equal(f.calls.at(-1).sql,'ROLLBACK');assert.equal(f.calls.some(c=>c.sql==='COMMIT'),false)});
test('non-send receipts remain durable without using send budgets',async()=>{const f=fixture(),r={...record(),status:'human_review',senderHash:null};await reserveReceipt(f.db,r);assert.equal(f.calls.some(c=>c.sql.startsWith('SELECT\ncount')),false);assert.equal(r.status,'human_review')});
