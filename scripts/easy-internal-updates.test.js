'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { makeToken, checkAppleRelease, apiFailure } = require('./apple-release-preflight');
const { validate, dispatchRelease } = require('./dispatch-internal-update');

const { privateKey, publicKey } = crypto.generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
const appleEnv = {
  ZOVRO_APP_STORE_CONNECT_API_KEY_ID: 'TESTKEY',
  ZOVRO_APP_STORE_CONNECT_ISSUER_ID: 'test-issuer',
  ZOVRO_APP_STORE_CONNECT_API_PRIVATE_KEY_BASE64:
    Buffer.from(privateKey.export({ type: 'pkcs8', format: 'pem' })).toString('base64')
};

const dispatchEnv = {
  GH_TOKEN: 'dummy-not-a-real-token',
  GITHUB_REPOSITORY: 'balsoofi57-alt/ZOVRO',
  GITHUB_REF_NAME: 'main',
  ZOVRO_RELEASE_PLATFORM: 'both',
  ZOVRO_RELEASE_UPLOAD: 'true'
};

test('Apple preflight creates a correctly signed ES256 JWT', () => {
  const jwt = makeToken(appleEnv, 1_800_000_000_000);
  const parts = jwt.split('.');
  assert.equal(parts.length, 3);
  const header = JSON.parse(Buffer.from(parts[0], 'base64url').toString());
  const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
  assert.equal(header.alg, 'ES256');
  assert.equal(payload.aud, 'appstoreconnect-v1');
  assert.equal(payload.exp - payload.iat, 600);
  assert.equal(crypto.verify('sha256', Buffer.from(parts[0] + '.' + parts[1]),
    { key: publicKey, dsaEncoding: 'ieee-p1363' }, Buffer.from(parts[2], 'base64url')), true);
});

test('Apple preflight fails early on missing credentials', async () => {
  await assert.rejects(checkAppleRelease({ env: {}, fetchImpl: async () => {
    throw new Error('must not use network');
  }}), /APPLE_CREDENTIALS_MISSING/);
});

test('Apple preflight distinguishes legal agreement blockers', async () => {
  const fetchImpl = async () => ({
    ok: false,
    status: 403,
    json: async () => ({ errors: [{ code: 'FORBIDDEN.REQUIRED_AGREEMENTS_MISSING_OR_EXPIRED' }] })
  });
  await assert.rejects(checkAppleRelease({ env: appleEnv, fetchImpl }), /APPLE_AGREEMENT_REQUIRED/);
});

test('Apple preflight rejects unrelated authorization errors', () => {
  assert.match(apiFailure(401, {}).message, /APPLE_API_KEY_INVALID/);
  assert.match(apiFailure(403, { errors: [{ code: 'NOT_AUTHORIZED' }] }).message, /APPLE_ACCESS_FORBIDDEN/);
});

test('Apple preflight verifies bundle identifier, never merely HTTP success', async () => {
  const wrong = async () => ({
    ok: true, status: 200, json: async () => ({ data: [{ attributes: { bundleId: 'com.other.app' } }] })
  });
  await assert.rejects(checkAppleRelease({ env: appleEnv, fetchImpl: wrong }), /APPLE_APP_NOT_FOUND/);
  const correct = async () => ({
    ok: true, status: 200, json: async () => ({ data: [{ attributes: { bundleId: 'com.zovro.app' } }] })
  });
  assert.deepEqual(await checkAppleRelease({ env: appleEnv, fetchImpl: correct }), { bundleId: 'com.zovro.app' });
});

test('Release dispatcher rejects unknown platform and foreign repository', () => {
  assert.throws(() => validate({ ...dispatchEnv, ZOVRO_RELEASE_PLATFORM: 'production' }), /Select iOS/);
  assert.throws(() => validate({ ...dispatchEnv, GITHUB_REPOSITORY: 'attacker/fork' }), /Unexpected repository/);
  assert.throws(() => validate({ ...dispatchEnv, GITHUB_REF_NAME: '../bad' }), /Invalid GitHub release branch/);
});

test('Release dispatcher selects both internal workflows and never production', async () => {
  const calls = [];
  const fetchImpl = async (url, options) => {
    calls.push({ url, options });
    return { status: 204 };
  };
  assert.deepEqual(await dispatchRelease({ env: dispatchEnv, fetchImpl }), ['ios', 'android']);
  assert.equal(calls.length, 2);
  assert.match(calls[0].url, /ios-release\.yml\/dispatches$/);
  assert.deepEqual(JSON.parse(calls[0].options.body), { ref: 'main', inputs: { upload_testflight: 'true' } });
  assert.match(calls[1].url, /android-build\.yml\/dispatches$/);
  assert.deepEqual(JSON.parse(calls[1].options.body), { ref: 'main', inputs: { upload_google_play: 'true' } });
  assert.ok(calls.every(c => !c.url.includes('/production')));
});

test('Build-only dispatch uses disabled store upload flags', async () => {
  const bodies = [];
  const result = await dispatchRelease({
    env: { ...dispatchEnv, ZOVRO_RELEASE_PLATFORM: 'ios', ZOVRO_RELEASE_UPLOAD: 'false' },
    fetchImpl: async (url, options) => { bodies.push(JSON.parse(options.body)); return { status: 204 }; }
  });
  assert.deepEqual(result, ['ios']);
  assert.deepEqual(bodies[0].inputs, { upload_testflight: 'false' });
});

test('Release dispatcher surfaces API errors without outputting credential values', async () => {
  await assert.rejects(dispatchRelease({
    env: dispatchEnv,
    fetchImpl: async () => ({ status: 403 })
  }), error => error.message.includes('HTTP 403') && !error.message.includes(dispatchEnv.GH_TOKEN));
});

test('Unified workflow is opt-in, requires Apple preflight, and never publishes production', () => {
  const workflow = fs.readFileSync(path.resolve(__dirname, '../.github/workflows/easy-internal-updates.yml'), 'utf8');
  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /default: false/);
  assert.match(workflow, /actions: write/);
  assert.match(workflow, /node scripts\/apple-release-preflight\.js/);
  assert.match(workflow, /node scripts\/dispatch-internal-update\.js/);
  assert.doesNotMatch(workflow, /tracks\/production|automaticRelease|--submit-for-review/);
});
