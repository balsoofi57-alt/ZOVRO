'use strict';

const crypto = require('node:crypto');

const REQUIRED = [
  'ZOVRO_APP_STORE_CONNECT_API_KEY_ID',
  'ZOVRO_APP_STORE_CONNECT_ISSUER_ID',
  'ZOVRO_APP_STORE_CONNECT_API_PRIVATE_KEY_BASE64'
];

function encode(value) {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

function makeToken(env, now = Date.now()) {
  for (const name of REQUIRED) {
    if (!env[name]) throw new Error('APPLE_CREDENTIALS_MISSING: ' + name);
  }
  const privateKey = crypto.createPrivateKey(
    Buffer.from(env.ZOVRO_APP_STORE_CONNECT_API_PRIVATE_KEY_BASE64, 'base64').toString('utf8')
  );
  const issued = Math.floor(now / 1000);
  const unsigned = encode({
    alg: 'ES256',
    kid: env.ZOVRO_APP_STORE_CONNECT_API_KEY_ID,
    typ: 'JWT'
  }) + '.' + encode({
    iss: env.ZOVRO_APP_STORE_CONNECT_ISSUER_ID,
    iat: issued,
    exp: issued + 600,
    aud: 'appstoreconnect-v1'
  });
  const signature = crypto.sign('sha256', Buffer.from(unsigned), {
    key: privateKey,
    dsaEncoding: 'ieee-p1363'
  }).toString('base64url');
  return unsigned + '.' + signature;
}

function apiFailure(status, payload) {
  const code = String(payload?.errors?.[0]?.code || '');
  if (status === 403 && code === 'FORBIDDEN.REQUIRED_AGREEMENTS_MISSING_OR_EXPIRED') {
    return new Error('APPLE_AGREEMENT_REQUIRED: The Account Holder must review the latest Apple Developer agreement at https://developer.apple.com/account (Review agreement). No build or upload was started.');
  }
  if (status === 401) {
    return new Error('APPLE_API_KEY_INVALID: Review App Store Connect API key ID, issuer, and permissions.');
  }
  if (status === 403) {
    return new Error('APPLE_ACCESS_FORBIDDEN: The API key lacks access to ZOVRO or an Apple account prerequisite is incomplete. Code: ' + code.slice(0, 100));
  }
  return new Error('APPLE_API_ERROR: HTTP ' + String(status) + ', code: ' + code.slice(0, 100));
}

async function checkAppleRelease({ env = process.env, fetchImpl = globalThis.fetch } = {}) {
  const jwt = makeToken(env);
  const url = 'https://api.appstoreconnect.apple.com/v1/apps?filter%5BbundleId%5D=com.zovro.app&limit=5';
  const response = await fetchImpl(url, {
    headers: { Authorization: 'Bearer ' + jwt, Accept: 'application/json' }
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw apiFailure(response.status, payload);
  if (!(payload.data || []).some(item => item.attributes?.bundleId === 'com.zovro.app')) {
    throw new Error('APPLE_APP_NOT_FOUND: com.zovro.app is not accessible to this App Store Connect API key.');
  }
  return { bundleId: 'com.zovro.app' };
}

async function cli() {
  try {
    const result = await checkAppleRelease();
    console.log('::notice::Apple API and current agreement status allow access to ' + result.bundleId + '. This does not guarantee App Store upload approval.');
  } catch (error) {
    console.error('::error::' + error.message);
    process.exitCode = 1;
  }
}

if (require.main === module) void cli();

module.exports = { makeToken, apiFailure, checkAppleRelease };
