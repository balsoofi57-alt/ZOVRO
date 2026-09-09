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

console.log('launch-readiness-check: PASS');
