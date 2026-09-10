'use strict';
const assert=require('assert');
const {publicProfile,privateProfile,isPrivateField,encryptSensitive,decryptSensitive}=require('../backend/profile-privacy');
const sample={id:'u1',name:'Jane Doe',photoUrl:'https://example.test/jane.jpg',role:'provider',service:'Plumbing',providerVerified:true,phone:'+13135551212',email:'jane@example.test',dateOfBirth:'1990-01-02',residentialAddress:'123 Private St',licenseNumber:'ABC123'};
const pub=publicProfile(sample);
for(const key of ['phone','email','dateOfBirth','residentialAddress','licenseNumber']) assert(!(key in pub),`public profile leaked ${key}`);
assert.equal(pub.name,'Jane Doe');
assert.equal(pub.photoUrl,sample.photoUrl);
const own=privateProfile(sample);
assert.equal(own.phone,sample.phone);
assert(isPrivateField('dateOfBirth'));
assert(!isPrivateField('name'));
const key='01234567890123456789012345678901';
for(const field of ['dateOfBirth','residentialAddress']){const enc=encryptSensitive(sample[field],key);assert.notEqual(enc,sample[field]);assert.equal(decryptSensitive(enc,key),sample[field]);}
console.log('Profile privacy check passed: public profile is name/photo/professional data only; sensitive fields remain private and encryption helper round-trips.');
