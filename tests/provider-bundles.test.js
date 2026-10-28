'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const model=require('../src/provider-services');
function picker(inputs=[]){
  const fieldset={querySelectorAll:()=>inputs,querySelector:()=>({textContent:''})};
  const window={ZOVRO_PROVIDER_SERVICES:model};
  vm.runInNewContext(fs.readFileSync(require.resolve('../provider-service-picker.js'),'utf8'),{window,document:{getElementById:()=>fieldset}});
  return {api:window.ZOVRO_SERVICE_PICKER,fieldset};
}
test('bundles display their actual services and emergency scope',()=>{
 const html=picker().api.markup('test',[]);
 assert.match(html,/Tire Services/);assert.match(html,/Flat Tire Repair/);
 assert.match(html,/Plumbing \(including emergency\)/);assert.match(html,/Emergency Plumber/);
});
test('one chosen bundle registers exact services and dispatch matches each one',()=>{
 const input={checked:true,dataset:{members:JSON.stringify(['Tire Change','Mobile Tire Service','Flat Tire Repair']),original:'[]'}};
 const values=picker([input]).api.read('test');
 assert.deepEqual([...values],['Tire Change','Mobile Tire Service','Flat Tire Repair']);
 for(const service of values)assert.equal(model.matchesService({services:values},service),true);
 assert.equal(model.matchesService({services:values},'Plumbing'),false);
});
test('existing partial selections stay unchanged until explicitly changed',()=>{
 const html=picker().api.markup('test',['Plumbing']);
 assert.match(html,/Currently saved: Plumbing/);
 assert.match(html,/Remove these from selection/);
 const input={checked:false,dataset:{members:JSON.stringify(['Plumbing','Emergency Plumber']),original:JSON.stringify(['Plumbing'])}};
 const {api,fieldset}=picker([input]);
 assert.deepEqual([...api.read('test')],['Plumbing']);
 input.checked=true;api.update(fieldset,{target:input});
 assert.deepEqual([...api.read('test')],['Plumbing','Emergency Plumber']);
 input.checked=false;api.update(fieldset,{target:input});
 assert.throws(()=>api.read('test'),/Choose at least one/);
});

test('mechanic and seasonal bundles cover the requested related jobs',()=>{
 const html=picker().api.markup('test',[]);
 for(const name of ['Mobile Mechanic &amp; Battery','Jump Start','Battery Replacement','Lawn &amp; Snow Services','Lawn Mowing','Snow Removal','Snow Plowing'])assert.ok(html.includes(name),name);
 for(const services of [['Mobile Mechanic','Emergency Mobile Mechanic','Jump Start','Battery Replacement'],['Lawn Mowing','Snow Removal','Snow Plowing','Lawn & Snow']]){
   const input={checked:true,dataset:{members:JSON.stringify(services),original:'[]'}};
   const selected=picker([input]).api.read('test');
   for(const service of services)assert.equal(model.matchesService({services:selected},service),true);
 }
});

test('remove a partial bundle without enabling other services',()=>{
 const input={checked:false,dataset:{members:JSON.stringify(['Plumbing','Emergency Plumber']),original:JSON.stringify(['Plumbing'])}};
 const other={checked:true,value:'Electrical',dataset:{}};
 const {api,fieldset}=picker([input,other]);
 let removed=false;
 const row={querySelector:selector=>selector.startsWith('input')?input:{remove:()=>{removed=true}}};
 const button={closest:selector=>selector==='fieldset'?fieldset:row};
 api.removePartial(button);
 assert.equal(removed,true);
 assert.deepEqual([...api.read('test')],['Electrical']);
});
