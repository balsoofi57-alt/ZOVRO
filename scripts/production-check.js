'use strict';

const fs=require('fs');
const path=require('path');

const root=path.resolve(__dirname,'..');
const failures=[];
const pass=message=>console.log(`PASS ${message}`);
const fail=message=>{failures.push(message);console.error(`FAIL ${message}`)};
const read=file=>fs.readFileSync(path.join(root,file),'utf8');

for(const file of ['index.html','privacy.html','terms.html','support.html','release.json','capacitor.config.json','render.yaml','Dockerfile','backend/server.js','backend/database.js','scripts/e2e-smoke.js']){
 if(fs.existsSync(path.join(root,file)))pass(`${file} exists`);else fail(`${file} is missing`);
}

const pkg=JSON.parse(read('backend/package.json'));
if(pkg.engines?.node==='>=22')pass('Node engine matches node:sqlite requirement');else fail('backend/package.json must require Node >=22');
for(const [name,target] of Object.entries({'test:e2e':'scripts/e2e-smoke.js','check:production':'scripts/production-check.js'})){
 if(pkg.scripts?.[name]&&fs.existsSync(path.join(root,target)))pass(`${name} target exists`);else fail(`${name} target is missing`);
}

const release=JSON.parse(read('release.json'));
const capacitor=JSON.parse(read('capacitor.config.json'));
if(release.version===pkg.version)pass('release and backend versions match');else fail('release and backend versions differ');
if(capacitor.appId==='com.zovro.app')pass('mobile app ID is com.zovro.app');else fail('mobile app ID is incorrect');

const urlFiles=['index.html','release.json','README.md','STORE_SUBMISSION.md','RELEASE_CONFIGURATION.md','FINAL_QA_MATRIX.md'];
const apiUrls=new Set();
for(const file of urlFiles){
 const matches=read(file).match(/https:\/\/zovro-api(?:-final)?\.onrender\.com/g)||[];
 for(const value of matches)apiUrls.add(value);
}
if(apiUrls.size===1)pass(`one production API is referenced: ${[...apiUrls][0]}`);else fail(`conflicting production API URLs: ${[...apiUrls].join(', ')}`);

const source=[read('backend/server.js'),read('backend/database.js'),read('backend/package.json')].join('\n');
if(/DATABASE_URL|\bpg\b|postgres/i.test(source))pass('PostgreSQL runtime implementation detected');else fail('PostgreSQL runtime implementation is absent');
if(/STRIPE_SECRET_KEY|stripe/i.test(source))pass('Stripe runtime implementation detected');else fail('Stripe runtime implementation is absent');
if(/ONESIGNAL_REST_API_KEY|onesignal|firebase|apns/i.test(source))pass('Push runtime implementation detected');else fail('Push runtime implementation is absent');

if(failures.length){
 console.error(`\n${failures.length} production check(s) failed.`);
 process.exit(1);
}
console.log('\nAll production checks passed.');
