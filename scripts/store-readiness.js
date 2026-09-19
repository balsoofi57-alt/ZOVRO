'use strict';

const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
let bad = false;

function fail(message) {
  console.error(message);
  bad = true;
}

function assert(condition, message) {
  if (!condition) fail(message);
}

for (const file of ['privacy.html', 'terms.html', 'support.html']) {
  const filePath = path.join(root, file);
  if (!fs.existsSync(filePath)) fail('MISSING ' + file);
  else if (fs.readFileSync(filePath, 'utf8').length < 500) fail('TOO SHORT ' + file);
  else console.log('OK', file);
}

const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const server = fs.readFileSync(path.join(root, 'backend/server-core.js'), 'utf8');
for (const token of ['deleteAccount()', 'privacy.html', 'terms.html', 'support.html']) {
  if (!html.includes(token)) fail('Missing trust control: ' + token);
}

const support = fs.readFileSync(path.join(root, 'support.html'), 'utf8');
const privacy = fs.readFileSync(path.join(root, 'privacy.html'), 'utf8');
for (const [name, text] of [['support.html', support], ['privacy.html', privacy]]) {
  if (!text.includes('support@zovro.net')) fail('Approved support email missing from ' + name);
  else console.log('OK approved support email in', name);
}

assert(
  server.includes("req.method==='DELETE'&&url.pathname==='/api/me'"),
  'Account deletion API missing'
);
assert(server.includes('GET,POST,PATCH,DELETE,OPTIONS'), 'DELETE missing from CORS methods');

const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
assert(
  pkg.dependencies?.['@onesignal/capacitor-plugin'] === '1.1.9',
  'Official OneSignal Capacitor SDK is not pinned'
);

const pushClient = fs.readFileSync(path.join(root, 'push-client.js'), 'utf8');
const prepare = fs.readFileSync(path.join(root, 'scripts/prepare-mobile.js'), 'utf8');
const paymentUi = fs.readFileSync(path.join(root, 'payment-ui.js'), 'utf8');
const paymentClient = fs.readFileSync(path.join(root, 'payment-client.js'), 'utf8');

for (const token of [
  'OneSignalCapacitor',
  'login({externalId:userId})',
  'requestPermission({fallbackToSettings:false})'
]) {
  assert(pushClient.includes(token), 'Native push client missing: ' + token);
}
assert(prepare.includes("'push-client.js'"), 'Native push client is not bundled');
assert(
  prepare.includes("'payment-ui.js'") && prepare.includes('zovro-api-final.onrender.com'),
  'Final API/payment UI is not bundled'
);
for (const token of ['quoteJob', 'payJob', 'releasePayment', 'ZOVRO_PAYMENTS.payRequest']) {
  assert(paymentUi.includes(token), 'Secure payment UX missing: ' + token);
}
assert(
  paymentClient.includes("localStorage.getItem('zovroToken')"),
  'Payment client is not using the authenticated ZOVRO session'
);

const listingPath = path.join(root, 'store/listing.en-US.json');
assert(fs.existsSync(listingPath), 'Store listing metadata missing: store/listing.en-US.json');

if (fs.existsSync(listingPath)) {
  let listing;
  try {
    listing = JSON.parse(fs.readFileSync(listingPath, 'utf8'));
  } catch (error) {
    fail('Store listing metadata is invalid JSON: ' + error.message);
  }

  if (listing) {
    const isHttps = value => typeof value === 'string' && /^https:\/\//.test(value);
    const textLength = value => Array.from(value || '').length;

    assert(listing.app?.name === 'ZOVRO', 'Store app name must be ZOVRO');
    assert(listing.app?.bundleId === 'com.zovro.app', 'Store bundle ID mismatch');
    assert(listing.supportEmail === 'support@zovro.net', 'Store support email mismatch');

    for (const [name, url] of Object.entries(listing.urls || {})) {
      assert(isHttps(url), 'Store URL must use HTTPS: ' + name);
    }

    assert(textLength(listing.apple?.name) <= 30, 'Apple app name exceeds 30 characters');
    assert(textLength(listing.apple?.subtitle) <= 30, 'Apple subtitle exceeds 30 characters');
    assert(
      textLength(listing.apple?.promotionalText) <= 170,
      'Apple promotional text exceeds 170 characters'
    );
    assert(textLength(listing.apple?.description) <= 4000, 'Apple description exceeds 4000 characters');
    assert(textLength(listing.apple?.keywords) <= 100, 'Apple keywords exceed 100 characters');
    assert(textLength(listing.googlePlay?.appName) <= 30, 'Google Play app name exceeds 30 characters');
    assert(
      textLength(listing.googlePlay?.shortDescription) <= 80,
      'Google Play short description exceeds 80 characters'
    );
    assert(
      textLength(listing.googlePlay?.fullDescription) <= 4000,
      'Google Play full description exceeds 4000 characters'
    );

    const allClaims = [
      listing.apple?.description,
      listing.googlePlay?.fullDescription,
      listing.apple?.reviewNotes
    ].join('\n').toLowerCase();
    assert(allClaims.includes('does not replace 911'), 'Store copy must preserve the 911 disclaimer');
    assert(
      !/\b(best|#1|guaranteed|always verified)\b/i.test(allClaims),
      'Store copy contains an unsupported promotional claim'
    );

    const story = listing.screenshots?.story;
    assert(Array.isArray(story) && story.length >= 4, 'Screenshot story must contain at least 4 screens');
    assert(
      listing.screenshots?.googleFeatureGraphic?.pixelSize === '1024x500',
      'Google Play feature graphic must be 1024x500'
    );

    console.log('OK validated en-US Apple and Google Play listing metadata');
  }
}

if (bad) process.exit(1);
console.log('ZOVRO store-readiness check passed.');
