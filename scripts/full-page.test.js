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
  assert.match(html,/website-final\.css\?v=full-pages-/);
  assert.match(html,/website-final\.js\?v=full-pages-/);
  assert.match(fs.readFileSync('scripts/prepare-mobile.js','utf8'),/'website-final\.css','website-final\.js'/);
});
test('native language chooser does not break the shared header initialization',()=>{
  assert.match(js,/const anchor=\[\.\.\.top\.children\]\.find\(child=>child\.contains\(status\)\)/);
  assert.match(js,/top\.insertBefore\(nav,anchor\|\|null\)/);
  assert.doesNotMatch(js,/top\.insertBefore\(nav,document\.getElementById\('state'\)\)/);
});
