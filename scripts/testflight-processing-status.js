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

  let internalGroups = null, groupListError = null, internalGroupRefs = [];
  try {
    const groupListing = await get('/betaGroups?filter%5Bapp%5D=' + encodeURIComponent(app.id) + '&limit=100');
    const allGroups = groupListing.data || [];
    internalGroupRefs = allGroups.filter(g => g.attributes?.isInternalGroup === true && g.id);
    internalGroups = {
      count: internalGroupRefs.length,
      automaticAllBuilds: internalGroupRefs.filter(g => g.attributes?.hasAccessToAllBuilds === true).length,
      membershipChecks: []
    };
  } catch (error) { groupListError = String(error.message).slice(0, 170); }

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
  // Do not fetch or print tester names, emails, group IDs or tester resource IDs.
  // A denied GET means "unknown", not zero testers or zero linked builds.
  if (internalGroups) {
    for (const group of internalGroupRefs) {
      const id = encodeURIComponent(group.id);
      const summary = {
        automaticAllBuilds: group.attributes?.hasAccessToAllBuilds === true,
        testerCount: null,
        testersTruncated: false,
        testerCountError: null,
        testerStates: null,
        testerStateError: null,
        targetBuildExplicitlyLinked: null,
        buildLinkError: null
      };
      try {
        const testers = await get('/betaGroups/' + id + '/relationships/betaTesters?limit=200');
        summary.testerCount = (testers.data || []).length;
        summary.testersTruncated = Boolean(testers.links?.next);
      } catch (error) { summary.testerCountError = String(error.message).slice(0, 150); }
      // Request only the state field; never read/log tester email, name or ID.
      try {
        const testers = await get('/betaGroups/' + id + '/betaTesters?fields%5BbetaTesters%5D=state&limit=200');
        const counts = { NOT_INVITED: 0, INVITED: 0, ACCEPTED: 0, INSTALLED: 0, REVOKED: 0, UNKNOWN: 0 };
        for (const tester of testers.data || []) {
          const state = String(tester.attributes?.state || 'UNKNOWN');
          counts[Object.prototype.hasOwnProperty.call(counts, state) ? state : 'UNKNOWN']++;
        }
        summary.testerStates = counts;
        if (testers.links?.next) summary.testerStateError = 'More than 200 testers; status counts are incomplete.';
      } catch (error) { summary.testerStateError = String(error.message).slice(0, 150); }
      if (targetBuild?.id) {
        try {
          const buildLinks = await get('/betaGroups/' + id + '/relationships/builds?limit=200');
          summary.targetBuildExplicitlyLinked = (buildLinks.data || []).some(b => b.id === targetBuild.id);
          if (buildLinks.links?.next && !summary.targetBuildExplicitlyLinked) {
            summary.buildLinkError = 'The build-link result is paginated; explicit membership is unknown.';
            summary.targetBuildExplicitlyLinked = null;
          }
        } catch (error) { summary.buildLinkError = String(error.message).slice(0, 150); }
      }
      internalGroups.membershipChecks.push(summary);
    }
  }
  // Count feedback on this exact build, never log tester identity, screenshots or crash details.
  // A denied or paginated response is not proof that there are zero reports.
  const feedback = {
    crashReports: null,
    screenshotReports: null,
    crashError: null,
    screenshotError: null,
    crashReportsIncomplete: false,
    screenshotReportsIncomplete: false
  };
  if (targetBuild?.id) {
    const appId = encodeURIComponent(app.id);
    const buildFilter = encodeURIComponent(targetBuild.id);
    for (const [name, endpoint, countKey, errorKey, incompleteKey] of [
      ['crash', 'betaFeedbackCrashSubmissions', 'crashReports', 'crashError', 'crashReportsIncomplete'],
      ['screenshot', 'betaFeedbackScreenshotSubmissions', 'screenshotReports', 'screenshotError', 'screenshotReportsIncomplete']
    ]) {
      try {
        const path = '/apps/' + appId + '/' + endpoint +
          '?filter%5Bbuild%5D=' + buildFilter + '&limit=200';
        const response = await get(path);
        feedback[countKey] = (response.data || []).length;
        feedback[incompleteKey] = Boolean(response.links?.next);
      } catch (error) {
        feedback[errorKey] = String(error.message).slice(0, 170);
      }
    }
  }

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
    buildError, uploadError, detailError, groupListError, internalGroups, feedback,
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
