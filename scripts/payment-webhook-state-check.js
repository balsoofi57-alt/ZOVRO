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
const receipts=new Map();
let failPersistence=false, commits=0;
const fakeHttp = {createServer: handler => {router = handler; return {};}};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../backend/server-payments.js'),'utf8'), {
  require(name) {
    if (name === 'http') return fakeHttp;
    if (name === 'crypto') return crypto;
    if (name === './payments') return payments;
    if (name === './payment-event-state') return helpers;
    if (name === './payment-event-queue') return require('../backend/payment-event-queue');
    if (name === './database') return {readDb:()=>structuredClone(state),writeDb:db=>{state=structuredClone(db);},findPaymentEventReceipt:async id=>receipts.get(id),writePaymentEvent:async(db,receipt)=>{await new Promise(r=>setTimeout(r,5));if(failPersistence)throw new Error('Simulated durable storage failure');state=structuredClone(db);receipts.set(receipt.eventId,receipt);commits++;}};
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
  state.audit=[];
  assert.equal((await send(refund)).body.duplicate,true,'Receipt must survive audit pruning');
  const before=commits;
  const parallel=event('evt_parallel','payment_intent.payment_failed',{id:'pi_other',metadata:{zovro_request_id:'req_other'}});
  const replies=await Promise.all(Array.from({length:10},()=>send(parallel)));
  assert.equal(commits,before+1,'Concurrent deliveries must commit once');
  assert.equal(replies.filter(r=>r.body.duplicate).length,9);
  failPersistence=true;
  const retry=event('evt_retry','charge.refunded',{id:'ch_other',payment_intent:'pi_other',amount:100,amount_refunded:100});
  assert.equal((await send(retry)).status,500,'Failed durable write must not be acknowledged');
  assert.equal(receipts.has(retry.id),false);
  failPersistence=false;
  assert.equal((await send(retry)).status,200,'Retry succeeds after storage recovery');
  assert.equal((await send(retry)).body.duplicate,true);
  assert.equal((await send(event('','payment_intent.succeeded',{id:'pi_1'}))).status,400);
  // A failed transfer must not consume the event receipt or prevent a retry.
  state.requests.push({id:'req_tip_retry',providerId:'provider_fixture',stripeTipPaymentIntentId:'pi_tip_retry',paymentState:'released',tipState:'payment_pending'});
  state.users.push({id:'provider_fixture',stripeRecipientAccountId:'acct_fixture'});
  const originalTransfer=payments.createTipTransfer, transferCalls=[];
  let transferUnavailable=true;
  payments.createTipTransfer=async args=>{
    transferCalls.push(structuredClone(args));
    if(transferUnavailable)throw new Error('Simulated transfer outage');
    return {id:'tr_tip_retry'};
  };
  try {
    const tipEvent=event('evt_tip_retry','payment_intent.succeeded',{id:'pi_tip_retry',amount_received:100,latest_charge:'ch_tip_retry',metadata:{zovro_payment_type:'tip'}});
    const beforeFailure=JSON.stringify(state), commitsBeforeFailure=commits;
    assert.equal((await send(tipEvent)).status,500,'Failed tip transfer must ask Stripe to retry');
    assert.equal(receipts.has(tipEvent.id),false,'Failure must not record a processed receipt');
    assert.equal(commits,commitsBeforeFailure);
    assert.equal(JSON.stringify(state),beforeFailure,'Failed transfer must not publish success state or notifications');
    // Simulate restart from committed state, then simultaneous successful retries.
    state=JSON.parse(JSON.stringify(state));
    transferUnavailable=false;
    const retried=await Promise.all(Array.from({length:10},()=>send(tipEvent)));
    assert.equal(retried.every(r=>r.status===200),true);
    assert.equal(retried.filter(r=>r.body.duplicate).length,9);
    assert.equal(transferCalls.length,2,'One failed attempt and one successful retry');
    assert.deepEqual(transferCalls[0],transferCalls[1],'Retry must preserve transfer parameters and the existing idempotency identity');
    assert.equal(commits,commitsBeforeFailure+1);
    const tipRequest=state.requests.find(r=>r.id==='req_tip_retry');
    assert.equal(tipRequest.tipState,'released');
    assert.equal(tipRequest.stripeTipTransferId,'tr_tip_retry');
    assert.equal(state.notifications.filter(n=>n.meta?.requestId==='req_tip_retry').length,1);
    assert.equal((await send(tipEvent)).body.duplicate,true);
    assert.equal(transferCalls.length,2,'Replay after success must not repeat the transfer');
  } finally {payments.createTipTransfer=originalTransfer;}
  console.log('PASS: tip transfer failure, retry after serialized-state reload, concurrent retry deduplication and single success notification.');
  console.log('PASS: signed HTTP webhook, invalid signature, metadata-free refund, duplicate replay, reloaded-state replay, late success/partial/failure, tip mapping, conflicting identifiers.');
})().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>server.close());
