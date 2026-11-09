'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const features=require('../src/product-features');
const i18n=fs.readFileSync('i18n.js','utf8');
const index=fs.readFileSync('index.html','utf8');
const prepare=fs.readFileSync('scripts/prepare-mobile.js','utf8');

test('approved languages are registered in the ZOVRO app',()=>{
  assert.deepEqual(features.BRAND.languages,['en','ar','es','fr','zh']);
  assert.equal(features.BRAND.defaultLanguage,'en');
  assert.match(i18n,/const SUPPORTED=\['en','ar','es','fr','zh'\]/);
});
test('every supported translation has the main navigation and profile labels',()=>{
  const matched=i18n.match(/const LABELS=(\{[^\n]+\});/);
  assert.ok(matched,'Translation dictionary not found');
  const map=JSON.parse(matched[1]);
  for(const locale of ['ar','es','fr','zh']){
    assert.ok(Object.keys(map[locale]).length>=80,locale);
    for(const key of ['Home','Requests','Nearby','More','Profile','Language','Account & security','New request','Share location','Sign in']){
      assert.ok(map[locale][key],locale+': '+key);
    }
  }
});
test('Arabic direction is RTL and other languages remain LTR',()=>{
  assert.match(i18n,/document\.documentElement\.dir=code==='ar'\?'rtl':'ltr'/);
  assert.match(i18n,/localStorage\.setItem\(KEY,code\)/);
});
test('web and native share one Profile language selector',()=>{
  assert.match(index,/<script src="i18n\.js\?v=five-languages-20261109"><\/script>/);
  assert.match(i18n,/document\.getElementById\('zAccountMenu'\)/);
  assert.match(i18n,/select\.id='zovroLanguage'/);
  assert.doesNotMatch(prepare,/const chooser=/);
  assert.doesNotMatch(prepare,/\\n<script src="i18n\.js"><\/script>/);
  assert.match(prepare,/fs\.copyFileSync\(path\.join\(root,name\),path\.join\(out,name\)\)/);
});
