'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {parseArgs,listPending,summary,inspect,resolve}=require('./review');
const {SUPPORT}=require('./bridge');
const key='a'.repeat(64);
test('resolution needs an exact confirmation and a fixed disposition',()=>{
 assert.deepEqual(parseArgs([]),{action:'list'});
 assert.deepEqual(parseArgs(['inspect',key]),{action:'inspect',key});
 assert.deepEqual(parseArgs(['resolve',key,'--resolution','answered_manually','--confirm',key]),{action:'resolve',key,resolution:'answered_manually'});
 for(const args of [['resolve',key],['resolve',key,'--resolution','answered_manually','--confirm','b'.repeat(64)],['resolve',key,'--resolution','send_again','--confirm',key],['list','extra'],['inspect',"';DELETE FROM users;--"]])assert.throws(()=>parseArgs(args));
});
test('list and summary are mailbox-scoped read-only queries excluding resolved items',async()=>{
 const queries=[];const db={query:async(sql,params)=>{queries.push({sql,params});return {rows:[{status:'human_review',count:1}]}}};
 assert.equal((await listPending(db)).length,1);assert.equal((await summary(db))[0].count,1);
 for(const {sql,params} of queries){assert.match(sql,/^SELECT/);assert.match(sql,/v.message_key IS NULL/);assert.match(sql,/10 minutes/);assert.equal(params[0],SUPPORT);assert.ok(params[1].includes('delivery_unconfirmed'));assert.doesNotMatch(sql,/\b(DELETE|UPDATE|INSERT)\b/);}
});
test('inspection locks read-only, binds mailbox identity and fetches no message body',async()=>{
 let released=0;const db={query:async(sql,params)=>{assert.deepEqual(params,[key,SUPPORT]);return {rows:[{uid:'7',uid_validity:'9',status:'human_review'}]}}};
 const imap={mailbox:{uidValidity:9n},getMailboxLock:async(name,options)=>{assert.equal(name,'INBOX');assert.deepEqual(options,{readOnly:true});return {release:()=>released++}},fetchOne:async(uid,fields,options)=>{assert.equal(uid,7);assert.deepEqual(fields,{envelope:true});assert.deepEqual(options,{uid:true});return {envelope:{subject:'Hello\u001b\nworld',from:[{address:'owner@example.test'}],messageId:'<original@example.test>'}}}};
 const result=await inspect(db,imap,key);assert.equal(result.subject,'Hello  world');assert.equal(result.from[0],'owner@example.test');assert.equal(released,1);assert.equal(result.body,undefined);
 imap.mailbox.uidValidity=10n;imap.fetchOne=async()=>assert.fail('must not fetch a reused UID');await assert.rejects(inspect(db,imap,key),/identity changed/);assert.equal(released,2);
});
test('missing mail releases its lock and never changes the receipt',async()=>{
 let released=false;const db={query:async()=>({rows:[{uid:2,uid_validity:'1',status:'delivery_unconfirmed'}]})};
 const imap={mailbox:{uidValidity:1},getMailboxLock:async()=>({release:()=>{released=true}}),fetchOne:async()=>false};
 await assert.rejects(inspect(db,imap,key),/no longer/);assert.equal(released,true);
});
test('resolving preserves original send status and is idempotent',async()=>{
 let written=false;const db={query:async(sql,params)=>{assert.match(sql,/INSERT INTO zovro_support_mail_reviews/);assert.match(sql,/ON CONFLICT\(message_key\) DO NOTHING/);assert.doesNotMatch(sql,/\b(UPDATE|DELETE)\b/);assert.deepEqual(params.slice(0,3),[key,'verified_delivered',SUPPORT]);const rowCount=written?0:1;written=true;return {rowCount}}};
 assert.deepEqual(await resolve(db,key,'verified_delivered'),{resolved:true});assert.deepEqual(await resolve(db,key,'verified_delivered'),{resolved:false});
 await assert.rejects(resolve(db,key,'send_again'),/Invalid resolution/);
});
