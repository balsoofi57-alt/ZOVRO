'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {notify}=require('./alerts');
function fixture({recent=false,fail=false}={}){
 const queries=[],sent=[];
 return {queries,sent,db:{async query(sql,params){queries.push([sql,params]);if(sql.startsWith('SELECT 1'))return {rows:recent?[{}]:[]};if(sql.startsWith('INSERT'))return {rows:[{id:'1'}]};return {rows:[]};}},send:async data=>{sent.push(data);if(fail)throw Error('ambiguous');}};
}
const result={attentionRequired:true,pending:2,urgent:1,overdue:0};
test('alerts only target company mailbox after committed reservation',async()=>{
 const f=fixture();f.send=async data=>{assert.equal(f.queries.at(-1)[0],'COMMIT');f.sent.push(data);};
 assert.equal(await notify({...f,result}),'sent');assert.equal(f.sent[0].to,'zovro.llc@gmail.com');assert.equal(f.sent[0].headers['Auto-Submitted'],'auto-generated');assert.equal(f.queries.at(-1)[1][1],'sent');
});
test('healthy and throttled checks cannot send',async()=>{
 const f=fixture();assert.equal(await notify({...f,result:{attentionRequired:false}}),'healthy');assert.equal(f.queries.length,0);assert.equal(f.sent.length,0);
 const limited=fixture({recent:true});assert.equal(await notify({...limited,result}),'throttled');assert.equal(limited.sent.length,0);
});
test('uncertain alert delivery is retained and database reservation failure prevents SMTP',async()=>{
 const f=fixture({fail:true});assert.equal(await notify({...f,result}),'delivery_unconfirmed');assert.equal(f.queries.at(-1)[1][1],'delivery_unconfirmed');
 const blocked=fixture();blocked.db.query=async()=>{throw Error('unavailable');};await assert.rejects(notify({...blocked,result}));assert.equal(blocked.sent.length,0);
});
test('test alert has a separate daily throttle and never states customers are activated',async()=>{
 const f=fixture();assert.equal(await notify({...f,result:{attentionRequired:false},test:true}),'sent');assert.deepEqual(f.queries.find(q=>q[0].startsWith('SELECT 1'))[1],['test',24]);assert.match(f.sent[0].text,/لا تعني تفعيل/);
});
