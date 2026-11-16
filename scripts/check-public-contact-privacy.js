'use strict';

/**
 * Guardrail for public-facing ZOVRO assets.
 *
 * The owner's administrative mailbox belongs only in private, server-side
 * configuration. Never embed it, or any private consumer-mailbox address,
 * in client assets or public store metadata.
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { PUBLIC_FILES } = require('../backend/static-assets');

const ROOT = path.resolve(__dirname, '..');
const SUPPORT = 'support@zovro.work';
const REQUIRED_PUBLIC_CONTACT_FILES = [
  'support.html',
  'privacy.html',
  'delete-account.html',
  'store/listing.en-US.json',
  'store/brand/email-signature.html'
];
const publicText = /\.(?:html?|js|css|json|webmanifest|svg|txt|xml)$/i;
const consumerEmail = /\b[A-Z0-9._%+-]+@(?:gmail|yahoo|outlook|hotmail|icloud)\.(?:com|net|org)\b/i;

const files = [...new Set([...PUBLIC_FILES, ...REQUIRED_PUBLIC_CONTACT_FILES])];
let scanned = 0;

for (const relative of files) {
  if (!publicText.test(relative)) continue;
  const absolute = path.resolve(ROOT, relative);
  assert.ok(absolute.startsWith(ROOT + path.sep), 'Public file must stay within repository');
  const content = fs.readFileSync(absolute, 'utf8');
  assert.equal(
    consumerEmail.test(content),
    false,
    'Private consumer-mailbox address must not appear in public asset: ' + relative
  );
  if (REQUIRED_PUBLIC_CONTACT_FILES.includes(relative)) {
    assert.ok(
      content.toLowerCase().includes(SUPPORT),
      'Official support mailbox missing from public support resource: ' + relative
    );
  }
  scanned++;
}

assert.ok(scanned > REQUIRED_PUBLIC_CONTACT_FILES.length, 'Expected to inspect public application assets');
console.log('PASS: official public support mailbox confirmed; no consumer-mailbox address in ' + scanned + ' public text assets.');
