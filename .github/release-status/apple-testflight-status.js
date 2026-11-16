'use strict';

/*
 * Read-only App Store Connect inspection. Never mutate builds or tester groups.
 * Runs in GitHub Actions with already-configured protected App Store Connect
 * credentials; no API tokens or other secrets are printed.
 */
const fs = require('node:fs');
const { makeToken } = require('../../scripts/apple-release-preflight');

const BUNDLE_ID = 'com.zovro.app';
const APPSTORE_URL = 'https://api.appstoreconnect.apple.com';

async function requestJson(path, token, fetchImpl) {
  const response = await fetchImpl(APPSTORE_URL + path, {
    method: 'GET',
    headers: {
      Authorization: 'Bearer ' + token,
      Accept: 'application/json'
    }
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const code = String(payload?.errors?.[0]?.code || 'UNKNOWN').slice(0, 90);
    throw Error('APP_STORE_CONNECT_READ_ONLY_CHECK_FAILED: HTTP ' + response.status + ' (' + code + ')');
  }
  return payload;
}

async function readBuildStatus({ env = process.env, fetchImpl = fetch } = {}) {
  const token = makeToken(env);
  const apps = await requestJson(
    '/v1/apps?filter%5BbundleId%5D=' + encodeURIComponent(BUNDLE_ID) + '&limit=5',
    token, fetchImpl
  );
  const app = (apps.data || []).find(item => item.attributes?.bundleId === BUNDLE_ID);
  if (!app?.id) throw Error('ZOVRO_APP_NOT_ACCESSIBLE_FOR_THIS_APPLE_API_KEY');

  const qs = new URLSearchParams({
    'filter[app]': String(app.id),
    'sort': '-uploadedDate',
    'limit': '10'
  });
  const response = await requestJson('/v1/builds?' + qs.toString(), token, fetchImpl);
  const builds = (response.data || []).map(build => {
    const attr = build.attributes || {};
    return {
      id: String(build.id || ''),
      version: String(attr.version || ''),
      uploadedDate: attr.uploadedDate || null,
      processingState: String(attr.processingState || 'UNKNOWN'),
      expired: Boolean(attr.expired)
    };
  });
  return { bundleId: BUNDLE_ID, builds };
}

function summary(result) {
  const lines = [
    '## ZOVRO TestFlight processing status (Apple read-only)',
    '',
    'App: ' + result.bundleId,
    'This confirms App Store Connect build processing only, not tester availability or installation.',
    ''
  ];
  if (!result.builds.length) lines.push('No visible builds for this API key.');
  for (const b of result.builds) {
    lines.push('- Build ' + (b.version || '(unknown)') +
      ' | processingState=' + b.processingState +
      ' | uploaded=' + (b.uploadedDate || 'unknown') +
      ' | expired=' + b.expired);
  }
  return lines.join('\n') + '\n';
}

async function cli() {
  try {
    const status = await readBuildStatus();
    const text = summary(status);
    process.stdout.write(text);
    if (process.env.GITHUB_STEP_SUMMARY) {
      fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, text);
    }
  } catch (err) {
    console.error('::error::' + err.message);
    process.exitCode = 1;
  }
}

if (require.main === module) void cli();
module.exports = { readBuildStatus, summary, requestJson };
