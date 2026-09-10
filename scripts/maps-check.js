'use strict';
const fs=require('fs');
function need(ok,msg){if(!ok)throw Error(msg)}
const map=fs.readFileSync('live-map.js','utf8');
const prep=fs.readFileSync('scripts/prepare-mobile.js','utf8');
const server=fs.readFileSync('backend/server-core.js','utf8');
need(map.includes("/tracking"),'live map must use authenticated request tracking');
need(map.includes('Provider exact locations remain private until a job is accepted.'),'nearby provider privacy notice missing');
need(map.includes('renderNearby')&&map.includes('renderJob'),'nearby/job map renderers missing');
need(map.includes('tile.openstreetmap.org'),'map tiles missing');
need(map.includes('© OpenStreetMap contributors'),'map attribution missing');
need(map.includes('maps.apple.com')&&map.includes('google.com/maps/dir'),'external navigation missing');
need(map.includes('setInterval')&&map.includes('10000'),'live refresh cadence missing');
need(prep.includes("<script src=\"live-map.js\"></script>"),'mobile bundle does not load live map');
need(prep.includes("'live-map.js'"),'mobile bundle does not copy live map');
need(server.includes("/api/requests/")&&server.includes('/tracking'),'tracking API missing');
need(server.includes("r.customerId===me.uid||r.providerId===me.uid"),'tracking authorization guard missing');
need(!server.match(/providers\/nearby[^\n]*lat:x\.location/),'nearby API must not expose provider exact coordinates');
console.log('ZOVRO maps/tracking QA passed: rendering, privacy, tracking authorization, navigation, attribution and refresh checks are present.');
