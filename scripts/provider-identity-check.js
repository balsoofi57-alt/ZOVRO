'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
process.env.ZOVRO_PROFILE_ENCRYPTION_KEY='unit-test-only-key';
const identity=require('../backend/identity-verification-api');
// The identity provider makes paid/networked calls; never allow per-account rapid retriggering.
const throttleId='unit-identity-throttle';
assert.equal(identity.allowIdentityCall(throttleId,'start',1000).allowed,true);
assert.deepEqual(identity.allowIdentityCall(throttleId,'start',1001),{allowed:false,retryAfter:30});
assert.equal(identity.allowIdentityCall(throttleId,'check',1001).allowed,true,'status checks have their own cooldown');
assert.equal(identity.allowIdentityCall(throttleId,'check',5000).allowed,false);
assert.equal(identity.allowIdentityCall(throttleId+'-other','start',1002).allowed,true,'different providers must not block one another');
assert.equal(identity.allowIdentityCall(throttleId,'check',11001).allowed,true,'10-second check cooldown must expire');
assert.equal(identity.allowIdentityCall(throttleId,'start',31000).allowed,true,'30-second start cooldown must expire');

const age=(y,m,d,now)=>identity.adultDob({year:y,month:m,day:d},new Date(now));
assert.equal(age(2008,11,12,'2026-11-12T12:00:00Z'),true,'18th birthday eligible');
assert.equal(age(2008,11,13,'2026-11-12T12:00:00Z'),false,'one day younger must be blocked');
assert.equal(age(2000,2,29,'2026-11-12T12:00:00Z'),true,'valid leap day');
assert.equal(age(2001,2,29,'2026-11-12T12:00:00Z'),false,'invalid date');
assert.equal(age(2015,1,1,'2026-11-12T12:00:00Z'),false,'minor blocked');
const base={id:'provider-test',role:'provider',identityVerified:true,identityAgeConfirmed:true,identityVerification:{status:'verified',faceVerifiedLive:true}};
assert.equal(identity.eligible(base),true);
assert.equal(identity.eligible({...base,identityVerification:{status:'verified',faceVerifiedLive:false}}),false,'Face matching is mandatory');
for(const change of [{identityVerified:false},{identityAgeConfirmed:false},{identityVerification:{status:'pending'}},{role:'customer'}])assert.equal(identity.eligible({...base,...change}),false);
const read=p=>fs.readFileSync(p,'utf8');
const core=read('backend/server-core.js');
const guard=read('backend/request-privacy.js');
// Stripe requires a restricted Identity Results key to expose verified date of birth.
// Without that key, no provider may be marked eligible for work.
const api=read('backend/identity-verification-api.js');
const site=read('index.html');
const publicAssets=read('backend/static-assets.js');
const mobile=read('scripts/prepare-mobile.js');
new vm.Script(read('provider-identity-client.js'),{filename:'provider-identity-client.js'});
assert.match(core,/identityAgeConfirmed===true&&u.identityVerification\?\.status==='verified'/);
assert.match(core,/Verify your government photo ID and age \(18\+\) before becoming available/);
assert.match(core,/Government photo ID and 18\+ age verification required before accepting jobs/);
assert.match(guard,/user.identityAgeConfirmed===true&&user.identityVerification\?\.status==='verified'/);
assert.match(api,/client_reference_id:u.id/);
assert.match(api,/require_matching_selfie/);
assert.match(api,/Stripe Identity|api.stripe.com/);
assert.doesNotMatch(api,/identityDocumentImage|passportNumber/);
assert.match(site,/provider-identity-client\.js\?v=/);
assert.match(publicAssets,/"provider-identity-client\.js"/);
assert.match(mobile,/'provider-identity-client\.js'/);
for(const p of ['terms.html','terms/index.html'])assert.match(read(p),/Mandatory government photo ID verification/);
for(const p of ['privacy.html','privacy/index.html'])assert.match(read(p),/Stripe Identity/);
assert(api.includes("'options[document][require_live_capture]':'true'"),'document must be captured live');
assert(api.includes("'options[document][require_matching_selfie]':'true'"),'real face must match ID');
assert(api.includes('session.options?.document?.require_live_capture!==true'),'verified status is insufficient without live capture');
assert(api.includes('session.options?.document?.require_matching_selfie!==true'),'verified status is insufficient without face match');
assert(site.includes('window.ZOVRO_PROVIDER_IDENTITY?.openRegistration?.()'),'registration should immediately start provider verification step');
assert(read('provider-identity-client.js').includes("status==='verified'?statuses.reverification_required"),'client must not advertise jobs as ready without live-face eligibility');
assert.match(read('provider-identity-client.js'),/const box=document\.getElementById\('zProviderIdentityCard'\);\s*if\(!box\)return;\s*loading=true;/,'missing Profile card must not leave a permanent refresh lock');
assert(read('provider-identity-client.js').includes('window.ZOVRO_PROVIDER_IDENTITY={openRegistration}'));
assert.match(read('provider-identity-client.js'),/Step 2 of 2/);
console.log('Live selfie and photo ID verification is required at provider signup.');
assert.match(api,/faceVerifiedLive===true/);
assert.match(core,/faceVerifiedLive===true/);
assert(core.includes("identityStatus:u.identityVerification?.status==='verified'&&!(u.identityVerified&&u.identityAgeConfirmed&&u.identityVerification?.faceVerifiedLive===true)?'reverification_required'"),'legacy approvals must not appear fully verified');
assert.match(guard,/faceVerifiedLive===true/);

const crypto=require('node:crypto');
const proof=crypto.createHmac('sha256','unit-test-only-key').update('provider zovro').digest('hex');
const stored={legalNameProof:proof};
const documentResult={
 status:'verified',
 options:{document:{require_matching_selfie:true,require_live_capture:true}},
 verified_outputs:{first_name:'ZOVRO',last_name:'Provider',dob:{year:1990,month:1,day:1}}
};
const assess=result=>identity.assessVerifiedDocument(result,stored,new Date('2026-11-12T00:00:00Z'));
assert.equal(assess(documentResult).ok,true,'Live selfie plus 18+ verified government ID should be accepted');
assert.equal(assess({...documentResult,redaction:{status:'processing'}}).reason,'verification_redacted','revocation in progress cannot approve');
assert.equal(assess({...documentResult,redaction:{status:'redacted'}}).reason,'verification_redacted','redacted Identity result cannot approve');
assert.equal(assess({...documentResult,status:'processing'}).ok,false,'Processing is never approval');
assert.equal(assess({...documentResult,options:{document:{require_matching_selfie:false,require_live_capture:true}}}).reason,'selfie_required');
assert.equal(assess({...documentResult,options:{document:{require_matching_selfie:true,require_live_capture:false}}}).reason,'live_capture_required');
assert.equal(assess({...documentResult,verified_outputs:{...documentResult.verified_outputs,first_name:'Different'}}).reason,'name_not_matched');
assert.equal(assess({...documentResult,verified_outputs:{...documentResult.verified_outputs,dob:{year:2008,month:11,day:13}}}).reason,'age_not_confirmed');
assert.equal(assess({...documentResult,verified_outputs:{...documentResult.verified_outputs,dob:null}}).reason,'age_not_confirmed');
assert.equal(identity.assessVerifiedDocument(documentResult,{},new Date('2026-11-12T00:00:00Z')).reason,'name_not_matched');

assert.match(api,/ZOVRO_STRIPE_IDENTITY_RESULTS_KEY/,'dedicated restricted results credential is required');
assert.match(api,/expand\[\]/,'Identity result expansion should be explicit');
assert.match(api,/verified_outputs\.dob/,'verified birth date expansion is required');
assert.match(api,/identityReady\(\)/,'fail closed when secure Identity configuration is missing');
assert.match(api,/if\(s\.status==='verified'\)\{\s*const checked=await refresh\(u,db\)/,'a completed Stripe session is checked instead of creating another paid session');
assert.match(api,/if\(checked\.verified\)return json\(res,200,\{identity:checked\}\)/,'successful recheck resumes existing verified session');
assert(api.indexOf("if(s.status==='verified')")<api.indexOf("const session=await stripe('POST'"),'reuse must precede new Stripe session creation');
assert.match(api,/s\.metadata\?\.zovro_provider_id!==u\.id\|\|s\.livemode!==true/,'stored sessions require provider ownership and live mode');
assert.match(api,/state.reviewReason='unexpected_status'/,'unknown session statuses must revoke prior eligibility');
assert.match(api,/session.options\?\.document\?\.require_live_capture!==true\|\|session.options\?\.document\?\.require_matching_selfie!==true/,'reject missing requirements in newly created sessions');
assert.match(api,/if\(!data\.verified_outputs\?\.dob\)throw new Error/,'no birthdate must never approve provider');

console.log('Government ID and 18+ eligibility checks, web/mobile packaging, and privacy disclosures PASS');
