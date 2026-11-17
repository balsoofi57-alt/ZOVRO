'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const server = fs.readFileSync(path.resolve(__dirname,'../backend/server-core.js'),'utf8');

test('service remains required but problem description is optional', () => {
  assert.match(server, /if\(typeof b\.service!=='string'\|\|!b\.service\.trim\(\)\)return json\(res,400,\{error:'Service is required'\}\)/);
  assert.doesNotMatch(server, /if\(!b\.service\|\|!b\.details\)/);
  assert.match(server, /details:String\(b\.details\?\?''\)\.slice\(0,1000\)/);
});

test('both provider notification paths handle empty problem descriptions', () => {
  const matches = server.match(/r\.service\+\(r\.details\?': '\+r\.details\.slice\(0,120\):''\)/g) || [];
  assert.equal(matches.length, 2);
  assert.doesNotMatch(server, /r\.service\+': '\+r\.details\.slice\(0,120\)/);
});

test('description stays bounded to 1000 characters; SOS unique ID guard is retained', () => {
  assert.match(server, /details:String\(b\.details\?\?''\)\.slice\(0,1000\)/);
  assert.match(server, /if\(b\.service!=='Roadside Assistance'\|\|b\.urgent!==true/);
});
