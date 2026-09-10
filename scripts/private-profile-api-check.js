'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const api=read('backend/profile-private-api.js');
const server=read('backend/server.js');
const privacy=read('backend/request-privacy.js');
const client=read('profile-security-client.js');
const mobile=read('scripts/prepare-mobile.js');
const preflight=read('backend/startup-preflight.js');

assert(server.includes("require('./profile-private-api')"),'private profile API not wired into server');
assert(api.includes("currentUser(req)"),'private profile API must require authenticated current user');
assert(api.includes('ZOVRO_PROFILE_ENCRYPTION_KEY'),'private profile encryption key missing');
for(const f of ['dateOfBirth','residentialAddress','insuranceDetails','identityDocuments','emergencyContact'])assert(api.includes(`'${f}'`),`encrypted field missing: ${f}`);
assert(api.includes('encryptSensitive(value,KEY)'),'sensitive fields are not encrypted before storage');
assert(api.includes("'/api/profile/private'"),'own private profile endpoint missing');
assert(api.includes("'/api/profile/public'"),'public profile endpoint missing');
assert(api.includes('completionFromStored'),'public completion should not require private decryption');
assert(privacy.includes("const {publicProfile}=require('./profile-privacy')"),'provider privacy must use strict public allowlist');
assert(privacy.includes('return publicProfile(provider)'),'public provider response is not allowlisted');
for(const forbidden of ['phone','email','dateOfBirth','residentialAddress','identityDocuments','paymentProfile']){
  const module= require('../backend/profile-privacy');
  assert(!module.PUBLIC_PROFILE_FIELDS.has(forbidden),`public profile exposes ${forbidden}`);
}
assert(client.includes('Personal information & security'),'private profile UI missing');
assert(client.includes('Manage private information'),'private profile management action missing');
assert(client.includes('/profile/private'),'client is not connected to private API');
assert(mobile.includes('profile-security-client.js'),'private profile UI not bundled into mobile build');
assert(preflight.includes("profile_encryption_key"),'launch preflight does not block missing encryption key');
assert(preflight.includes('profileEncryptionConfigured'),'encryption readiness state missing');
console.log('Private profile API check passed: authenticated own-data access, strict public allowlist, encrypted sensitive storage, UI/mobile wiring and launch-key guard are present.');
