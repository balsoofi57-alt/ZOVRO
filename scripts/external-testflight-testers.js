'use strict';

// One-shot App Store Connect action: add external beta testers by email to the
// External Testers group. Emails arrive via the ZOVRO_EXTERNAL_TESTER_EMAILS
// secret (comma or newline separated); no email is written to the repository.
const { makeToken, apiFailure } = require('./apple-release-preflight');
const ROOT = 'https://api.appstoreconnect.apple.com/v1';
const BUNDLE = 'com.zovro.app';
const GROUP_NAME = 'External Testers';

function parseEmails(raw) {
  return String(raw || '')
    .split(/[\s,;]+/)
    .map(value => value.trim().toLowerCase())
    .filter(value => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value));
}

async function addTesters({ env = process.env, fetchImpl = globalThis.fetch } = {}) {
  const emails = parseEmails(env.ZOVRO_EXTERNAL_TESTER_EMAILS);
  if (!emails.length) throw new Error('TESTER_EMAILS_MISSING: ZOVRO_EXTERNAL_TESTER_EMAILS is empty or invalid.');
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
      const wrapped = new Error(method + ' ' + path + ' -> ' + base.message);
      wrapped.status = response.status;
      wrapped.payload = payload;
      throw wrapped;
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

  const results = [];
  for (const email of emails) {
    const record = { email, action: null, error: null };
    try {
      // Create the beta tester directly inside the external group.
      await call('POST', '/betaTesters', {
        data: {
          type: 'betaTesters',
          attributes: { email },
          relationships: {
            betaGroups: { data: [{ type: 'betaGroups', id: group.id }] }
          }
        }
      });
      record.action = 'invited';
    } catch (error) {
      const exists = error.status === 409 || /ALREADY|EXIST/i.test(error.message);
      if (!exists) {
        record.error = error.message.slice(0, 200);
        results.push(record);
        continue;
      }
      try {
        // Tester already exists in App Store Connect: attach them to the group.
        const found = await call('GET', '/betaTesters?filter%5Bemail%5D=' + encodeURIComponent(email) + '&limit=5');
        const tester = (found.data || []).find(t => t.attributes?.email === email);
        if (!tester?.id) throw new Error('TESTER_NOT_FOUND after exists error');
        await call('POST', '/betaTesters/' + encodeURIComponent(tester.id) + '/relationships/betaGroups', {
          data: [{ type: 'betaGroups', id: group.id }]
        });
        record.action = 'invited-existing';
      } catch (retryError) {
        record.error = String(retryError.message).slice(0, 200);
      }
    }
    results.push(record);
  }

  const failures = results.filter(r => r.error);
  return {
    bundleId: BUNDLE,
    group: { name: GROUP_NAME, isInternalGroup: false },
    requested: emails.length,
    invited: results.filter(r => r.action).length,
    results,
    note: failures.length
      ? 'Some invitations failed; see per-email errors. Apple sends invitation emails; external availability still requires Beta App Review for build 395.2.'
      : 'Apple sends invitation emails to each tester; external availability still requires Beta App Review for build 395.2.'
  };
}

async function cli() {
  try {
    const result = await addTesters();
    const report = JSON.stringify(result, null, 2);
    console.log('::notice::ZOVRO external TestFlight testers invited');
    console.log(report);
    if (process.env.GITHUB_STEP_SUMMARY) {
      require('node:fs').appendFileSync(process.env.GITHUB_STEP_SUMMARY,
        '### ZOVRO external TestFlight testers\n\n' + report + '\n');
    }
    if (result.results.some(r => r.error)) process.exitCode = 1;
  } catch (error) {
    console.error('::error::EXTERNAL_TESTERS_FAILED: ' + String(error.message).slice(0, 250));
    process.exitCode = 1;
  }
}
if (require.main === module) void cli();
module.exports = { addTesters, parseEmails, GROUP_NAME };
