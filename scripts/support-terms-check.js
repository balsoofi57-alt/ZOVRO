'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const read=path=>fs.readFileSync(path,'utf8');
const support=read('support.html');
const page=read('support-policy-page.js');
const terms=read('terms.html');
const publicTerms=read('terms/index.html');
const mobile=read('scripts/prepare-mobile.js');
new vm.Script(page,{filename:'support-policy-page.js'});
assert.match(support,/<h2 id="policyHelpTitle" data-z-i18n="automated">Automated support<\/h2>/);
assert.match(support,/<label for="policyLanguage" data-z-i18n="language">Language<\/label>/);
assert.doesNotMatch(support,/Automated support\s*\/\s*الدعم/);
assert.doesNotMatch(support,/Frequently asked questions\s*\/\s*الأسئلة/);
const keys=[...new Set([...support.matchAll(/data-z-i18n="([^"]+)"/g)].map(m=>m[1]))];
for(const key of keys)assert.match(page,new RegExp('\\b'+key+':'), 'Missing translated key '+key);
for(const lang of ['ar','es'])assert.match(page,new RegExp('\\b'+lang+':\\{'));
assert.match(page,/language\.value='en'/,'English is the explicit default');
assert.match(page,/document\.documentElement\.dir=rtl\?'rtl':'ltr'/);
assert.match(page,/question\.replaceChildren\(\)/);
assert.match(page,/answer\.textContent=''/);
assert.match(mobile,/'support-policy-page\.js'/,'Support FAQ controller must ship with native builds');
for(const [path,document] of [['terms.html',terms],['terms/index.html',publicTerms]]){
 for(const clause of ['U.S. federal, state and local law','Zero tolerance for threats, theft and fraud','No off-platform arrangements or circumvention','will terminate each participating customer or service professional account immediately following confirmation','not necessarily a criminal offense']){
  assert.ok(document.includes(clause),path+': missing '+clause);
 }
 assert.match(document,/person who refuses an off-platform proposal is not considered a participant/);
 assert.match(document,/applicable law requires a different process/);
}
console.log('Support single-language switching, full translations, and uniform lawful-use/circumvention terms PASS');
