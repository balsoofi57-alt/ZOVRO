'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const privacy=read('backend/request-privacy.js');
const server=read('backend/server.js');

assert.match(server,/require\('\.\/request-privacy'\)/,'request privacy guard must load before API server');
assert.ok(server.indexOf("require('./request-privacy')")<server.indexOf("require('./server-mobile-payments')"),'privacy guard must load before API server');

assert.match(privacy,/function publicDiscoveryRequest\(r\)/,'redacted discovery serializer missing');
for(const forbidden of ['customerId:r.customerId','address:r.address','location:r.location','customerName:r.customerName','messages:r.messages','clientRequestId:r.clientRequestId']){
  assert.ok(!privacy.includes(forbidden),`discovery view must not expose ${forbidden.split(':')[0]}`);
}
assert.match(privacy,/Exact customer identity, address, location and messages are shared only after you accept the job/,'privacy disclosure missing');
assert.match(privacy,/function canUsePrivateRequest\(r,uid\)\{return r\.customerId===uid\|\|r\.providerId===uid\}/,'private access must be limited to customer or accepted provider');
assert.ok(privacy.includes("const msg=url.pathname.match(/^\\/api\\/requests\\/([^/]+)\\/messages$/)"),'message-route privacy interception missing');
assert.match(privacy,/return json\(res,404,\{error:'Request not found'\}\)/,'unauthorized private request access must be hidden');
assert.match(privacy,/actor\?\.user\.role==='provider'/,'provider request-list redaction missing');
assert.match(privacy,/r\.providerId===actor\.user\.id\?r:publicDiscoveryRequest\(r\)/,'only accepted provider may receive full request view');
assert.match(privacy,/function isCompatibleProvider/,'acceptance eligibility guard missing');

console.log('Request privacy QA passed: pre-acceptance identity, address, location, messages and retry IDs are redacted; private chat is limited to the customer and accepted provider.');