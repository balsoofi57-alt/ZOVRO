'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
process.env.ZOVRO_PROFILE_ENCRYPTION_KEY='unit-test-only-key';
const identity=require('../backend/identity-verification-api');
assert.equal(identity.adultDob({year:2008,month:11,day:12},new Date('2026-11-12T12:00:00Z')),true);
assert.equal(identity.adultDob({year:2008,month:11,day:13},new Date('2026-11-12T12:00:00Z')),false);
assert.equal(identity.eligible({role:'provider',identityVerified:true,identityAgeConfirmed:true,identityVerification:{status:'verified',faceVerifiedLive:true}}),true);
assert.equal(identity.eligible({role:'provider',identityVerified:true,identityAgeConfirmed:false,identityVerification:{status:'verified',faceVerifiedLive:true}}),false);
for(const path of ['backend/server.js','backend/server-core.js','backend/request-privacy.js','backend/identity-verification-api.js','scripts/e2e-smoke.js'])new vm.Script(fs.readFileSync(path,'utf8'),{filename:path});
const core=fs.readFileSync('backend/server-core.js','utf8');
assert.match(core,/Government photo ID and 18\+ age verification required before accepting jobs/);
assert.match(core,/u.identityAgeConfirmed===true&&u.identityVerification\?\.status==='verified'/);
assert.match(fs.readFileSync('backend/server.js','utf8'),/require\('\.\/identity-verification-api'\)/);
// Stripe requires a restricted Identity Results key to expose verified date of birth.
// Without that key, no provider may be marked eligible for work.
const api=fs.readFileSync('backend/identity-verification-api.js','utf8');
assert(api.includes("'options[document][require_live_capture]':'true'"));
assert(api.includes("'options[document][require_matching_selfie]':'true'"));
assert(api.includes('session.options?.document?.require_live_capture!==true'));
assert(api.includes('session.options?.document?.require_matching_selfie!==true'));
console.log('Live selfie and photo ID capture approval requirement PASS');
assert.match(api,/faceVerifiedLive===true/);
assert.match(core,/faceVerifiedLive===true/);
assert(core.includes("identityStatus:u.identityVerification?.status==='verified'&&!(u.identityVerified&&u.identityAgeConfirmed&&u.identityVerification?.faceVerifiedLive===true)?'reverification_required'"),'legacy approvals must not appear fully verified');

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

console.log('Production API ID verification security checks PASS');
