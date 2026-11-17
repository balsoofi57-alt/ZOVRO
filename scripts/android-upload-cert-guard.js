'use strict';

/*
 * Fail-closed verification for the *existing* Google Play upload certificate.
 * This does not create/replace a keystore, change Play App Signing or upload
 * any AAB. To rotate a lost key, complete Google's official upload-key reset
 * and update the documented upload certificate only after Play accepts it.
 */
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const PROOF_PATH = path.resolve(__dirname, '../store/android/UPLOAD_KEY_PROOF.md');

function fingerprint(value) {
  const cleaned = String(value || '').replace(/:/g, '').trim().toUpperCase();
  if (!/^[0-9A-F]{64}$/.test(cleaned)) {
    throw new Error('ANDROID_UPLOAD_CERT_FINGERPRINT_MALFORMED');
  }
  return cleaned;
}

function expectedFingerprint(proofText) {
  const match = String(proofText).match(/^- Certificate SHA-256:\s*([0-9a-f:]+)\s*$/im);
  if (!match) throw new Error('ANDROID_UPLOAD_CERT_PROOF_MISSING');
  return fingerprint(match[1]);
}

function actualFingerprint(keytoolOutput) {
  // keytool -list -v prints the leaf/upload certificate before any issuer
  // certificates. Use the first SHA256 fingerprint, not the CA-chain hashes.
  const match = String(keytoolOutput).match(/^\s*SHA256:\s*([0-9a-f:]+)\s*$/im);
  if (!match) throw new Error('ANDROID_UPLOAD_KEY_FINGERPRINT_MISSING');
  return fingerprint(match[1]);
}

function verifyUploadKey({
  env = process.env,
  readProof = () => fs.readFileSync(PROOF_PATH, 'utf8'),
  runKeytool = execFileSync
} = {}) {
  const required = ['KEYSTORE_PATH', 'KEYSTORE_PASSWORD', 'KEY_ALIAS'];
  if (required.some(key => !env[key])) throw new Error('ANDROID_UPLOAD_SIGNING_INPUTS_MISSING');
  const expected = expectedFingerprint(readProof());
  let output;
  try {
    output = runKeytool(
      'keytool',
      [
        '-list', '-v', '-keystore', env.KEYSTORE_PATH,
        '-storepass:env', 'KEYSTORE_PASSWORD',
        '-alias', env.KEY_ALIAS
      ],
      { encoding: 'utf8', env, stdio: ['ignore', 'pipe', 'pipe'] }
    );
  } catch {
    // Do not forward keytool errors: they can contain paths or account details.
    throw new Error('ANDROID_UPLOAD_KEY_COULD_NOT_BE_READ');
  }
  if (actualFingerprint(output) !== expected) {
    throw new Error('ANDROID_UPLOAD_CERT_MISMATCH');
  }
  return true;
}

if (require.main === module) {
  try {
    verifyUploadKey();
    console.log('Android upload certificate matches the documented Google Play upload certificate.');
  } catch (error) {
    console.error('::error::' + error.message + '. Stop signing/upload; verify the existing Play upload key or complete an official upload-key reset.');
    process.exitCode = 1;
  }
}

module.exports = { fingerprint, expectedFingerprint, actualFingerprint, verifyUploadKey };
