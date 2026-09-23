'use strict';

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
let bad = false;

function fail(message) {
  console.error('mobile-release-workflow-check:', message);
  bad = true;
}

function requireTokens(name, text, tokens) {
  for (const token of tokens) {
    if (!text.includes(token)) fail(name + ' missing required guard: ' + token);
  }
}

function forbidTokens(name, text, tokens) {
  for (const token of tokens) {
    if (text.includes(token)) fail(name + ' contains forbidden release behavior: ' + token);
  }
}

const android = read('.github/workflows/android-build.yml');
const androidVerification = read('.github/workflows/android-release.yml');
const ios = read('.github/workflows/ios-release.yml');

requireTokens('Android workflow', android, [
  'branches: [store-release-prep, zovro-final-deploy]',
  'upload_google_play:',
  'default: false',
  "github.event_name == 'workflow_dispatch'",
  'inputs.upload_google_play == true',
  "steps.signing.outputs.available == 'true'",
  'ZOVRO_ANDROID_KEYSTORE_BASE64',
  'ZOVRO_ANDROID_KEYSTORE_PASSWORD',
  'ZOVRO_ANDROID_KEY_ALIAS',
  'ZOVRO_ANDROID_KEY_PASSWORD',
  'ZOVRO_GOOGLE_PLAY_SERVICE_ACCOUNT_JSON',
  'google-github-actions/auth@7c6bc770dae815cd3e89ee6cdf493a5fab2cc093',
  'https://www.googleapis.com/auth/androidpublisher',
  'jarsigner -verify',
  'VERSION_CODE=$((GITHUB_RUN_NUMBER * 100 + GITHUB_RUN_ATTEMPT))',
  'tracks/internal',
  'status:"draft"',
  'changesNotSentForReview=true',
  'changesInReviewBehavior=ERROR_IF_IN_REVIEW'
]);

requireTokens('Android verification workflow', androidVerification, [
  'branches: [main, store-release-prep, zovro-final-deploy]',
  'ZOVRO_ANDROID_KEYSTORE_BASE64',
  'jarsigner -verify',
  'app-release.aab.sha256'
]);

requireTokens('iOS workflow', ios, [
  'branches: [main, store-release-prep, zovro-final-deploy]',
  'upload_testflight:',
  'default: false',
  "github.event_name == 'workflow_dispatch'",
  'inputs.upload_testflight == true',
  "steps.signing.outputs.available == 'true'",
  'ZOVRO_IOS_CERTIFICATE_P12_BASE64',
  'ZOVRO_IOS_CERTIFICATE_PASSWORD',
  'ZOVRO_IOS_PROVISIONING_PROFILE_BASE64',
  'ZOVRO_APPLE_TEAM_ID',
  'ZOVRO_APP_STORE_CONNECT_API_KEY_ID',
  'ZOVRO_APP_STORE_CONNECT_ISSUER_ID',
  'ZOVRO_APP_STORE_CONNECT_API_PRIVATE_KEY_BASE64',
  'PRODUCT_BUNDLE_IDENTIFIER=com.zovro.app',
  'CURRENT_PROJECT_VERSION="$GITHUB_RUN_NUMBER.$GITHUB_RUN_ATTEMPT"',
  'codesign --verify --deep --strict',
  '--validate-app',
  '--upload-app',
  'trap cleanup_api_key EXIT',
  'if: always()'
]);

forbidTokens('Android verification workflow', androidVerification, [
  'tracks/production',
  'status:"completed"',
  'status:"inProgress"',
  'upload_google_play'
]);

forbidTokens('Android workflow', android, [
  'tracks/production',
  'status:"completed"',
  'status:"inProgress"'
]);

forbidTokens('iOS workflow', ios, [
  '--submit-for-review',
  'submitForReview',
  'automaticRelease'
]);

for (const [name, text] of [['Android workflow', android], ['Android verification workflow', androidVerification], ['iOS workflow', ios]]) {
  if (!/permissions:\s*\n\s*contents:\s*read/.test(text)) {
    fail(name + ' must keep repository permissions read-only');
  }
}

const secretFileExtensions = new Set(['.jks', '.keystore', '.p8', '.p12', '.mobileprovision']);
const excludedDirectories = new Set(['.git', 'node_modules', 'android', 'ios', 'build', 'www']);

function scan(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && excludedDirectories.has(entry.name)) continue;
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) scan(fullPath);
    else if (secretFileExtensions.has(path.extname(entry.name).toLowerCase())) {
      fail('signing material must not be committed: ' + path.relative(root, fullPath));
    }
  }
}

// Execute the actual early upload guard with dummy values, never real credentials.
const { spawnSync } = require('node:child_process');
for (const [name, workflow, flag] of [['Android', android, 'upload_google_play'], ['iOS', ios, 'upload_testflight']]) {
  const step = workflow.match(/      - name: Require credentials for requested store upload\n([\s\S]*?)(?=\n      - )/);
  if (!step) { fail(name + ' must reject incomplete explicitly requested uploads'); continue; }
  requireTokens(name + ' upload preflight', step[1], ["github.event_name == 'workflow_dispatch'", 'inputs.' + flag + ' == true']);
  const names = [...step[1].matchAll(/          (ZOVRO_[A-Z0-9_]+):/g)].map(m => m[1]);
  const body = step[1].split('        run: |\n')[1].split('\n').map(line => line.replace(/^          /, '')).join('\n');
  const complete = Object.fromEntries(names.map(key => [key, 'private-test-value']));
  for (const missing of [null, ...names, 'ALL']) {
    const env = {PATH: process.env.PATH, ...complete};
    if (missing === 'ALL') for (const key of names) delete env[key];
    else if (missing) delete env[missing];
    const result = spawnSync('bash', ['-c', body], {env, encoding: 'utf8'});
    if ((result.status === 0) !== (missing === null)) fail(name + ' upload guard accepted missing credentials or rejected complete credentials');
    if ((result.stdout + result.stderr).includes('private-test-value')) fail(name + ' upload guard exposed a credential value');
  }
}

scan(root);

if (bad) process.exit(1);
console.log('mobile-release-workflow-check: PASS');
