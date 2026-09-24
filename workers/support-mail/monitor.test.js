'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {assess}=require('./monitor');
const now=Date.parse('2026-09-24T12:00:00Z');
const row=(status,count,age)=>({status,count,oldest_pending:new Date(now-age*60000).toISOString()});
test('monitor flags uncertain deliveries immediately and ordinary queues after one hour',()=>{
 assert.equal(assess([],now).attentionRequired,false);
 assert.equal(assess([row('human_review',1,59)],now).attentionRequired,false);
 assert.equal(assess([row('human_review',1,60)],now).attentionRequired,true);
 const result=assess([row('reserved',1,11),row('delivery_unconfirmed',2,0),row('rate_limited',3,90)],now);
 assert.deepEqual(result,{event:'support_mail_monitor',pending:6,urgent:3,overdue:3,attentionRequired:true});
});
test('monitor rejects malformed counts or dates instead of reporting healthy',()=>{
 for(const bad of [{count:-1,oldest_pending:new Date(now).toISOString()},{count:1,oldest_pending:'bad'},{count:1.5,oldest_pending:new Date(now).toISOString()}])assert.throws(()=>assess([bad],now));
});
