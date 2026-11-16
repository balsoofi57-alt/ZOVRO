'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { readBuildStatus, summary } = require('./apple-testflight-status');

const { privateKey } = crypto.generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
const env = {
  ZOVRO_APP_STORE_CONNECT_API_KEY_ID: 'TESTKEY001',
  ZOVRO_APP_STORE_CONNECT_ISSUER_ID: 'testing-issuer',
  ZOVRO_APP_STORE_CONNECT_API_PRIVATE_KEY_BASE64: Buffer.from(
    privateKey.export({ type: 'pkcs8', format: 'pem' })
  ).toString('base64')
};

test('Only GETs are made, target bundle and app are verified', async () => {
  const requests = [];
  const fetchImpl = async (url, options) => {
    requests.push({ url, method: options.method });
    if (url.includes('/v1/apps?')) return {
      ok: true, json: async () => ({ data: [
        { id: 'foreign', attributes: { bundleId: 'com.somewhere.else' } },
        { id: 'my-app-id', attributes: { bundleId: 'com.zovro.app' } }
      ] })
    };
    assert.match(url, /filter%5Bapp%5D=my-app-id/);
    return { ok: true, json: async () => ({ data: [{
      id: 'build-1', attributes: {
        version: '395', uploadedDate: '2026-11-14T19:51:33Z',
        processingState: 'VALID', expired: false
      }
    }] }) };
  };
  const res = await readBuildStatus({ env, fetchImpl });
  assert.deepEqual(requests.map(r => r.method), ['GET', 'GET']);
  assert.equal(res.builds[0].processingState, 'VALID');
  assert.match(summary(res), /not tester availability or installation/);
});

test('No build is treated as proof of TestFlight availability', async () => {
  const fetchImpl = async url => ({
    ok: true,
    json: async () => url.includes('/v1/apps?')
      ? { data: [{ id: 'app1', attributes: { bundleId: 'com.zovro.app' } }] }
      : { data: [] }
  });
  const res = await readBuildStatus({ env, fetchImpl });
  assert.match(summary(res), /No visible builds/);
});

test('Apple API errors are sanitized and require explicit credentials', async () => {
  await assert.rejects(readBuildStatus({
    env: {}, fetchImpl: async () => { throw Error('network should not be called'); }
  }), /APPLE_CREDENTIALS_MISSING/);
  await assert.rejects(readBuildStatus({
    env, fetchImpl: async () => ({
      ok: false, status: 403,
      json: async () => ({ errors: [{ code: 'NOT_AUTHORIZED', detail: 'sensitive user data' }] })
    })
  }), error => /HTTP 403 \(NOT_AUTHORIZED\)/.test(error.message) &&
    !error.message.includes('sensitive user data'));
});
