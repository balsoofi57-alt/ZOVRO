'use strict';
const fs=require('fs'),path=require('path');
const file=path.join(__dirname,'..','push-client.js');
const s=fs.readFileSync(file,'utf8');
const required=[
  "OneSignalCapacitor",
  "initialize({appId:APP_ID})",
  "login({externalId:userId})",
  "requestPermission({fallbackToSettings:false})",
  "addListener('notificationClick'",
  "addListener('permissionChange'",
  "addListener('pushSubscriptionChange'",
  "getPushSubscriptionId()",
  "getPushSubscriptionToken",
  "getPushSubscriptionOptedIn",
  "requestInitialPermission",
  "routeNotification",
  "window.ZOVRO_PUSH"
];
for(const token of required)if(!s.includes(token))throw new Error('Missing mobile push guard: '+token);
if(!s.includes("data.requestId||data.request_id"))throw new Error('Notification request routing is missing');
if(!s.includes("nav('jobs'"))throw new Error('Notification tap does not route to jobs');
if(/ONESIGNAL_REST_API_KEY|authorization:\s*[`'"]Key/.test(s))throw new Error('Server push secret must never be present in mobile client');

const initialPermission=s.match(/async function requestInitialPermission\([\s\S]*?\n  }/);
if(!initialPermission)throw new Error('Initial permission helper is missing');
const flow=initialPermission[0];
const requestAt=flow.indexOf("await p.requestPermission({fallbackToSettings:false})");
const markerAt=flow.indexOf("localStorage.setItem(permissionKey,'1')");
if(requestAt<0||markerAt<0||markerAt<requestAt)throw new Error('Permission completion marker must be written only after the request resolves');
if(/finally\s*\{[^}]*localStorage\.setItem/.test(flow))throw new Error('A failed permission request must not be marked complete');

console.log('ZOVRO mobile OneSignal registration and tap-routing check passed.');
