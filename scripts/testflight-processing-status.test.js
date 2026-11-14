'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { checkTestFlight, recent, statusText } = require('./testflight-processing-status');

const keys = crypto.generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
const env = {
  ZOVRO_APP_STORE_CONNECT_API_KEY_ID: 'FAKE1234',
  ZOVRO_APP_STORE_CONNECT_ISSUER_ID: 'test-issuer',
  ZOVRO_APP_STORE_CONNECT_API_PRIVATE_KEY_BASE64:
    Buffer.from(keys.privateKey.export({ type: 'pkcs8', format: 'pem' })).toString('base64')
};
function ok(data) { return { ok: true, status: 200, json: async () => ({ data }) }; }
function fakeApi({ builds = [], uploads = [], groups = [], beta = null, blockBuilds = false,
  groupTesters = [{ id: 'tester-one' }], groupBuilds = [{ id: 'new' }], blockGroupAccess = false } = {}) {
  const seen = [];
  const fetchImpl = async (url, options) => {
    seen.push({ url, method: options.method });
    assert.equal(options.method, 'GET', 'Never mutate Apple via TestFlight status check');
    assert.match(options.headers.Authorization, /^Bearer /);
    if (url.includes('/apps?')) return ok([{ id: 'app-test', attributes: { bundleId: 'com.zovro.app' } }]);
    if (url.includes('/betaGroups?')) return ok([{ id: 'g1', attributes: { isInternalGroup: true, hasAccessToAllBuilds: true } }]);
    if (url.includes('/betaGroups/g1/betaTesters?')) return ok([{ id: 'tester-one', attributes: { state: 'ACCEPTED' } }]);
    if (url.includes('/betaGroups/g1/relationships/betaTesters')) {
      if (blockGroupAccess) return { ok: false, status: 403, json: async () => ({ errors: [{ code: 'FORBIDDEN' }] }) };
      return ok(groupTesters);
    }
    if (url.includes('/betaGroups/g1/relationships/builds')) return ok(groupBuilds);
    if (url.includes('/apps/app-test/betaFeedbackCrashSubmissions')) return ok([]);
    if (url.includes('/apps/app-test/betaFeedbackScreenshotSubmissions')) return ok([]);
    if (url.includes('/apps/app-test/buildUploads')) return ok(uploads);
    if (url.includes('/apps/app-test/builds')) {
      if (blockBuilds) return { ok: false, status: 403, json: async () => ({ errors: [{ code: 'FORBIDDEN' }] }) };
      return ok(builds);
    }
    if (url.includes('/relationships/buildBetaDetail')) return ok(beta ? { id: 'beta-detail-id' } : null);
    if (url.includes('/buildBetaDetails/beta-detail-id')) return ok({ attributes: { internalBuildState: beta } });
    if (url.includes('/relationships/betaGroups')) return ok(groups);
    throw new Error('Unrecognized Apple read-only URL: ' + url);
  };
  return { seen, fetchImpl };
}
test('Apple build status selects newly uploaded ZOVRO build, with internal group count', async () => {
  const old = { id: 'old', attributes: { version: '110.1', uploadedDate: '2026-11-13T18:00:00Z', processingState: 'VALID' } };
  const current = { id: 'new', attributes: { version: '202.2', uploadedDate: '2026-11-14T19:52:00Z', processingState: 'VALID', buildAudienceType: 'APP_STORE_ELIGIBLE' } };
  const api = fakeApi({ builds: [old, current], beta: 'READY_FOR_BETA_TESTING', groups: [{ id: 'g1' }] });
  const result = await checkTestFlight({ env, fetchImpl: api.fetchImpl });
  assert.equal(result.target.build, '202.2');
  assert.equal(result.target.processingState, 'VALID');
  assert.equal(result.feedback.crashReports, 0, 'zero reports means successful Apple response for exact build');
  assert.equal(result.feedback.screenshotReports, 0);
  assert.equal(result.feedback.crashError, null);
  assert.ok(api.seen.some(x => x.url.includes('filter%5Bbuild%5D=new')));
  assert.ok(!JSON.stringify(result).includes('tester-one'), 'Never expose tester identifiers');
  assert.equal(result.target.internalState, 'READY_FOR_BETA_TESTING');
  assert.equal(result.target.linkedBetaGroups, 1);
  assert.equal(result.internalGroups.count, 1);
  assert.equal(result.internalGroups.automaticAllBuilds, 1);
  assert.equal(result.internalGroups.membershipChecks.length, 1);
  assert.equal(result.internalGroups.membershipChecks[0].testerCount, 1);
  assert.equal(result.internalGroups.membershipChecks[0].testerStates.ACCEPTED, 1);
  assert.equal(result.internalGroups.membershipChecks[0].testerStateError, null);
  assert.equal(result.internalGroups.membershipChecks[0].targetBuildExplicitlyLinked, true);
  assert.equal(result.internalGroups.membershipChecks[0].automaticAllBuilds, true);
  assert.equal(result.internalGroups.membershipChecks[0].testerCountError, null);
  assert.ok(!JSON.stringify(result).includes('tester-one'), 'Do not print tester IDs or personal data');
  assert.equal(result.recentBuilds[0].version, '202.2');
  assert.ok(api.seen.every(x => x.method === 'GET'));
});
test('Processing upload is not misreported as a processed build', async () => {
  const api = fakeApi({ uploads: [{ id: 'up', attributes: {
    cfBundleVersion: '202.2', createdDate: '2026-11-14T19:51:00Z', state: { state: 'PROCESSING' }
  } }] });
  const result = await checkTestFlight({ env, fetchImpl: api.fetchImpl });
  assert.equal(result.target, null);
  assert.equal(result.targetUpload.build, '202.2');
});
test('Older builds and failed build access are never reported as newly ready', async () => {
  const api = fakeApi({ builds: [{ id: 'old', attributes: { version: '12', uploadedDate: '2026-10-12T00:00:00Z' } }] });
  assert.equal((await checkTestFlight({ env, fetchImpl: api.fetchImpl })).target, null);
  const unavailable = fakeApi({ blockBuilds: true });
  const result = await checkTestFlight({ env, fetchImpl: unavailable.fetchImpl });
  assert.equal(result.target, null);
  assert.match(result.buildError, /APPLE_ACCESS_FORBIDDEN/);
});
test('Apple status helpers safely order dates and represent states', () => {
  assert.equal(recent([{ attributes: { uploadedDate: '2020-01-01' } }, { attributes: { uploadedDate: '2021-01-01' } }], 'uploadedDate')[0].attributes.uploadedDate, '2021-01-01');
  assert.equal(statusText({ state: 'PROCESSING' }), 'PROCESSING');
});

test('Restricted beta tester membership is marked unknown, never zero', async () => {
  const api = fakeApi({ blockGroupAccess: true });
  const result = await checkTestFlight({ env, fetchImpl: api.fetchImpl });
  assert.equal(result.internalGroups.membershipChecks[0].testerCount, null);
  assert.match(result.internalGroups.membershipChecks[0].testerCountError, /APPLE_ACCESS_FORBIDDEN/);
});

test('No build or inaccessible feedback is unknown, never a false zero', async () => {
  const absent = await checkTestFlight({ env, fetchImpl: fakeApi().fetchImpl });
  assert.equal(absent.feedback.crashReports, null);
  assert.equal(absent.feedback.screenshotReports, null);
  const base = fakeApi({ builds: [{
    id: 'new', attributes: { version: '395.2', uploadedDate: '2026-11-14T19:52:28Z' }
  }] });
  const fetchImpl = async (url, options) => {
    if (url.includes('/betaFeedbackCrashSubmissions')) {
      return { ok: false, status: 403, json: async () => ({ errors: [{ code: 'FORBIDDEN' }] }) };
    }
    return base.fetchImpl(url, options);
  };
  const result = await checkTestFlight({ env, fetchImpl });
  assert.equal(result.feedback.crashReports, null);
  assert.match(result.feedback.crashError, /APPLE_ACCESS_FORBIDDEN/);
  assert.equal(result.feedback.screenshotReports, 0);
});
