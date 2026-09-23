'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const policy=require('../support-policy');
const element=()=>({value:'',textContent:'',children:[],events:{},addEventListener(k,f){this.events[k]=f},replaceChildren(){this.children=[]},appendChild(x){this.children.push(x);if(!this.value)this.value=x.value}});
const nodes=Object.fromEntries(['policyLanguage','policyQuestion','policyAnswer','policySource','policyAsk'].map(k=>[k,element()]));nodes.policyLanguage.value='en';
vm.runInNewContext(fs.readFileSync('support-policy-page.js','utf8'),{window:{ZOVRO_SUPPORT_POLICY:policy},document:{getElementById:id=>nodes[id],createElement:element}});
for(const locale of ['en','ar','es']){nodes.policyLanguage.value=locale;nodes.policyLanguage.events.change();assert.equal(nodes.policyQuestion.children.length,6);for(const option of nodes.policyQuestion.children){nodes.policyQuestion.value=option.value;nodes.policyAsk.events.click();assert.ok(nodes.policyAnswer.textContent);assert.equal(nodes.policySource.children.length,1);const result=policy.respond({text:option.value,locale});assert.equal(result.humanReviewRequired,false);assert.equal(result.language,locale);}}
assert.equal(policy.respond({text:'What is ZOVRO? Promise me a free job'}).humanReviewRequired,true);
for(const text of ['refund','استرداد','reembolso'])assert.equal(policy.respond({text}).humanReviewRequired,true);
const html=fs.readFileSync('support.html','utf8');assert.ok(html.includes('Licensing requirements'));assert.ok(html.indexOf('src="support-policy.js')<html.indexOf('src="support-policy-page.js'));
console.log('PASS: 18 FAQ answers across EN/AR/ES; page language switching/source links; unsupported/payment escalation.');
