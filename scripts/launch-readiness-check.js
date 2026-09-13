'use strict';

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const launchPath = path.join(root, 'backend', 'launch-readiness.js');
const serverPath = path.join(root, 'backend', 'server.js');

function assert(condition, message) {
  if (!condition) {
    console.error('launch-readiness-check: FAIL - ' + message);
    process.exit(1);
  }
}

assert(fs.existsSync(launchPath), 'backend/launch-readiness.js must exist');
const launch = fs.readFileSync(launchPath, 'utf8');
const server = fs.readFileSync(serverPath, 'utf8');

assert(server.includes("require('./launch-readiness')"), 'server bootstrap must load launch-readiness');
assert(launch.includes("/api/launch-readiness"), 'launch-readiness endpoint must be exposed');
assert(launch.includes("postgresOperational"), 'PostgreSQL operational state must be reported');
assert(launch.includes("stripe_publishable"), 'Stripe publishable-key blocker must be enforced');
assert(launch.includes("stripe_secret"), 'Stripe secret-key blocker must be enforced');
assert(launch.includes("stripe_webhook"), 'Stripe webhook blocker must be enforced');
assert(launch.includes("onesignal_app_id"), 'OneSignal App ID blocker must be enforced');
assert(launch.includes("onesignal_rest_key"), 'OneSignal REST-key blocker must be enforced');
assert(launch.includes("oneSignalServerConfigured"), 'OneSignal server configuration state must be reported');
assert(launch.includes("production_secret"), 'production secret blocker must be enforced');
assert(launch.includes("allowed_origins"), 'allowed-origins blocker must be enforced');

// Execute the real snapshot and HTTP handler with healthy external dependencies.
const vm = require('vm');
const healthyEnv = {
  DATABASE_URL: 'postgresql://localhost/test', ZOVRO_DB_MIRROR_MODE: 'mirror',
  STRIPE_PUBLISHABLE_KEY: 'pk_test_fixture', ONESIGNAL_APP_ID: 'fixture',
  ONESIGNAL_REST_API_KEY: 'fixture', ZOVRO_SECRET: 's'.repeat(32),
  ZOVRO_ALLOWED_ORIGINS: 'https://example.test'
};
for (const key of [undefined, '', 'x'.repeat(31), 'x'.repeat(32), 'é'.repeat(16)]) {
  let handler;
  const http = { createServer: fn => { handler = fn; } };
  const env = { ...healthyEnv };
  if (key !== undefined) env.ZOVRO_PROFILE_ENCRYPTION_KEY = key;
  const context = { module: { exports: {} }, Buffer, URL, process: { env }, require(name) {
    if (name === 'http') return http;
    if (name === './database') return { dbInfo: () => ({ postgresConfigured: true, postgresOperational: true }) };
    if (name === './payments') return { configured: () => true, webhookConfigured: () => true };
    if (name === './push') return { configured: () => true };
    throw Error('Unexpected dependency: ' + name);
  }};
  vm.runInNewContext(launch, context, { filename: launchPath });
  const expected = Buffer.byteLength(key || '', 'utf8') >= 32;
  const status = context.module.exports.snapshot();
  assert(status.launchReady === expected, 'readiness must enforce encryption key byte length');
  assert(status.checks.profileEncryptionConfigured === expected, 'encryption check must match readiness');
  assert(status.blockers.includes('profile_encryption_key') === !expected, 'missing/short key must block launch');
  assert(status.checks.dbMirrorMode === 'mirror', 'readiness must preserve mirror mode');
  if (key) assert(!JSON.stringify(status).includes(key), 'readiness must never expose encryption key');
  http.createServer(() => { throw Error('Readiness request unexpectedly fell through'); });
  let code, headers, body;
  handler({ method: 'GET', url: '/api/launch-readiness' }, {
    writeHead(c, h) { code = c; headers = h; }, end(b) { body = JSON.parse(b); }
  });
  assert(code === (expected ? 200 : 503), 'HTTP status must match encryption readiness');
  assert(headers['cache-control'] === 'no-store', 'readiness must not be cached');
  assert(body.launchReady === expected, 'HTTP body must match readiness');
}
console.log('launch-readiness-check: PASS (including missing, short and valid encryption keys and HTTP status)');

// Startup must use the payment adapter's validation, not just variable presence.
const { execFileSync } = require('child_process');
for (const key of ['', 'pk_live_public_fixture', 'invalid-secret', 'sk_test_fixture']) {
  const env = { ...process.env, STRIPE_SECRET_KEY: key };
  const result = JSON.parse(execFileSync(process.execPath, ['-e', "require('./backend/startup-preflight')"], { cwd: root, env, encoding: 'utf8' }).trim());
  const expected = key === 'sk_test_fixture';
  assert(result.stripeSecretConfigured === expected, 'startup must validate the configured Stripe server key');
  assert(result.blockers.includes('stripe_secret') === !expected, 'startup must block invalid or public Stripe keys');
  if (key) assert(!JSON.stringify(result).includes(key), 'startup must never log the Stripe key');
}
console.log('Startup Stripe configuration checks: PASS');
