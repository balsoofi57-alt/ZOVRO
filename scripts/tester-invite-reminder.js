'use strict';

// One-shot App Store Connect action: send or resend TestFlight invitation
// emails to the external testers named in the ZOVRO_EXTERNAL_TESTER_EMAILS
// secret. Uses the official betaTesterInvitations endpoint; no email is
// written to the repository.
const { makeToken, apiFailure } = require('./apple-release-preflight');
const ROOT = 'https://api.appstoreconnect.apple.com/v1';
const BUNDLE = 'com.zovro.app';

function parseEmails(raw) {
  return String(raw || '')
    .split(/[\s,;]+/)
    .map(value => value.trim().toLowerCase())
    .filter(value => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value));
}

async function sendInvitations({ env = process.env, fetchImpl = globalThis.fetch } = {}) {
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

  const results = [];
  for (const email of emails) {
    const record = { email, sent: false, alreadyAccepted: false, error: null };
    try {
      const found = await call('GET', '/betaTesters?filter%5Bemail%5D=' + encodeURIComponent(email) + '&limit=5');
      const tester = (found.data || []).find(t => t.attributes?.email === email);
      if (!tester?.id) throw new Error('TESTER_NOT_FOUND: ' + email + ' is not a beta tester for this team yet.');
      await call('POST', '/betaTesterInvitations', {
        data: {
          type: 'betaTesterInvitations',
          relationships: {
            betaTester: { data: { type: 'betaTesters', id: tester.id } },
            app: { data: { type: 'apps', id: app.id } }
          }
        }
      });
      record.sent = true;
    } catch (error) {
      const code = String(error.payload?.errors?.[0]?.code || '');
      if (/ALREADY_ACCEPTED/.test(code)) {
        record.alreadyAccepted = true;
      } else {
        record.error = (error.message || String(error)).slice(0, 200);
      }
    }
    results.push(record);
  }

  return {
    bundleId: BUNDLE,
    requested: emails.length,
    sent: results.filter(r => r.sent).length,
    alreadyAccepted: results.filter(r => r.alreadyAccepted).length,
    results,
    note: 'Apple queues the invitation email for delivery. Delivery itself is outside App Store Connect API control; ask the tester to check spam if it does not arrive.'
  };
}

async function cli() {
  try {
    const result = await sendInvitations();
    const report = JSON.stringify(result, null, 2);
    console.log('::notice::ZOVRO TestFlight invitation reminder sent');
    console.log(report);
    if (process.env.GITHUB_STEP_SUMMARY) {
      require('node:fs').appendFileSync(process.env.GITHUB_STEP_SUMMARY,
        '### ZOVRO TestFlight invitation reminder\n\n' + report + '\n');
    }
    if (result.results.some(r => r.error)) process.exitCode = 1;
  } catch (error) {
    console.error('::error::INVITE_REMINDER_FAILED: ' + String(error.message).slice(0, 250));
    process.exitCode = 1;
  }
}
if (require.main === module) void cli();
module.exports = { sendInvitations, parseEmails };
