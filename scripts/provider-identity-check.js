'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
process.env.ZOVRO_PROFILE_ENCRYPTION_KEY='unit-test-only-key';
const identity=require('../backend/identity-verification-api');
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
assert(read('provider-identity-client.js').includes('window.ZOVRO_PROVIDER_IDENTITY={openRegistration}'));
assert.match(read('provider-identity-client.js'),/Step 2 of 2/);
console.log('Live selfie and photo ID verification is required at provider signup.');
assert.match(api,/faceVerifiedLive===true/);
assert.match(core,/faceVerifiedLive===true/);
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
assert.equal(assess({...documentResult,status:'processing'}).ok,false,'Processing is never approval');
assert.equal(assess({...documentResult,options:{document:{require_matching_selfie:false,require_live_capture:true}}}).reason,'selfie_required');
assert.equal(assess({...documentResult,options:{document:{require_matching_selfie:true,require_live_capture:false}}}).reason,'live_capture_required');
assert.equal(assess({...documentResult,verified_outputs:{...documentResult.verified_outputs,first_name:'Different'}}).reason,'name_not_matched');
assert.equal(assess({...documentResult,verified_outputs:{...documentResult.verified_outputs,dob:{year:2008,month:11,day:13}}}).reason,'age_not_confirmed');
assert.equal(assess({...documentResult,verified_outputs:{...documentResult.verified_outputs,dob:null}}).reason,'age_not_confirmed');
assert.equal(identity.assessVerifiedDocument(documentResult,{},new Date('2026-11-12T00:00:00Z')).reason,'name_not_matched');

console.log('Government ID and 18+ eligibility checks, web/mobile packaging, and privacy disclosures PASS');
