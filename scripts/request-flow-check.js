'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');
function harness(){
 const nodes=new Map(),messages=[],posts=[];let resolveGeo,resolvePost;
 function $(id){if(!nodes.has(id))nodes.set(id,{value:'',textContent:'',disabled:false,checked:false,classList:{open:false,contains(){return this.open},add(){this.open=true},remove(){this.open=false}}});return nodes.get(id)}
 const c=vm.createContext({console,Date,Math,Number,Promise,Error,me:{id:'customer',role:'customer'},smartMatchRules:[],serviceSubcategories:{},requestServiceManual:false,$,
 document:{querySelector:()=>$('send'),querySelectorAll:()=>[$('reqDetails'),$('reqAddress'),$('reqService'),$('reqLocationRefresh')]},
 window:{crypto:{randomUUID:()=> '12345678-1234-1234-1234-123456789012'}},toast:x=>messages.push(x),openAuth:()=>{$('authModal').classList.add()},syncSubservices(){},smartMatchDetails(){},loadJobs(){},
 openModal:id=>$(id).classList.add(),closeModal:id=>{if(id==='requestModal')c.invalidateRequestLocation();$(id).classList.remove()},
 geo:()=>new Promise(r=>resolveGeo=r),gpsErrorReason:e=>e.reason,
 api:(_,opt)=>{posts.push(JSON.parse(opt.body));return new Promise((resolve,reject)=>resolvePost={resolve,reject})}
 });
 vm.runInContext('let requestLocation=null,requestLocationBusy=false,requestLocationGeneration=0,requestLocationPromise=null;let requestIntent=null,requestAttempt=null,requestSending=false;'+html.slice(html.indexOf('function invalidateRequestLocation()'),html.indexOf('async function loadJobs()')),c);
 $('reqService').value='Plumbing';$('reqDetails').value='Leaking sink';$('reqAddress').value='123 Main St, Detroit';
 return {c,$,posts,messages,run:code=>vm.runInContext(code,c),geo:loc=>resolveGeo(loc),post:()=>resolvePost};
}
const position=()=>({lat:42,lng:-83,accuracy:12,capturedAt:new Date().toISOString()});
(async()=>{
 let h=harness();h.c.me=null;h.c.startRequestWithLocation({details:'Flat tire'});assert(h.$('authModal').classList.open);h.c.me={id:'customer',role:'customer'};h.c.resumeRequestIntent();assert(h.$('requestModal').classList.open);assert.equal(h.$('reqDetails').value,'Flat tire');assert.match(h.$('requestStatus').textContent,/Tap Detect/);
 h=harness();h.c.newRequest();let p=h.c.detectRequestLocation();h.c.closeModal('requestModal');h.c.newRequest();h.geo(position());await p;assert.equal(h.run('requestLocation'),null,'closed form must ignore late GPS');assert.equal(h.$('reqLocationRefresh').disabled,false);
 h=harness();h.c.newRequest();p=h.c.detectRequestLocation();h.c.me={id:'other',role:'customer'};h.geo(position());await p;assert.equal(h.run('requestLocation'),null,'account changes must ignore GPS');
 h=harness();h.c.newRequest();p=h.c.detectRequestLocation();await h.c.createRequest();assert.equal(h.posts.length,0,'wait for pending GPS');h.geo(position());await p;
 h.run('requestLocation.capturedAt=new Date(Date.now()-180000).toISOString()');await h.c.createRequest();assert.equal(h.posts.length,0);assert.match(h.$('requestStatus').textContent,/expired/);
 h=harness();h.c.newRequest();p=h.c.createRequest();await h.c.createRequest();assert.equal(h.posts.length,1,'prevent concurrent sends');h.post().reject(Error('Network lost'));await p;assert.equal(h.$('reqDetails').disabled,true);const body=JSON.stringify(h.posts[0]);h.$('reqDetails').value='changed';p=h.c.createRequest();assert.equal(JSON.stringify(h.posts[1]),body,'retry must preserve exact payload and id');h.post().resolve({request:{id:'confirmed'},reused:true});await p;assert(h.$('requestSuccessModal').classList.open);assert.match(h.$('requestSuccessText').textContent,/No duplicate/);
 h=harness();h.c.newRequest();p=h.c.createRequest();h.post().resolve({});await p;assert(!h.$('requestSuccessModal').classList.open,'malformed response is not success');assert.match(h.$('requestStatus').textContent,/not confirmed/);
 h=harness();h.c.newRequest();p=h.c.createRequest();h.post().reject(Object.assign(Error('Details invalid'),{status:400}));await p;assert.equal(h.$('reqDetails').disabled,false);assert.equal(h.run('requestAttempt'),null);
 h=harness();h.c.newRequest();p=h.c.createRequest();h.c.me={id:'other',role:'customer'};h.post().resolve({request:{id:'old-account'}});await p;assert(!h.$('requestSuccessModal').classList.open,'no cross-account success');
 console.log('Request flow: sign-in continuation, stale GPS, account isolation, pending location, expired location, duplicate prevention, identical retries, confirmed success, and validation recovery passed.');
})().catch(e=>{console.error(e);process.exitCode=1});
