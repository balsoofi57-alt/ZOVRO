'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');

// Exercise the actual HTTP wrapper used by ZOVRO, not a mock sanitizer.
require('./request-privacy');

async function providerResponse(original) {
  const server = http.createServer((req, res) => {
    res.writeHead(200, { 'content-type': 'application/json; charset=utf-8' });
    res.end(original);
  });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  try {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/providers/nearby`);
    return { status: response.status, body: await response.text() };
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
}

test('provider discovery strips private contact details', async () => {
  const secretPhone = '+13135550991';
  const result = await providerResponse(JSON.stringify({
    providers: [{ provider: { id: 'p1', name: 'Test Provider', role: 'customer', phone: secretPhone, email: 'private@example.com' }, distanceMiles: 2 }]
  }));
  assert.equal(result.status, 200);
  assert.equal(result.body.includes(secretPhone), false);
  assert.equal(result.body.includes('private@example.com'), false);
  assert.equal(JSON.parse(result.body).providers[0].provider.name, 'Test Provider');
});

test('malformed provider rows never cause an unfiltered privacy response', async () => {
  const secretPhone = '+13135550992';
  const result = await providerResponse(JSON.stringify({
    providers: [null, { provider: { name: 'Private Provider', phone: secretPhone } }]
  }));
  assert.equal(result.body.includes(secretPhone), false);
  assert.deepEqual(JSON.parse(result.body), { error: 'Privacy-safe response unavailable' });
});

test('non-JSON discovery data is not forwarded to the client', async () => {
  const secretPhone = '+13135550993';
  const result = await providerResponse(`{"providers":[{"phone":"${secretPhone}"`);
  assert.equal(result.body.includes(secretPhone), false);
  assert.deepEqual(JSON.parse(result.body), { error: 'Privacy-safe response unavailable' });
});
