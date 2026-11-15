'use strict';

// One-shot App Store Connect action: create the external TestFlight group and
// link build 395.2 to it. Does not add testers, enable a public link, or
// submit anything to the public App Store.
const { makeToken, apiFailure } = require('./apple-release-preflight');
const ROOT = 'https://api.appstoreconnect.apple.com/v1';
const BUNDLE = 'com.zovro.app';
const GROUP_NAME = 'External Testers';
const TARGET_BUILD = '395.2';

function request(fetchImpl, jwt, method, path, body) {
  return fetchImpl(ROOT + path, {
    method,
    headers: {
      Authorization: 'Bearer ' + jwt,
      Accept: 'application/json',
      ...(body ? { 'Content-Type': 'application/json' } : {})
    },
    ...(body ? { body: JSON.stringify(body) } : {})
  });
}

async function addExternalGroup({ env = process.env, fetchImpl = globalThis.fetch } = {}) {
  const jwt = makeToken(env);
  const call = async (method, path, body) => {
    const response = await request(fetchImpl, jwt, method, path, body);
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const base = apiFailure(response.status, payload);
      const wrapped = new Error(method + ' ' + path + ' -> ' + base.message);
      wrapped.cause = base;
      throw wrapped;
    }
    return { ok: true, status: response.status, payload };
  };

  const apps = await call('GET', '/apps?filter%5BbundleId%5D=' + encodeURIComponent(BUNDLE) + '&limit=5');
  
  const app = (apps.payload.data || []).find(a => a.attributes?.bundleId === BUNDLE);
  if (!app?.id) throw new Error('APPLE_APP_NOT_FOUND: No App Store Connect ZOVRO app record.');

  const groups = await call('GET', '/betaGroups?filter%5Bapp%5D=' + encodeURIComponent(app.id) + '&limit=100');
  
  const existing = (groups.payload.data || []).find(
    g => g.attributes?.name === GROUP_NAME && g.attributes?.isInternalGroup === false
  );

  let group = existing;
  let groupAction = 'reused-existing';
  if (!group) {
    const created = await call('POST', '/betaGroups', {
      data: {
        type: 'betaGroups',
        attributes: { name: GROUP_NAME, isInternalGroup: false, hasAccessToAllBuilds: false },
        relationships: { app: { data: { type: 'apps', id: app.id } } }
      }
    });
    
    group = created.payload.data;
    groupAction = 'created';
  }

  const builds = await call('GET', '/apps/' + encodeURIComponent(app.id) + '/builds?limit=100');
  
  const build = (builds.payload.data || []).find(
    b => b.attributes?.version === TARGET_BUILD && b.attributes?.processingState === 'VALID'
  );
  if (!build?.id) {
    throw new Error('TARGET_BUILD_NOT_FOUND: No VALID build ' + TARGET_BUILD + ' for ' + BUNDLE + '.');
  }

  let linkPath = null;
  let linkError = null;
  for (const [path, body] of [
    ['/builds/' + encodeURIComponent(build.id) + '/relationships/betaGroups',
      { data: [{ type: 'betaGroups', id: group.id }] }],
    ['/betaGroups/' + encodeURIComponent(group.id) + '/builds',
      { data: [{ type: 'builds', id: build.id }] }]
  ]) {
    try {
      await call('POST', path, body);
      linkPath = path;
      linkError = null;
      break;
    } catch (error) {
      linkError = error;
    }
  }
  if (!linkPath) throw linkError;

  return {
    bundleId: BUNDLE,
    group: {
      name: GROUP_NAME,
      action: groupAction,
      isInternalGroup: group.attributes?.isInternalGroup === true,
      hasAccessToAllBuilds: group.attributes?.hasAccessToAllBuilds === true,
      publicLinkEnabled: group.attributes?.publicLinkEnabled === true
    },
    build: {
      version: build.attributes?.version,
      appVersion: build.attributes?.appVersion || null,
      processingState: build.attributes?.processingState,
      expired: Boolean(build.attributes?.expired)
    },
    linked: true,
    linkedVia: linkPath,
    note: 'Build linked to the external group. Apple runs Beta App Review before external testers receive it. No testers were added and no public link was enabled by this action.'
  };
}

async function cli() {
  try {
    const result = await addExternalGroup();
    const report = JSON.stringify(result, null, 2);
    console.log('::notice::ZOVRO external TestFlight group prepared');
    console.log(report);
    if (process.env.GITHUB_STEP_SUMMARY) {
      require('node:fs').appendFileSync(process.env.GITHUB_STEP_SUMMARY,
        '### ZOVRO external TestFlight group\n\n' + report + '\n');
    }
  } catch (error) {
    console.error('::error::EXTERNAL_GROUP_FAILED: ' + String(error.message).slice(0, 250));
    process.exitCode = 1;
  }
}
if (require.main === module) void cli();
module.exports = { addExternalGroup, GROUP_NAME, TARGET_BUILD };
