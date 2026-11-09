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

test('support, recovery and payment messages are present in all approved languages',()=>{
  const catalog=JSON.parse(i18n.match(/const CUSTOMER_FLOW_LABELS=(\{[^\n]+\});/)[1]);
  for(const locale of ['ar','es','fr','zh']){
    assert.ok(Object.keys(catalog[locale]).length>=45);
    for(const key of ['ZOVRO Support','Contact customer support','Send verification code','Payment cancelled','Safety report']){
      assert.ok(catalog[locale][key],locale+': '+key);
    }
  }
});
test('unsupported automated support languages route to human review without claiming a live agent',()=>{
  const support=fs.readFileSync('support-chat.js','utf8');
  assert.ok(support.includes("unsupportedReply[locale]"));
  assert.ok(support.includes("!unsupportedReply[locale] && result.answerId === 'human-review'"));
  assert.ok(support.includes("item.setAttribute('translate','no')"));
  assert.ok(support.includes("JSON.stringify({text,history,locale,allowAI:true})"));
});

test('multilingual label replacement never changes chat messages',()=>{
  assert.match(index,/<div id="chatList" translate="no"><\/div>/);
  assert.match(i18n,/p\.closest\('script,style,textarea,pre,code,svg,\[translate="no"\]'\)/);
});


test('translated status labels cannot change request history filters or registration tabs',()=>{
  const app=fs.readFileSync('website-final.js','utf8');
  assert.match(index,/data-job-status="\$\{esc\(j\.status\)\}"/);
  assert.match(app,/const isHistory=\['Completed','Cancelled'\]\.includes\(card\.dataset\.jobStatus\)/);
  assert.doesNotMatch(app,/card\.querySelector\('\.tag'\)\?\.textContent/);
  assert.match(app,/const login=!document\.getElementById\('registerFields'\)\?\.querySelector\('#role'\)/);
  assert.doesNotMatch(app,/authTitle'\)\?\.textContent!=='Create account'/);
  assert.match(app,/\.bottom button\[onclick\*="nearby"\]/);
});


test('user-entered names, addresses, job descriptions and price notes are not localized',()=>{
  const markers=[
    ['j.details','<div class="muted" translate="no">'],
    ['j.address','<span translate="no">'],
    ['j.changeOrder.reason','Final / updated price reason: <span translate="no">'],
    ['j.lastHandoffReason','Reason: <span translate="no">'],
    ['me.name','<b translate="no">'],
    ['other','<b translate="no">']
  ];
  for(const [field,prefix] of markers){
    const value=String.fromCharCode(36)+'{esc('+field+')}';
    assert.ok(index.includes(prefix+value),field);
  }
});

test('critical account, location and payment labels are translated into all four additional languages',()=>{
  const match=i18n.match(/const RELEASE_UI_LABELS=(\{[^\n]+\});/);
  assert.ok(match,'Missing critical UI translations');
  const labels=JSON.parse(match[1]);
  const essential=[
    'GPS is optional. Choose Use My Location only when you are at pickup; otherwise type any address, including for someone else.',
    'Share live location','Stop live location','Destination street address, city, state',
    'Payment summary','Approval required before payment.','Release payment',
    'Payout setup required','Payout verification in progress',
    'Sign in or create an account','No requests yet',
    'This conversation has already been submitted for review.'
  ];
  for(const locale of ['ar','es','fr','zh']){
    assert.ok(Object.keys(labels[locale]).length>=50,locale+' critical UI coverage');
    for(const key of essential){
      assert.ok(labels[locale][key],locale+': '+key);
      assert.notEqual(labels[locale][key],key,locale+': must be translated: '+key);
    }
  }
});

test('static customer-facing interface literals stay covered in all five languages',()=>{
  const dictionaryNames=['LABELS','EXTRA','SERVICE_LABELS','CUSTOMER_FLOW_LABELS','RELEASE_UI_LABELS','ADDITIONAL_UI_LABELS'];
  const catalogs=dictionaryNames.map(name=>{
    const line=i18n.split('\n').find(row=>row.startsWith('const '+name+'='));
    assert.ok(line,'Missing dictionary '+name);
    return JSON.parse(line.slice(('const '+name+'=').length).replace(/;$/,''));
  });
  const localeKeys=Object.fromEntries(['ar','es','fr','zh'].map(locale=>[
    locale,new Set(catalogs.flatMap(dict=>Object.keys(dict[locale]||{})))
  ]));
  const ignore=new Set(['true','false','about','none','block','User','ZOVRO','small','map','center','last','main','password','email','number','button','pending']);
  const visible=new Set();
  for(const path of ['index.html','website-final.js','support-chat.js']){
    const source=fs.readFileSync(path,'utf8');
    const patterns=[
      /(?:textContent|innerText|placeholder|ariaLabel|title)\s*=\s*(['"])([^'"\n]{3,180})\1/g,
      />\s*([A-Za-z][A-Za-z?! :/’—\-0-9().,]{3,100})\s*</g
    ];
    for(const pattern of patterns){
      for(const match of source.matchAll(pattern)){
        const phrase=(match[2]||match[1]).trim();
        if(!/[A-Za-z]/.test(phrase)||ignore.has(phrase)||/[{}<>=]/.test(phrase)||phrase.length<5)continue;
        visible.add(phrase);
      }
    }
  }
  assert.ok(visible.size>=200,'Unexpectedly low UI coverage sample');
  for(const locale of ['ar','es','fr','zh']){
    for(const phrase of visible)assert.ok(localeKeys[locale].has(phrase),locale+': untranslated UI phrase: '+phrase);
  }
});

test('readonly GPS status remains localized without triggering a new location lookup',()=>{
  const statuses=JSON.parse(i18n.match(/const GPS_STATUS_LABELS=(\{[^\n]+\});/)[1]);
  const phrases=['Finding your current location…','Location unavailable — type an address instead','✓ GPS pickup selected · about {accuracy} m accuracy'];
  for(const locale of ['ar','es','fr','zh'])for(const phrase of phrases)assert.ok(statuses[locale][phrase],locale+': '+phrase);
  assert.match(i18n,/function format\(en,params=\{\},language=getLanguage\(\)\)/);
  assert.match(index,/function setRequestGpsStatus\(english,params=\{\}\)/);
  assert.match(index,/document\.addEventListener\('zovro:language-changed'/);
  assert.ok(index.includes("setRequestGpsStatus('✓ GPS pickup selected · about {accuracy} m accuracy',{accuracy:Math.round(loc.accuracy)})"));
  assert.ok(index.includes("status.dir=window.ZOVRO_I18N?.getLanguage?.()==='ar'?'rtl':'ltr'"));
  assert.ok(!index.includes('status.value='+String.fromCharCode(96)+'✓ GPS pickup selected'));
});

test('request, payment, private-profile and support feedback literals have translations',()=>{
  const names=['LABELS','EXTRA','SERVICE_LABELS','CUSTOMER_FLOW_LABELS','RELEASE_UI_LABELS','ADDITIONAL_UI_LABELS','GPS_STATUS_LABELS','DYNAMIC_UI_LABELS'];
  const dictionaries=names.map(name=>{
    const row=i18n.split('\n').find(line=>line.startsWith('const '+name+'='));
    assert.ok(row,'Missing i18n dictionary '+name);
    return JSON.parse(row.slice(('const '+name+'=').length).replace(/;$/,''));
  });
  const files=['index.html','website-final.js','payment-ui.js','profile-security-client.js','support-center.js','support-chat.js'];
  const messages=new Set();
  for(const file of files){
    const source=fs.readFileSync(file,'utf8');
    const patterns=[
      /(?:toast|requestMessage)\(\s*(['"])([^'"\n]{4,260})\1/g,
      /(?:textContent|status\.value|placeholder)\s*=\s*(['"])([^'"\n]{4,260})\1/g,
      /(?:textContent|status\.value)\s*=\s*\x60([^\x60]{4,260})\x60/g
    ];
    for(const pattern of patterns)for(const match of source.matchAll(pattern)){
      const key=(match[2]||match[1]).trim();
      if(!/[A-Za-z]{4}/.test(key)||/[{}<>=]/.test(key)||key.length>250||/^https:\/\//.test(key)||key==='ZOVRO')continue;
      messages.add(key);
    }
  }
  assert.ok(messages.size>=110,'Unexpectedly low feedback message sample');
  for(const locale of ['ar','es','fr','zh']){
    const known=new Set(dictionaries.flatMap(dict=>Object.keys(dict[locale]||{})));
    for(const message of messages)assert.ok(known.has(message),locale+': missing feedback translation: '+message);
  }
});
