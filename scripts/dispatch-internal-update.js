'use strict';

const WORKFLOWS = {
  ios: { file: 'ios-release.yml', input: 'upload_testflight' },
  android: { file: 'android-build.yml', input: 'upload_google_play' }
};

function validate(env) {
  const platform = env.ZOVRO_RELEASE_PLATFORM || '';
  const ref = env.GITHUB_REF_NAME || '';
  const repo = env.GITHUB_REPOSITORY || '';
  const token = env.GH_TOKEN || '';
  if (!['ios', 'android', 'both'].includes(platform)) {
    throw new Error('Select iOS, Android, or both.');
  }
  if (repo !== 'balsoofi57-alt/ZOVRO') throw new Error('Unexpected repository; refusing dispatch.');
  if (!/^[A-Za-z0-9._/-]+$/.test(ref) || ref.startsWith('/') || ref.includes('..')) {
    throw new Error('Invalid GitHub release branch.');
  }
  if (!token) throw new Error('Missing GitHub Actions token with actions:write.');
  return {
    platform,
    ref,
    repo,
    token,
    upload: env.ZOVRO_RELEASE_UPLOAD === 'true'
  };
}

async function dispatchRelease({ env = process.env, fetchImpl = globalThis.fetch } = {}) {
  const cfg = validate(env);
  const channels = cfg.platform === 'both' ? ['ios', 'android'] : [cfg.platform];
  const dispatched = [];
  for (const platform of channels) {
    const workflow = WORKFLOWS[platform];
    const url = 'https://api.github.com/repos/' + cfg.repo + '/actions/workflows/' +
      workflow.file + '/dispatches';
    const response = await fetchImpl(url, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + cfg.token,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ref: cfg.ref,
        inputs: { [workflow.input]: cfg.upload ? 'true' : 'false' }
      })
    });
    if (response.status !== 204) {
      throw new Error('Unable to start ' + platform + ' workflow (HTTP ' +
        response.status + '). ' + dispatched.join(', ') +
        ' may have started; check GitHub Actions before retrying.');
    }
    dispatched.push(platform);
    console.log('Queued ' + platform + ' ' +
      (cfg.upload ? 'internal-store upload' : 'build only') + ' workflow on ' + cfg.ref);
  }
  return dispatched;
}

async function cli() {
  try {
    const dispatched = await dispatchRelease();
    console.log('::notice::Started ' + dispatched.join(' and ') +
      ' workflow(s). Final success is determined by the child workflow and store processing, not by dispatch.');
    const summary = process.env.GITHUB_STEP_SUMMARY;
    if (summary) {
      const fs = require('node:fs');
      const cfg = validate(process.env);
      const lines = ['### ZOVRO update tasks queued', ''];
      for (const platform of dispatched) {
        const workflow = WORKFLOWS[platform];
        lines.push('- [' + platform + ' build](' +
          'https://github.com/' + cfg.repo + '/actions/workflows/' + workflow.file + ')');
      }
      lines.push('', 'Store acceptance and TestFlight processing must be checked after these jobs finish.');
      fs.appendFileSync(summary, lines.join('\n') + '\n');
    }
  } catch (error) {
    console.error('::error::' + error.message);
    process.exitCode = 1;
  }
}

if (require.main === module) void cli();

module.exports = { validate, dispatchRelease };
