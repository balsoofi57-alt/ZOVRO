'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {config,processMessage,SUPPORT,TEST_RECIPIENT}=require('./bridge');
const sender='customer@example.test';
function fixture(text='What is ZOVRO?'){
 const records=new Map(),sent=[];
 return {records,sent,args:{mail:{from:{value:[{address:sender}]},to:{value:[{address:SUPPORT}]},headers:new Map(),text,messageId:'<customer-fixture@example.test>',attachments:[]},uid:1,uidValidity:'17',mode:'customer',customerApproved:true,senderVerified:true,store:{async reserve(r){if(records.has(r.key))return false;records.set(r.key,{...r});return true;},async finish(key,status){records.get(key).status=status;}},send:async data=>{sent.push(data);}}};
}
test('customer mode requires separate exact approval in configuration and processing',async()=>{
 const env={ZOVRO_SUPPORT_MAIL_MODE:'customer',ZOVRO_SUPPORT_MAIL_USER:SUPPORT,ZOVRO_SUPPORT_MAIL_PASSWORD:'fixture',ZOVRO_SUPPORT_MAIL_DATABASE_URL:'postgresql://fixture:fixture@localhost/test'};
 for(const flag of [undefined,'true','YES','no'])assert.throws(()=>config({...env,ZOVRO_SUPPORT_MAIL_CUSTOMER_APPROVED:flag}));
 assert.equal(config({...env,ZOVRO_SUPPORT_MAIL_CUSTOMER_APPROVED:'yes'}).customerApproved,true);
 assert.deepEqual(config({...env,ZOVRO_SUPPORT_MAIL_MODE:'disabled',ZOVRO_SUPPORT_MAIL_CUSTOMER_APPROVED:'yes'}),{mode:'disabled'});
 for(const flag of [undefined,false,'true']){
  const f=fixture();await assert.rejects(processMessage({...f.args,customerApproved:flag}));assert.equal(f.records.size,0);assert.equal(f.sent.length,0);
 }
});
test('approved customer mode replies only to verified sender with policy and loop protections',async()=>{
 for(const [text,expected] of [['What is ZOVRO?',/Automated/],['ما هو ZOVRO؟',/رد آلي/],['¿Qué es ZOVRO?',/Respuesta automática/]]){
  const f=fixture(text);assert.equal(await processMessage(f.args),'sent');
  assert.equal(f.sent[0].to,sender);assert.equal(f.sent[0].subject,'ZOVRO Support — policy reply');
  assert.match(f.sent[0].text,expected);assert.equal(f.sent[0].headers['Auto-Submitted'],'auto-replied');
  assert.equal(await processMessage(f.args),'duplicate');assert.equal(f.sent.length,1);
 }
});
test('customer authentication, unknown questions, reply redirection and budgets prevent sends',async()=>{
 const unauth=fixture();assert.equal(await processMessage({...unauth.args,senderVerified:false}),'authentication_review');assert.equal(unauth.sent.length,0);
 const unknown=fixture('Guarantee my income');assert.equal(await processMessage(unknown.args),'human_review');assert.equal(unknown.sent.length,0);
 const redirected=fixture();redirected.args.mail.replyTo={value:[{address:TEST_RECIPIENT}]};assert.equal(await processMessage(redirected.args),'skipped');assert.equal(redirected.sent.length,0);
 const limited=fixture();limited.args.store.reserve=async r=>{r.status='rate_limited';return true;};assert.equal(await processMessage(limited.args),'rate_limited');assert.equal(limited.sent.length,0);
});
test('test and preview modes retain their existing recipient restriction with approval flag present',async()=>{
 for(const [mode,status] of [['test','not_test_recipient'],['preview','preview'],['disabled','disabled']]){
  const f=fixture();assert.equal(await processMessage({...f.args,mode}),status);assert.equal(f.sent.length,0);
 }
});
test('uncertain customer delivery remains reserved against future replay',async()=>{
 const f=fixture();let attempts=0;f.args.send=async()=>{attempts++;throw Error('SMTP outcome unknown');};
 assert.equal(await processMessage(f.args),'delivery_unconfirmed');assert.equal(await processMessage(f.args),'duplicate');assert.equal(attempts,1);
});
