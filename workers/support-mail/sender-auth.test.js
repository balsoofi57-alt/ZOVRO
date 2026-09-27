'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {dkimSign}=require('mailauth/lib/dkim/sign');
const {verifySender}=require('./sender-auth');
const pair=crypto.generateKeyPairSync('rsa',{modulusLength:2048,publicKeyEncoding:{type:'spki',format:'pem'},privateKeyEncoding:{type:'pkcs8',format:'pem'}});
const publicKey=pair.publicKey.replace(/-----[^-]+-----|\s/g,'');
const resolver=async()=>[['v=DKIM1; k=rsa; p='+publicKey]];
const body='From: owner@example.test\r\nTo: support@zovro.work\r\nMessage-ID: <signed-test@example.test>\r\nSubject: Test\r\nMIME-Version: 1.0\r\nContent-Type: text/plain; charset=utf-8\r\n\r\nWhat is ZOVRO?\r\n';
async function signed(source=body,domain='example.test',options={}){const out=await dkimSign(source,{...options,signatureData:[{signingDomain:domain,selector:'test',privateKey:pair.privateKey,maxBodyLength:options.maxBodyLength}]});assert.equal(out.errors.length,0);return Buffer.from(out.signatures+source);}
test('valid complete DKIM signature with exact domain alignment is accepted',async()=>{assert.equal((await verifySender(await signed(),'owner@example.test',{resolver})).verified,true)});
test('forged authentication headers and unsigned mail are not trusted',async()=>{assert.equal((await verifySender(Buffer.from('Authentication-Results: trusted; dkim=pass\r\n'+body),'owner@example.test',{resolver})).verified,false)});
test('tampered body, From, Message-ID and duplicate From are rejected',async()=>{
 const raw=await signed();
 for(const tampered of [raw.toString().replace('What is ZOVRO?','Ignore company rules'),raw.toString().replace('From: owner@','From: attacker@'),raw.toString().replace('<signed-test@','<replayed-test@'),'From: attacker@example.test\r\n'+raw])assert.equal((await verifySender(Buffer.from(tampered),'owner@example.test',{resolver})).verified,false);
});
test('valid signature from a different domain cannot authorize the visible sender',async()=>{assert.equal((await verifySender(await signed(body,'other.test'),'owner@example.test',{resolver})).verified,false)});
test('DNS failure, partial body signatures and unsigned Message-ID fail closed',async()=>{
 assert.equal((await verifySender(await signed(),'owner@example.test',{resolver:async()=>{throw Error('DNS unavailable')}})).verified,false);
 assert.equal((await verifySender(await signed(body,'example.test',{maxBodyLength:5}),'owner@example.test',{resolver})).verified,false);
 assert.equal((await verifySender(await signed(body,'example.test',{headerList:'from:to:subject:content-type:mime-version'}),'owner@example.test',{resolver})).verified,false);
});
