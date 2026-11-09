'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const art=require('../service-art');
const catalog=require('../src/service-catalog');
const providers=require('../src/provider-services');
test('every published service has safe, distinct function-specific artwork',()=>{
  const entries=[...catalog.SERVICE_CATALOG.flatMap(g=>g.services.map(s=>({label:s.label.en,category:g.id}))),...providers.all.map(s=>({label:s.label,category:''}))];
  const seenLabels=new Set(),seenDrawings=new Map();
  for(const {label,category} of entries){
    if(seenLabels.has(label))continue;
    seenLabels.add(label);
    const svg=art.service(label,category);
    assert.ok(svg,'Missing art: '+label);
    assert.match(svg,/viewBox="0 0 32 34"/);
    assert.match(svg,/aria-hidden="true" focusable="false"/);
    assert.doesNotMatch(svg,/<script|<foreignObject|<image|href=|onload=|undefined|NaN/);
    const drawing=svg.slice(svg.indexOf('>')+1);
    assert.ok(!seenDrawings.has(drawing),'Repeated drawing: '+label+' / '+seenDrawings.get(drawing));
    seenDrawings.set(drawing,label);
  }
});
test('home and profile drawings are distinct, multicolor and decorative',()=>{
  const keys=['car','home','clean','tree','truck','more','pin','requests','account','support','provider','options','security'];
  const outputs=keys.map(k=>art.icon(k));
  assert.equal(new Set(outputs.map(svg=>svg.slice(svg.indexOf('>')+1))).size,keys.length);
  for(const svg of outputs){assert.ok(svg);assert.ok(new Set(svg.match(/#[0-9a-f]{6}/g)).size>=2)}
});
test('art is bundled for native and web clients before layout rendering',()=>{
  const html=fs.readFileSync('index.html','utf8');
  assert.ok(html.indexOf('src="service-art.js')<html.indexOf('src="website-final.js'));
  assert.ok(require('../backend/static-assets').PUBLIC_FILES.has('service-art.js'));
  assert.match(fs.readFileSync('scripts/prepare-mobile.js','utf8'),/'service-art\.js'/);
  assert.equal(art.service('<img src=x onerror=alert(1)>'),null);
});
