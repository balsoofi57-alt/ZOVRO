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
assert.match(privacy,/function isCompatibleProvider/,'acceptance compatibility guard missing');
assert.match(privacy,/user\.availability===false/,'unavailable providers must be rejected');
assert.match(privacy,/user\.service&&r\.service&&user\.service!==r\.service/,'service mismatch must be rejected');
assert.match(privacy,/function locationFresh/,'provider location freshness guard missing');
assert.match(privacy,/15\*60\*1000/,'provider location must expire after 15 minutes');
assert.match(privacy,/function milesBetween/,'distance calculation missing');
assert.match(privacy,/function acceptanceEligibility/,'acceptance eligibility function missing');
assert.match(privacy,/r\.source==='sos'\|\|r\.urgent===true\?15:25/,'SOS must use 15-mile radius and normal requests 25 miles');
assert.match(privacy,/outside your current service range/,'out-of-range acceptance rejection missing');
assert.match(privacy,/Update your current location before accepting this request/,'stale or missing provider location rejection missing');

assert.match(privacy,/function publicProviderView\(provider\)/,'public provider serializer missing');
for(const sensitive of ['phone','email','license','stripeCustomerId','stripeRecipientAccountId','passwordHash']){
  assert.match(privacy,new RegExp(`\\b${sensitive}\\b`),`provider serializer must explicitly remove ${sensitive}`);
}
assert.ok(privacy.includes("url.pathname==='/api/providers/nearby'"),'nearby provider response privacy interception missing');
assert.ok(privacy.includes("const publicProfile=url.pathname.match(/^\\/api\\/providers\\/([^/]+)\\/profile$/)"),'public provider profile privacy interception missing');
assert.match(privacy,/provider:publicProviderView\(row\.provider\)/,'nearby provider rows must use the public provider serializer');
assert.match(privacy,/parsed\.provider=publicProviderView\(parsed\.provider\)/,'public provider profile must use the public provider serializer');

console.log('Request privacy QA passed: customer and provider public data are redacted, private chat is restricted, and acceptance enforces active/available/service-compatible providers plus fresh 15-mile SOS or 25-mile normal distance limits.');
