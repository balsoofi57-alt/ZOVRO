'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
const source=html.slice(html.indexOf('function gpsErrorReason('),html.indexOf('async function detectRequestLocation('));
const position=(overrides={})=>({coords:{latitude:42.3,longitude:-83.2,accuracy:15},timestamp:Date.now(),...overrides});
function setup(steps,secure=true){
 let calls=0,ids=0;const timers=new Map();
 const c=vm.createContext({Date,console,window:{isSecureContext:secure},navigator:{geolocation:{getCurrentPosition(ok,fail,options){const step=steps[calls++];if(step)step(ok,fail,options)}}},setTimeout(fn){timers.set(++ids,fn);return ids},clearTimeout(id){timers.delete(id)}});
 vm.runInContext(source,c);return {c,timers,get calls(){return calls},run(options){c.settings=options;return vm.runInContext('geo(settings)',c)},fire(){const fn=timers.values().next().value;assert.ok(fn,'A browser-independent deadline must exist');fn()}};
}
const tick=()=>new Promise(r=>setImmediate(r));
(async()=>{
 let f=setup([(ok)=>ok(position({timestamp:Date.now()-180000})),ok=>ok(position())]);
 await f.run();assert.equal(f.calls,2,'Stale positions must trigger a fresh retry');assert.equal(f.timers.size,0);
 for(const timestamp of [0,NaN,Date.now()+120000]){f=setup([ok=>ok(position({timestamp})),ok=>ok(position())]);await f.run();assert.equal(f.calls,2,'Invalid timestamps must not be relabeled as fresh')}
 f=setup([ok=>ok(position({coords:{latitude:91,longitude:0,accuracy:5}})),ok=>ok(position())]);await f.run();assert.equal(f.calls,2);
 f=setup([ok=>ok(position({coords:{latitude:42,longitude:-83,accuracy:900}})),ok=>ok(position())]);await f.run({maxAccuracy:250});assert.equal(f.calls,2,'SOS must retry coarse positions with high accuracy');
 f=setup([(_,fail)=>fail({code:1})]);await assert.rejects(f.run(),e=>e.code===1);assert.equal(f.calls,1);assert.equal(f.timers.size,0);
 f=setup([],false);await assert.rejects(f.run(),e=>e.reason==='insecure-context');assert.equal(f.calls,0);
 f=setup([]);delete f.c.navigator.geolocation;await assert.rejects(f.run(),e=>e.reason==='unsupported');
 let late;f=setup([ok=>{late=ok},ok=>ok(position())]);const result=f.run();f.fire();await result;late(position({coords:{latitude:1,longitude:1,accuracy:1}}));assert.equal(f.calls,2);assert.equal(f.timers.size,0);
 f=setup([]);const stalled=assert.rejects(f.run(),e=>e.code===3);f.fire();await tick();f.fire();await stalled;assert.equal(f.timers.size,0);
 f=setup([()=>{throw Error('browser failure')},ok=>ok(position())]);await f.run();assert.equal(f.timers.size,0);
 console.log('GPS runtime: stale/invalid coordinates, timestamp validation, precise SOS retry, denial, unsupported/insecure contexts, stalled callbacks, late results and timer cleanup passed.');
})().catch(e=>{console.error(e);process.exitCode=1});
