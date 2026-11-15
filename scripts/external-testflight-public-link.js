'use strict';

// One-shot App Store Connect action: enable the public TestFlight join link on
// the external group. Does not add testers by email or change build links.
const { makeToken, apiFailure } = require('./apple-release-preflight');
const ROOT = 'https://api.appstoreconnect.apple.com/v1';
const BUNDLE = 'com.zovro.app';
const GROUP_NAME = 'External Testers';

async function enablePublicLink({ env = process.env, fetchImpl = globalThis.fetch } = {}) {
  const jwt = makeToken(env);
  const call = async (method, path, body) => {
    const response = await fetchImpl(ROOT + path, {
      method,
      headers: {
        Authorization: 'Bearer ' + jwt,
        Accept: 'application/json',
        ...(body ? { 'Content-Type': 'application/json' } : {})
      },
      ...(body ? { body: JSON.stringify(body) } : {})
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const base = apiFailure(response.status, payload);
      throw new Error(method + ' ' + path + ' -> ' + base.message);
    }
    return payload;
  };

  const apps = await call('GET', '/apps?filter%5BbundleId%5D=' + encodeURIComponent(BUNDLE) + '&limit=5');
  const app = (apps.data || []).find(a => a.attributes?.bundleId === BUNDLE);
  if (!app?.id) throw new Error('APPLE_APP_NOT_FOUND: No App Store Connect ZOVRO app record.');

  const groups = await call('GET', '/betaGroups?filter%5Bapp%5D=' + encodeURIComponent(app.id) + '&limit=100');
  const group = (groups.data || []).find(
    g => g.attributes?.name === GROUP_NAME && g.attributes?.isInternalGroup === false
  );
  if (!group?.id) {
    throw new Error('EXTERNAL_GROUP_NOT_FOUND: Run the external group action for build 395.2 first.');
  }

  await call('PATCH', '/betaGroups/' + encodeURIComponent(group.id), {
    data: {
      type: 'betaGroups',
      id: group.id,
      attributes: { publicLinkEnabled: true }
    }
  });

  const after = await call('GET', '/betaGroups/' + encodeURIComponent(group.id));
  const attributes = after.data?.attributes || {};
  return {
    bundleId: BUNDLE,
    group: {
      name: GROUP_NAME,
      isInternalGroup: attributes.isInternalGroup === true,
      publicLinkEnabled: attributes.publicLinkEnabled === true,
      publicLinkLimit: attributes.publicLinkLimit ?? null,
      publicLinkMinimumNumberOfTesters: attributes.publicLinkMinimumNumberOfTesters ?? null
    },
    note: 'Public join link enabled on the external group. Apple exposes the testflight.apple.com/join URL in App Store Connect under the group; the API does not return the link itself. External availability still requires Beta App Review to pass for build 395.2.'
  };
}

async function cli() {
  try {
    const result = await enablePublicLink();
    const report = JSON.stringify(result, null, 2);
    console.log('::notice::ZOVRO external TestFlight public link enabled');
    console.log(report);
    if (process.env.GITHUB_STEP_SUMMARY) {
      require('node:fs').appendFileSync(process.env.GITHUB_STEP_SUMMARY,
        '### ZOVRO external TestFlight public link\n\n' + report + '\n');
    }
  } catch (error) {
    console.error('::error::PUBLIC_LINK_FAILED: ' + String(error.message).slice(0, 250));
    process.exitCode = 1;
  }
}
if (require.main === module) void cli();
module.exports = { enablePublicLink, GROUP_NAME };
