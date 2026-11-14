'use strict';

// Apple App Store Connect read-only check: never builds, uploads, or grants access.
const fs = require('node:fs');
const { makeToken, apiFailure } = require('./apple-release-preflight');
const ROOT = 'https://api.appstoreconnect.apple.com/v1';
const BUNDLE = 'com.zovro.app';
const EXPECTED_UPLOAD_AFTER = '2026-11-14T19:45:00Z';

function recent(items, field, count = 5) {
  return [...(items || [])].sort((a, b) =>
    (Date.parse(b.attributes?.[field] || '') || 0) -
    (Date.parse(a.attributes?.[field] || '') || 0)).slice(0, count);
}
function statusText(value) {
  if (typeof value === 'string') return value.slice(0, 90);
  if (value && typeof value === 'object') return String(value.status || value.state || 'UNKNOWN').slice(0, 90);
  return 'UNKNOWN';
}

async function checkTestFlight({ env = process.env, fetchImpl = globalThis.fetch } = {}) {
  const jwt = makeToken(env);
  const headers = { Authorization: 'Bearer ' + jwt, Accept: 'application/json' };
  async function get(path) {
    const response = await fetchImpl(ROOT + path, { method: 'GET', headers });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw apiFailure(response.status, payload);
    return payload;
  }
  const apps = await get('/apps?filter%5BbundleId%5D=' + encodeURIComponent(BUNDLE) + '&limit=5');
  const app = (apps.data || []).find(a => a.attributes?.bundleId === BUNDLE);
  if (!app?.id) throw new Error('APPLE_APP_NOT_FOUND: No App Store Connect ZOVRO app record.');

  let uploads = [], uploadError = null;
  try {
    const payload = await get('/apps/' + encodeURIComponent(app.id) + '/buildUploads?limit=50');
    uploads = recent(payload.data, 'createdDate');
  } catch (error) { uploadError = String(error.message).slice(0, 170); }

  let builds = [], buildError = null;
  try {
    const payload = await get('/apps/' + encodeURIComponent(app.id) + '/builds?limit=100');
    builds = recent(payload.data, 'uploadedDate');
  } catch (error) { buildError = String(error.message).slice(0, 170); }

  const cutoff = Date.parse(EXPECTED_UPLOAD_AFTER);
  const targetBuild = builds.find(b => (Date.parse(b.attributes?.uploadedDate || '') || 0) >= cutoff);
  const targetUpload = uploads.find(b => (
    (Date.parse(b.attributes?.uploadedDate || b.attributes?.createdDate || '') || 0) >= cutoff));
  let internalState = null, linkedBetaGroups = null, detailError = null;
  if (targetBuild?.id) {
    const id = encodeURIComponent(targetBuild.id);
    try {
      const link = await get('/builds/' + id + '/relationships/buildBetaDetail');
      if (link.data?.id) {
        const detail = await get('/buildBetaDetails/' + encodeURIComponent(link.data.id));
        internalState = statusText(detail.data?.attributes?.internalBuildState);
      }
    } catch (error) { detailError = String(error.message).slice(0, 170); }
    try {
      const groups = await get('/builds/' + id + '/relationships/betaGroups?limit=100');
      linkedBetaGroups = (groups.data || []).length;
    } catch (error) {
      detailError = [detailError, 'Beta-group access: ' + String(error.message).slice(0, 120)]
        .filter(Boolean).join('; ');
    }
  }
  return {
    bundleId: BUNDLE,
    buildError, uploadError, detailError,
    recentBuilds: builds.map(b => ({
      version: statusText(b.attributes?.version),
      uploadedDate: b.attributes?.uploadedDate || null,
      processingState: statusText(b.attributes?.processingState),
      audience: statusText(b.attributes?.buildAudienceType),
      expired: Boolean(b.attributes?.expired)
    })),
    recentUploads: uploads.map(u => ({
      version: statusText(u.attributes?.cfBundleShortVersionString),
      build: statusText(u.attributes?.cfBundleVersion),
      createdDate: u.attributes?.createdDate || null,
      uploadedDate: u.attributes?.uploadedDate || null,
      state: statusText(u.attributes?.state)
    })),
    target: targetBuild ? {
      build: statusText(targetBuild.attributes?.version),
      uploadedDate: targetBuild.attributes?.uploadedDate || null,
      processingState: statusText(targetBuild.attributes?.processingState),
      internalState, linkedBetaGroups
    } : null,
    targetUpload: targetUpload ? {
      build: statusText(targetUpload.attributes?.cfBundleVersion),
      state: statusText(targetUpload.attributes?.state),
      createdDate: targetUpload.attributes?.createdDate || null,
      uploadedDate: targetUpload.attributes?.uploadedDate || null
    } : null
  };
}

async function cli() {
  try {
    const result = await checkTestFlight();
    const report = JSON.stringify(result, null, 2);
    console.log('::notice::ZOVRO TestFlight read-only processing status');
    console.log(report);
    if (process.env.GITHUB_STEP_SUMMARY) {
      fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,
        '### ZOVRO TestFlight processing (read-only)\n\n' +
        'The successful IPA upload and Apple build processing are separate events.\n\n' +
        report + '\n\nA VALID build alone does not confirm tester invitations.\n');
    }
  } catch (error) {
    console.error('::error::APPLE_BUILD_STATUS_CHECK_FAILED: ' + String(error.message).slice(0, 250));
    process.exitCode = 1;
  }
}
if (require.main === module) void cli();
module.exports = { checkTestFlight, recent, statusText, EXPECTED_UPLOAD_AFTER };
