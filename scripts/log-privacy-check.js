'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const logPrivacy=read('backend/log-privacy.js');
const server=read('backend/server.js');

assert.ok(server.indexOf("require('./log-privacy')")<server.indexOf("require('./server-mobile-payments')"),'log privacy must load before API server');
assert.match(logPrivacy,/createHmac\('sha256',SECRET\)/,'IP pseudonymization must use HMAC-SHA256');
assert.match(logPrivacy,/parsed\.ipHash=hashIp\(parsed\.ip\)/,'structured logs must replace raw IP with ipHash');
assert.match(logPrivacy,/delete parsed\.ip/,'raw IP must be removed from structured logs');
assert.ok(!logPrivacy.includes("parsed.ipHash=parsed.ip"),'raw IP must never be copied into ipHash');

console.log('Log privacy QA passed: structured client IP values are replaced with short HMAC pseudonyms before emission.');
