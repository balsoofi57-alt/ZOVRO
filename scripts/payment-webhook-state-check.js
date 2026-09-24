'use strict';
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const http = require('node:http');
const vm = require('node:vm');
const path = require('node:path');
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_local_regression_only';
delete process.env.STRIPE_SECRET_KEY;
const payments = require('../backend/payments');
const helpers = require('../backend/payment-event-state');
let state = {requests: [{id:'req_1',stripePaymentIntentId:'pi_1',paymentState:'paid_held',stripeTipPaymentIntentId:'pi_tip',tipState:'paid_held'}], users:[],audit:[],notifications:[]};
let router;
const fakeHttp = {createServer: handler => {router = handler; return {};}};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../backend/server-payments.js'),'utf8'), {
  require(name) {
    if (name === 'http') return fakeHttp;
    if (name === 'crypto') return crypto;
    if (name === './payments') return payments;
    if (name === './payment-event-state') return helpers;
    if (name === './database') return {readDb:()=>structuredClone(state),writeDb:db=>{state=structuredClone(db);}};
    if (name === './server-core') {fakeHttp.createServer((req,res)=>{res.writeHead(404);res.end();}); return {};}
    throw new Error('Unexpected dependency '+name);
  }, process, Buffer, URL, console
});
const server = http.createServer(router);
async function send(event, valid=true) {
  const body=JSON.stringify(event), t=Math.floor(Date.now()/1000);
  const signature=crypto.createHmac('sha256',process.env.STRIPE_WEBHOOK_SECRET).update(`${t}.${body}`).digest('hex');
  const response=await fetch(`http://127.0.0.1:${server.address().port}/api/payments/webhook`,{method:'POST',body,headers:{'stripe-signature':`t=${t},v1=${valid?signature:'0'.repeat(64)}`}});
  return {status:response.status,body:await response.json()};
}
const event=(id,type,obj)=>({id,type,data:{object:obj}});
(async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const refund=event('evt_refund','charge.refunded',{id:'ch_1',payment_intent:'pi_1',amount:100,amount_refunded:100});
  assert.equal((await send(refund,false)).status,400);
  assert.equal(state.requests[0].paymentState,'paid_held');
  assert.equal((await send(refund)).status,200);
  assert.equal(state.requests[0].paymentState,'refunded','Refund must match the stored PaymentIntent without metadata');
  const once=JSON.stringify(state);
  assert.equal((await send(refund)).body.duplicate,true);
  assert.equal(JSON.stringify(state),once,'Duplicate delivery must not mutate data');
  // Simulate reloading the persisted state before a replay.
  state=JSON.parse(JSON.stringify(state));
  assert.equal((await send(refund)).body.duplicate,true);
  await send(event('evt_late_success','payment_intent.succeeded',{id:'pi_1',metadata:{zovro_request_id:'req_1'}}));
  assert.equal(state.requests[0].paymentState,'refunded','Late success must not undo a refund');
  await send(event('evt_late_partial','charge.refunded',{id:'ch_1',payment_intent:'pi_1',amount:100,amount_refunded:50}));
  assert.equal(state.requests[0].paymentState,'refunded');
  await send(event('evt_tip_refund','charge.refunded',{id:'ch_tip',payment_intent:{id:'pi_tip'},amount:100,amount_refunded:100}));
  assert.equal(state.requests[0].tipState,'refunded','Tip refund must not affect service payment');
  state.requests.push({id:'req_other',stripePaymentIntentId:'pi_other',paymentState:'paid_held'});
  await send(event('evt_conflict','charge.refunded',{id:'ch_other',payment_intent:'pi_other',metadata:{zovro_request_id:'req_1'},amount:100,amount_refunded:100}));
  assert.equal(state.requests[1].paymentState,'paid_held','Conflicting identifiers must not update a request');
  state.requests[1].paymentState='released';
  await send(event('evt_late_failed','payment_intent.payment_failed',{id:'pi_other',metadata:{zovro_request_id:'req_other'}}));
  assert.equal(state.requests[1].paymentState,'released');
  console.log('PASS: signed HTTP webhook, invalid signature, metadata-free refund, duplicate replay, reloaded-state replay, late success/partial/failure, tip mapping, conflicting identifiers.');
})().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>server.close());
