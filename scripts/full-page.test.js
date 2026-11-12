'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const js=fs.readFileSync('website-final.js','utf8'),css=fs.readFileSync('website-final.css','utf8'),html=fs.readFileSync('index.html','utf8');
const start=js.indexOf('// Full-page presentation for all current');
const end=js.indexOf('// 2026-11-09 · Keep the Sign-in',start);
const pages=js.slice(start,end);
test('full-page enhancement covers current, private and lazy-created sheets without cloning form controls',()=>{
  assert.ok(start>=0&&end>start);
  assert.match(pages,/selector='\.modal,\.z-private-modal'/);
  assert.match(pages,/document\.querySelectorAll\(selector\)\.forEach\(prepare\)/);
  assert.match(pages,/node\.querySelectorAll\(selector\)\.forEach\(prepare\)/);
  assert.match(pages,/childList:true,subtree:true/);
  assert.match(pages,/for\(const node of \[\.\.\.sheet\.childNodes\]\)body\.appendChild\(node\)/);
  assert.doesNotMatch(pages,/sheet\.innerHTML|cloneNode|outerHTML\s*=/);
});
test('page navigation preserves specialized cancellation and existing auth/catalog headers',()=>{
  for(const id of ['recoveryBack','phoneVerificationClose','supportChatClose','zPrivClose','zovroCategoryClose','zReqBack','zCatalogBack','zCatalogClose']){
    assert.ok(pages.includes(id),id);
  }
  assert.match(pages,/window\.closeTracking\(\)/);
  assert.match(pages,/special\.click\(\)/);
  assert.match(pages,/modal\.id==='authModal'\|\|modal\.id==='zSilverCatalog'/);
  assert.match(js,/if\(e\.key!=='Escape'\|\|e\.defaultPrevented\)return/);
});
test('full page CSS uses viewport sizing, independent scrolling and shared native/web assets',()=>{
  const rules=css.slice(css.indexOf('/* All app-owned sheets are full pages'));
  assert.match(rules,/height:100dvh!important/);
  assert.match(rules,/max-width:none!important/);
  assert.match(rules,/border-radius:0!important/);
  assert.match(rules,/\.z-full-page-body\{[\s\S]*?overflow-y:auto/);
  assert.match(rules,/safe-area-inset-top/);
  assert.match(rules,/safe-area-inset-bottom/);
  assert.match(rules,/#chatModal\.z-page-modal #chatText\{min-width:0\}/);
  assert.match(rules,/overflow-wrap:anywhere/);
  // Version hashes change as independent features are released; require explicit cache-busted assets.
  assert.match(html,/website-final\.css\?v=[a-z0-9][a-z0-9-]*/);
  assert.match(html,/website-final\.js\?v=[a-z0-9][a-z0-9-]*/);
  assert.match(fs.readFileSync('scripts/prepare-mobile.js','utf8'),/'website-final\.css','website-final\.js'/);
});
test('native language chooser does not break the shared header initialization',()=>{
  assert.match(js,/const anchor=\[\.\.\.top\.children\]\.find\(child=>child\.contains\(status\)\)/);
  assert.match(js,/top\.insertBefore\(nav,anchor\|\|null\)/);
  assert.doesNotMatch(js,/top\.insertBefore\(nav,document\.getElementById\('state'\)\)/);
});
test('More sections open as full pages with a back arrow to the More menu',()=>{
  const start=js.indexOf('// 2026-11-09 · More sections open as full pages');
  assert.ok(start>=0);
  const more=js.slice(start);
  assert.match(more,/addEventListener\('toggle'/);
  assert.match(more,/aria-label','Back to More'/);
  assert.match(more,/back\.onclick=\(\)=>\{d\.open=false\}/);
  assert.match(more,/z-more-subpage-open/);
  const rules=css.slice(css.indexOf('/* More sections are full pages'));
  assert.match(rules,/details\.z-more-subpage\{[\s\S]*?position:fixed!important;inset:0!important/);
  assert.match(rules,/height:100dvh/);
});
test('document pages expose a top back arrow to the app home',()=>{
  for(const [file,home] of [['support.html','./'],['privacy.html','./'],['terms.html','./'],['sms-terms.html','./'],['delete-account.html','./'],['privacy/index.html','../'],['terms/index.html','../']]){
    const page=fs.readFileSync(file,'utf8');
    assert.ok(page.includes('<header class="z-doc-header"><a class="z-doc-back" href="'+home+'" aria-label="Back to ZOVRO home">'),file);
    assert.match(page,/\.z-doc-header\{position:sticky;top:0/,file);
  }
});
