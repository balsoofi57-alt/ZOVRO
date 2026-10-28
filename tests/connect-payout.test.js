'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
process.env.STRIPE_SECRET_KEY='sk_test_fake_for_offline_testing';
delete process.env.ZOVRO_PLATFORM_FEE_BPS;
const calls=[];
global.fetch=async (url,options)=>{
 calls.push({url,options,body:new URLSearchParams(options.body||'')});
 if(url.endsWith('/account_links'))return {ok:true,json:async()=>({url:'https://connect.stripe.com/test-link'})};
 if(url.endsWith('/transfers'))return {ok:true,json:async()=>({id:'tr_test'})};
 return {ok:true,json:async()=>({id:'acct_test123'})};
};
const payments=require('../backend/payments');
test('connect creates provider account and hosted onboarding link without collecting bank details',async()=>{
 const account=await payments.createConnectedAccount({providerId:'provider-test',email:'provider@example.test'});
 assert.equal(account.id,'acct_test123');
 const request=calls.at(-1);
 assert.equal(request.body.get('type'),'express');
 assert.equal(request.body.get('capabilities[transfers][requested]'),'true');
 assert.equal(request.body.get('metadata[zovro_provider_id]'),'provider-test');
 assert.equal(request.options.headers['idempotency-key'],'zovro-connect-provider-test');
 assert.equal([...request.body.keys()].some(k=>/routing|bank_account|account_number/.test(k)),false);
 const link=await payments.createAccountLink({accountId:account.id,refreshUrl:'https://zovro.work/?stripe_connect=refresh',returnUrl:'https://zovro.work/?stripe_connect=return'});
 assert.equal(link.url,'https://connect.stripe.com/test-link');
 assert.equal(calls.at(-1).body.get('account'),'acct_test123');
 assert.equal(calls.at(-1).body.get('type'),'account_onboarding');
});
test('provider transfer targets the connected account and uses an idempotency key',async()=>{
 await payments.createTransfer({requestId:'request-test',providerAccountId:'acct_test123',amountCents:8750,chargeId:'ch_test123'});
 const request=calls.at(-1);
 assert.equal(request.body.get('destination'),'acct_test123');
 assert.equal(request.body.get('source_transaction'),'ch_test123');
 assert.equal(request.body.get('amount'),'8750');
 assert.equal(request.options.headers['idempotency-key'],'zovro-transfer-request-test');
 await assert.rejects(payments.createTransfer({requestId:'request-test',providerAccountId:'invalid',amountCents:8750}),/not ready/);
});

test('introductory default fee remains zero',()=>{assert.deepEqual(payments.moneySplit(10000),{amountCents:10000,platformFeeCents:0,providerAmountCents:10000})});
