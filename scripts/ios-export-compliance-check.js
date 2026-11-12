'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {ensureIOSExemptionFlag}=require('./patch-native');
const xml='<?xml version="1.0" encoding="UTF-8"?><plist version="1.0"><dict><key>CFBundleIdentifier</key><string>com.zovro.app</string></dict></plist>';
const declared=ensureIOSExemptionFlag(xml);
assert.match(declared,/<key>ITSAppUsesNonExemptEncryption<\/key>\s*<false\s*\/>/);
assert.equal(declared.split('<key>ITSAppUsesNonExemptEncryption</key>').length-1,1);
assert.equal(ensureIOSExemptionFlag(declared),declared,'No duplicate plist keys when rerun');
assert.throws(()=>ensureIOSExemptionFlag(declared.replace('<false/>','<true/>')),/human compliance review required/);
assert.throws(()=>ensureIOSExemptionFlag('<plist></plist>'),/Cannot find root/);
const workflow=fs.readFileSync('.github/workflows/ios-release.yml','utf8');
assert.match(workflow,/npx --no-install cap sync ios\s+node scripts\/patch-native\.js/);
const packageJson=JSON.parse(fs.readFileSync('package.json','utf8'));
assert.deepEqual(packageJson.dependencies,{
  '@capacitor/core':'^7.0.0',
  '@capacitor-community/stripe':'7.2.0',
  '@onesignal/capacitor-plugin':'1.1.9',
  'capacitor-secure-storage-plugin':'0.12.0',
  'leaflet':'1.9.4'
},'Native dependency changes require a fresh export compliance review');
console.log('iOS export compliance: existing exempt declaration preserved, idempotent, and gated for SDK changes');
