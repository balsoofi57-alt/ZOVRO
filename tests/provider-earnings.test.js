'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const html=fs.readFileSync(require.resolve('../index.html'),'utf8');
function harness(requests){
 const box={innerHTML:'',textContent:''};let resolve;
 const c=vm.createContext({me:{id:'p1',role:'provider'},$:()=>box,esc:s=>String(s).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c])),api:()=>new Promise(r=>resolve=r)});
 vm.runInContext(html.slice(html.indexOf('async function loadProviderEarnings()'),html.indexOf('async function loadPayoutStatus()')),c);
 return {c,box,respond:()=>resolve({requests})};
}
test('earnings shows assigned records and distinguishes bank deposit from transfer',async()=>{
 const h=harness([{providerId:'p1',service:'Jump Start',providerAmountCents:1250,paymentState:'released'},{providerId:'p2',service:'Other',providerAmountCents:9999,paymentState:'released'},{providerId:'p1',service:'Snow',providerAmountCents:null,paymentState:'paid_held'}]);
 const pending=h.c.loadProviderEarnings();h.respond();await pending;
 assert.match(h.box.innerHTML,/\$12\.50/);assert.match(h.box.innerHTML,/Transferred to Stripe/);assert.match(h.box.innerHTML,/not the same as a deposit/);assert.match(h.box.innerHTML,/Provider share: —/);assert.doesNotMatch(h.box.innerHTML,/99\.99/);
});
test('late earnings response is not displayed after account switch',async()=>{
 const h=harness([{providerId:'p1',service:'private',paymentState:'released'}]);const pending=h.c.loadProviderEarnings();h.c.me={id:'p2',role:'provider'};h.respond();await pending;assert.equal(h.box.innerHTML,'');
});
