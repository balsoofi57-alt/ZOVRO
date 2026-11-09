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
  const extra=i18n.match(/const EXTRA=(\{[^\n]+\});/);
  assert.ok(matched&&extra,'Translation dictionaries not found');
  const map=JSON.parse(matched[1]);
  const extensions=JSON.parse(extra[1]);
  for(const locale of ['ar','es','fr','zh'])Object.assign(map[locale],extensions[locale]);
  for(const locale of ['ar','es','fr','zh']){
    assert.ok(Object.keys(map[locale]).length>=180,locale);
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

test('transport and location safety messages are translated for every locale',()=>{
  const extra=i18n.match(/const EXTRA=(\{[^\n]+\});/);
  assert.ok(extra);
  const extensions=JSON.parse(extra[1]);
  for(const locale of ['ar','es','fr','zh']){
    for(const key of [
      'Type any pickup address, including for someone at another location.',
      'Calculate miles & total',
      'Request sent successfully',
      'Account actions',
      'To — drop-off / destination (required)'
    ])assert.ok(extensions[locale][key],locale+': '+key);
  }
});
test('RTL-safe addresses, passwords and international phone numbers',()=>{
  assert.ok(i18n.includes('input[type="tel"]'));
  assert.ok(i18n.includes('input[type="password"]'));
  assert.ok(i18n.includes('#reqAddress,#transportDropoff'));
  assert.ok(i18n.includes("el.dir='auto'"));
});

test('all catalog categories and service names are localized in four non-English languages',()=>{
  const catalog=require('../src/service-catalog');
  const serviceMap=JSON.parse(i18n.match(/const SERVICE_LABELS=(\{[^\n]+\});/)[1]);
  for(const language of ['ar','es','fr','zh']){
    for(const category of catalog.SERVICE_CATALOG){
      assert.ok(serviceMap[language][category.label.en],language+': category '+category.label.en);
    }
    for(const service of catalog.ALL_SERVICES){
      assert.ok(serviceMap[language][service.label.en],language+': service '+service.label.en);
    }
  }
});

test('customer service search accepts Arabic, Spanish, French and Chinese service names',()=>{
  const catalog=require('../src/service-catalog');
  const base=JSON.parse(i18n.match(/const LABELS=(\{[^\n]+\});/)[1]);
  const extra=JSON.parse(i18n.match(/const EXTRA=(\{[^\n]+\});/)[1]);
  const service=JSON.parse(i18n.match(/const SERVICE_LABELS=(\{[^\n]+\});/)[1]);
  const dict={};
  for(const lang of ['ar','es','fr','zh'])dict[lang]={...service[lang],...extra[lang],...base[lang]};
  const inputs={ar:'نقل الأثاث',es:'Mudanza de muebles',fr:'Déménagement de meubles',zh:'家具搬运'};
  const prior=global.window;
  try{
    for(const [lang,label] of Object.entries(inputs)){
      global.window={ZOVRO_I18N:{
        getLanguage:()=>lang,
        translate:(en,locale)=>dict[locale]?.[en]||en
      }};
      const result=catalog.smartMatch(label);
      assert.equal(result[0].service.id,'furniture-moving',lang);
      assert.ok(result[0].score>=.94,lang);
      assert.equal(catalog.localizedLabel(catalog.findServiceById('furniture-moving'),lang),label);
    }
  }finally{
    if(prior===undefined)delete global.window;
    else global.window=prior;
  }
});
