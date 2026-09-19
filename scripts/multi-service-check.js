'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),net=require('node:net');
const {spawn}=require('node:child_process');
const model=require('../src/provider-services');
const {publicProfile}=require('../backend/profile-privacy');
const root=path.resolve(__dirname,'..');

async function frontend(){
 const vm=require('node:vm'),nodes=new Map();
 const node=id=>{if(!nodes.has(id))nodes.set(id,{value:'',textContent:'',innerHTML:'',disabled:false,classList:{add(){},remove(){},toggle(){}},querySelectorAll(){return []}});return nodes.get(id)};
 const context=vm.createContext({console,document:{getElementById:node},localStorage:{},setTimeout,clearTimeout});context.window=context;
 for(const file of ['src/service-catalog.js','src/provider-services.js','provider-service-picker.js'])vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),context);
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
 vm.runInContext(html.match(/<script>([\s\S]*?)<\/script>/)[1].replace(/boot\(\);setInterval\([\s\S]*$/,''),context);
 const choices=['Tire Change','Jump Start','Vehicle Lockout','Painting','Flooring Installation & Repair'];
 node('registrationServices').querySelectorAll=()=>choices.map(value=>({value}));
 for(const [id,value] of Object.entries({role:'provider',name:'Example Provider',email:'',phone:'13135550305',password:'StrongPass22!'}))node(id).value=value;
 const calls=[];
 context.testApi=async(url,options)=>{const payload=JSON.parse(options.body);calls.push({url,payload});return {token:'local-test',user:{id:'p1',role:'provider',services:payload.services}}};
 vm.runInContext("api=testApi;authMode='register';renderAccount=()=>{};loadJobs=()=>{};toast=()=>{}",context);
 await vm.runInContext('submitAuth()',context);
 assert.deepEqual(calls[0].payload.services,choices,'Registration must submit all checked professions');
 assert.equal(calls[0].url,'/auth/register');
 node('profileServices').querySelectorAll=()=>[{value:'Painting'},{value:'Flooring Installation & Repair'}];
 await vm.runInContext('saveProviderServices()',context);
 assert.deepEqual(calls[1].payload.services,['Painting','Flooring Installation & Repair'],'Profile edits must preserve multi-selection');
 const markup=context.ZOVRO_SERVICE_PICKER.markup('testServices',choices);
 assert.equal((markup.match(/ checked/g)||[]).length,choices.length,'Existing choices must render checked');
 assert(markup.includes('5 selected'));assert(markup.includes('type="search"'));assert(!markup.includes('Primary service'));
 node('reqService').value='Tire Change';node('reqDetails').value='My car has a dead battery';
 vm.runInContext('requestServiceManual=true;smartMatchDetails()',context);
 assert.equal(node('reqService').value,'Tire Change','Smart Match must not overwrite the customer’s explicit service selection');
 for(const [description,expected] of [['flat tire','Tire Change'],['dead battery','Jump Start'],['locked out of car','Vehicle Lockout']]){
   node('reqDetails').value=description;
   vm.runInContext('requestServiceManual=false;smartMatchDetails()',context);
   assert.equal(node('reqService').value,expected,'Descriptions should select the specific roadside skill');
 }
 console.log('Multi-service UI checks passed: registration payload, profile update, saved checkboxes and explicit customer selection.');
}

assert.deepEqual(model.validateServices(['tire-change',' Jump Start ','Tire Change','vehicle-lockout']),['Tire Change','Jump Start','Vehicle Lockout']);
for(const invalid of [[],null,'Painting',[null],['Unknown trade'],[{label:'Painting'}]])assert.throws(()=>model.validateServices(invalid));
assert(model.matchesService({services:['Painting','Flooring Installation & Repair']},'flooring'));
assert(!model.matchesService({services:['Painting','Flooring Installation & Repair']},'Plumbing'));
assert(model.matchesService({services:['Tire Change','Jump Start']},'Roadside Assistance'));
assert(!model.matchesService({services:['Tire Change']},'Vehicle Lockout'));
assert(!model.matchesService({services:['Roadside Assistance']},'Tire Change'),'Broad selections must not claim every roadside skill');
assert(!model.matchesService({service:null},'Plumbing'),'An empty profile must not match all professions');
assert(model.matchesService({service:'Painting'},'Painting'),'Legacy profiles must remain compatible');
const publicUser=publicProfile({role:'provider',service:'Painting',services:['Painting','Flooring Installation & Repair'],phone:'private',licensed:false,insured:false});
assert.deepEqual(publicUser.services,['Painting','Flooring Installation & Repair']);
assert.equal(publicUser.phone,undefined);assert.equal(publicUser.licensed,false);assert.equal(publicUser.insured,false);

(async()=>{
 await frontend();
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'zovro-multiservice-'));
 const probe=net.createServer();await new Promise(r=>probe.listen(0,'127.0.0.1',r));const port=probe.address().port;await new Promise(r=>probe.close(r));
 let child;
 const base=`http://127.0.0.1:${port}`;
 async function call(method,url,payload,token){
   const response=await fetch(base+url,{method,headers:{'content-type':'application/json',...(token?{authorization:`Bearer ${token}`}:{}) ,'x-zovro-terms-version':'2026-09-09','x-zovro-privacy-version':'2026-09-09','x-zovro-request-consent':'service-request-v1'},body:payload===undefined?undefined:JSON.stringify(payload)});
   return {status:response.status,data:await response.json()};
 }
 async function start(){
   child=spawn(process.execPath,['backend/server.js'],{cwd:root,env:{...process.env,PORT:String(port),NODE_ENV:'production',ZOVRO_DATA_DIR:temp,ZOVRO_DB_MIRROR_MODE:'off',DATABASE_URL:'',ONESIGNAL_REST_API_KEY:'',ZOVRO_SECRET:'local-multi-service-secret-1234567890123456789',ZOVRO_OPS_TOKEN:'local-multi-service-ops-1234567890'},stdio:'ignore'});
   for(let i=0;i<80;i++){try{if((await call('GET','/api/health')).status===200)return}catch{}await new Promise(r=>setTimeout(r,50))}
   throw Error('Test backend did not start');
 }
 async function stop(){if(child&&child.exitCode===null&&child.signalCode===null){child.kill('SIGTERM');await new Promise(r=>child.once('exit',r))}}
 try{
   await start();
   async function register(phone,role,services){const r=await call('POST','/api/auth/register',{name:'Multi Service Test',phone,password:'StrongPass22!',role,...(services?{services}:{})});assert.equal(r.status,201,JSON.stringify(r.data));return r.data}
   const customer=await register('13135550301','customer');
   const pro=await register('13135550302','provider',['Tire Change','Jump Start','Vehicle Lockout','Painting','flooring']);
   const replacement=await register('13135550303','provider',['Tire Change','Painting']);
   assert.equal(pro.user.services.length,5);assert.equal(pro.user.service,'Tire Change');
   for(const actor of [pro,replacement])assert.equal((await call('POST','/api/provider/location',{lat:42.32,lng:-83.18},actor.token)).status,200);
   const requests={};
   for(const service of ['Tire Change','Jump Start','Vehicle Lockout','Painting','Flooring Installation & Repair','Plumbing']){
     const made=await call('POST','/api/requests',{service,details:'Specialty matching test',location:{lat:42.315,lng:-83.19}},customer.token);
     assert.equal(made.status,201);requests[service]=made.data.request.id;
     const expected=['Tire Change','Painting'].includes(service)?2:service==='Plumbing'?0:1;
     assert.equal(made.data.dispatch.notifiedProviders,expected,`${service} dispatch`);
     const nearby=await call('GET',`/api/providers/nearby?lat=42.315&lng=-83.19&service=${encodeURIComponent(service)}`,undefined,customer.token);
     assert.equal(nearby.data.providers.length,expected,`${service} nearby search`);
   }
   const notes=(await call('GET','/api/notifications',undefined,pro.token)).data.notifications;
   assert.equal(notes.filter(n=>Object.values(requests).includes(n.meta.requestId)).length,5,'One notification per matching request');
   const jobs=(await call('GET','/api/requests',undefined,pro.token)).data.requests;
   assert.equal(jobs.length,5);assert(!jobs.some(r=>r.id===requests.Plumbing));
   assert.equal((await call('POST',`/api/requests/${requests.Plumbing}/accept`,{},pro.token)).status,403);
   assert.equal((await call('POST',`/api/requests/${requests.Painting}/accept`,{},pro.token)).status,200,'A secondary profession must be accepted');
   const handoff=await call('POST',`/api/requests/${requests.Painting}/provider-emergency-handoff`,{reason:'Vehicle broke down before arrival'},pro.token);
   assert.equal(handoff.status,200);assert.equal(handoff.data.dispatch.notifiedProviders,1,'Replacement must match a secondary profession');
   assert.equal((await call('POST',`/api/requests/${requests.Painting}/accept`,{},replacement.token)).status,200);
   assert.equal((await call('POST',`/api/requests/${requests['Flooring Installation & Repair']}/accept`,{},pro.token)).status,200);
   for(const services of [[],['Invented skill'],['Painting',null]]){
     assert.equal((await call('PATCH','/api/me',{name:'Should not save',services},pro.token)).status,400);
   }
   assert.equal((await call('GET','/api/me',undefined,pro.token)).data.user.name,'Multi Service Test');
   const changed=await call('PATCH','/api/me',{services:['Vehicle Lockout','Painting','flooring']},pro.token);
   assert.equal(changed.status,200);assert.equal(changed.data.user.services.length,3);
   assert.equal((await call('POST',`/api/requests/${requests['Jump Start']}/accept`,{},pro.token)).status,403,'Removed services must no longer be accepted');
   const newJump=await call('POST','/api/requests',{service:'Jump Start',details:'After specialty removal',location:{lat:42.315,lng:-83.19}},customer.token);
   assert.equal(newJump.data.dispatch.notifiedProviders,0,'Removed specialties must stop new dispatch notifications');
   const profile=(await call('GET',`/api/providers/${pro.user.id}/profile`,undefined,customer.token)).data.provider;
   assert.deepEqual(profile.services,changed.data.user.services);assert.equal(profile.phone,undefined);assert.equal(profile.providerVerified,false);
   await stop();await start();
   assert.deepEqual((await call('GET','/api/me',undefined,pro.token)).data.user.services,changed.data.user.services,'All selections must survive restart');
   const legacy=await call('POST','/api/auth/register',{name:'Legacy Provider',phone:'13135550304',password:'StrongPass22!',role:'provider',service:'Painting'});
   assert.equal(legacy.status,201);assert.deepEqual(legacy.data.user.services,['Painting']);
   assert.equal((await call('PATCH','/api/me',{services:['Painting','Flooring Installation & Repair']},legacy.data.token)).status,200,'Existing providers can add services');
   console.log('Multi-service QA passed: selections, compatibility, search, dispatch, secondary acceptance, emergency replacement, removal, public privacy and restart persistence.');
 }finally{await stop();fs.rmSync(temp,{recursive:true,force:true})}
})().catch(e=>{console.error(e);process.exitCode=1});
