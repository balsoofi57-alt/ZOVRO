'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {
  fingerprint, expectedFingerprint, actualFingerprint, verifyUploadKey
} = require('./android-upload-cert-guard');

const proof = fs.readFileSync(path.resolve(__dirname, '../store/android/UPLOAD_KEY_PROOF.md'), 'utf8');
const expected = expectedFingerprint(proof);
const render = hex => hex.match(/.{2}/g).join(':');
const env = { KEYSTORE_PATH: '/tmp/mock-upload.jks', KEYSTORE_PASSWORD: 'do-not-log', KEY_ALIAS: 'upload' };

test('accepts the exact documented ZOVRO upload leaf certificate', () => {
  let calls = 0;
  const result = verifyUploadKey({
    env,
    readProof: () => proof,
    runKeytool(cmd, args, options) {
      calls += 1;
      assert.equal(cmd, 'keytool');
      assert.deepEqual(args.slice(-4), ['-storepass:env', 'KEYSTORE_PASSWORD', '-alias', 'upload']);
      assert.equal(args.includes(env.KEYSTORE_PASSWORD), false);
      assert.equal(options.env.KEYSTORE_PASSWORD, env.KEYSTORE_PASSWORD);
      return 'Certificate fingerprints:\n  SHA1: 12:34\n  SHA256: ' + render(expected) + '\n';
    }
  });
  assert.equal(result, true);
  assert.equal(calls, 1);
});

test('blocks a wrong upload key before an AAB is signed', () => {
  assert.throws(() => verifyUploadKey({
    env,
    readProof: () => proof,
    runKeytool: () => 'SHA256: ' + render('A'.repeat(64)) + '\n'
  }), /ANDROID_UPLOAD_CERT_MISMATCH/);
});

test('rejects missing credentials without invoking keytool', () => {
  assert.throws(() => verifyUploadKey({
    env: { KEYSTORE_PATH: env.KEYSTORE_PATH },
    readProof: () => proof,
    runKeytool: () => { throw Error('should never run'); }
  }), /ANDROID_UPLOAD_SIGNING_INPUTS_MISSING/);
});

test('rejects undocumented or malformed expected fingerprints', () => {
  assert.throws(() => expectedFingerprint('unregistered key'), /ANDROID_UPLOAD_CERT_PROOF_MISSING/);
  assert.throws(() => expectedFingerprint('- Certificate SHA-256: ZZ'), /ANDROID_UPLOAD_CERT_PROOF_MISSING/);
  assert.throws(() => fingerprint('ABC'), /ANDROID_UPLOAD_CERT_FINGERPRINT_MALFORMED/);
});

test('handles certificate chains using the leaf certificate, never the issuer', () => {
  const output = 'Certificate[1]:\n SHA256: '+render(expected)+'\nCertificate[2]:\n SHA256: '+render('B'.repeat(64))+'\n';
  assert.equal(actualFingerprint(output), expected);
});

test('never propagates raw keytool errors or credential text', () => {
  assert.throws(() => verifyUploadKey({
    env,
    readProof: () => proof,
    runKeytool: () => { throw Error('sensitive: '+env.KEYSTORE_PASSWORD); }
  }), error => error.message === 'ANDROID_UPLOAD_KEY_COULD_NOT_BE_READ');
});
