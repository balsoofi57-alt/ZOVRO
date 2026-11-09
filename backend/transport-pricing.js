'use strict';
const crypto=require('node:crypto');

const GROUPS=Object.freeze({
  'Moving':'moving','Furniture Moving':'moving','Furniture Delivery':'moving','Appliance Delivery':'moving',
  'Pickup-Truck Help':'moving','Towing':'towing','Emergency Towing':'towing','Vehicle Transport':'towing',
  'Hauling':'hauling','Junk Removal':'hauling','Local Courier':'courier'
});
const LABOR_GROUPS=new Set(['moving','hauling']);
// Planning estimates only. A provider must independently quote the one all-in
// amount and the customer must approve that price before any payment.
const DEFAULT_RATES=Object.freeze({
  moving:{baseCents:6500,perMileCents:275,perWorkerHourCents:3500},
  hauling:{baseCents:8500,perMileCents:300,perWorkerHourCents:3500},
  towing:{baseCents:9500,perMileCents:325,perWorkerHourCents:0},
  courier:{baseCents:2000,perMileCents:180,perWorkerHourCents:0}
});
const normalizeAddress=x=>typeof x==='string'?x.trim().replace(/\s+/g,' ').slice(0,200):'';
const isTransportService=service=>Object.prototype.hasOwnProperty.call(GROUPS,String(service||''));
const requiresLabor=service=>LABOR_GROUPS.has(GROUPS[String(service||'')]);
function validateTransport(service,raw){
  if(!isTransportService(service))return null;
  if(!raw||typeof raw!=='object'||Array.isArray(raw))throw Error('Pickup and drop-off details are required for transportation requests.');
  // A customer may explicitly share their current roadside GPS position, or
  // type an entirely different pickup address for someone else. Never mix them.
  let pickupLocation=null;
  if(raw.pickupLocation!=null){
    const loc=raw.pickupLocation;
    if(!loc||typeof loc!=='object'||Array.isArray(loc)||!Number.isFinite(loc.lat)||!Number.isFinite(loc.lng)||Math.abs(loc.lat)>90||Math.abs(loc.lng)>180||!Number.isFinite(loc.accuracy)||loc.accuracy<0||loc.accuracy>1000||typeof loc.capturedAt!=='string'||!Number.isFinite(Date.parse(loc.capturedAt))||Math.abs(Date.now()-Date.parse(loc.capturedAt))>120000)throw Error('Current GPS pickup has expired or is invalid. Refresh your location or enter a pickup address manually.');
    pickupLocation={lat:loc.lat,lng:loc.lng,accuracy:loc.accuracy,capturedAt:loc.capturedAt};
  }
  const pickupAddress=pickupLocation?'GPS location: '+pickupLocation.lat.toFixed(6)+', '+pickupLocation.lng.toFixed(6):normalizeAddress(raw.pickupAddress);
  const dropoffAddress=normalizeAddress(raw.dropoffAddress);
  if((!pickupLocation&&pickupAddress.length<8)||dropoffAddress.length<8)throw Error('Enter complete pickup and drop-off street addresses, or use your current GPS pickup with a written destination.');
  if(!pickupLocation&&pickupAddress.toLowerCase()===dropoffAddress.toLowerCase())throw Error('Pickup and drop-off must be different addresses.');
  const labor=requiresLabor(service),workers=labor?Number(raw.workers):0,hours=labor?Number(raw.hours):0;
  if(labor&&(!Number.isInteger(workers)||workers<1||workers>8))throw Error('Choose 1 to 8 loading and unloading workers.');
  if(labor&&(!Number.isFinite(hours)||hours<1||hours>16||Math.round(hours*2)!==hours*2))throw Error('Choose 1 to 16 labor hours in half-hour steps.');
  return {pickupAddress,dropoffAddress,workers,hours,includesLoadingUnloading:labor,pickupLocation};
}
function ratesFor(service,env=process.env){
  const group=GROUPS[service];if(!group)throw Error('Transportation service is not supported.');
  const defaults=DEFAULT_RATES[group];
  const keys={baseCents:'ZOVRO_TRANSPORT_'+group.toUpperCase()+'_BASE_CENTS',perMileCents:'ZOVRO_TRANSPORT_'+group.toUpperCase()+'_MILE_CENTS',perWorkerHourCents:'ZOVRO_TRANSPORT_'+group.toUpperCase()+'_WORKER_HOUR_CENTS'};
  const values={};
  for(const [field,key] of Object.entries(keys)){
    const configured=env[key];
    const n=configured==null||configured===''?defaults[field]:Number(configured);
    if(!Number.isInteger(n)||n<0||n>100000)throw Error('Transportation rate configuration is invalid.');
    values[field]=n;
  }
  return values;
}
function buildEstimate(service,transport,distanceMeters,env=process.env){
  const distance=Number(distanceMeters);
  if(!Number.isFinite(distance)||distance<=0||distance>1609344)throw Error('A valid drivable route within 1,000 miles was not found.');
  const miles=Math.max(0.1,Math.ceil(distance/1609.344*10)/10);
  const rates=ratesFor(service,env);
  const distanceCents=Math.round(miles*rates.perMileCents);
  const laborCents=Math.round(transport.workers*transport.hours*rates.perWorkerHourCents);
  const estimatedTotalCents=rates.baseCents+distanceCents+laborCents;
  return {distanceMiles:miles,workers:transport.workers,hours:transport.hours,baseCents:rates.baseCents,distanceCents,laborCents,estimatedTotalCents,currency:'USD',kind:'planning-estimate',paymentCount:1,includesLabor:transport.includesLoadingUnloading};
}
async function drivingDistanceMeters(pickupAddress,dropoffAddress,{apiKey=process.env.ZOVRO_GOOGLE_ROUTES_API_KEY,fetchImpl=globalThis.fetch,pickupLocation=null}={}){
  if(!apiKey)throw Object.assign(Error('Automatic road-mile estimates are not configured yet. A provider can still give you a single all-inclusive price.'),{code:'ROUTING_NOT_CONFIGURED'});
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),7500);
  try{
    const response=await fetchImpl('https://routes.googleapis.com/directions/v2:computeRoutes',{
      method:'POST',signal:controller.signal,
      headers:{'Content-Type':'application/json','X-Goog-Api-Key':apiKey,'X-Goog-FieldMask':'routes.distanceMeters'},
      body:JSON.stringify({origin:pickupLocation?{location:{latLng:{latitude:pickupLocation.lat,longitude:pickupLocation.lng}}}:{address:pickupAddress},destination:{address:dropoffAddress},travelMode:'DRIVE',routingPreference:'TRAFFIC_UNAWARE',computeAlternativeRoutes:false})
    });
    if(!response.ok)throw Error('Road-distance service could not calculate this route.');
    const result=await response.json();
    const meters=Number(result?.routes?.[0]?.distanceMeters);
    if(!Number.isFinite(meters)||meters<=0)throw Error('No drivable route found. Check both addresses.');
    return meters;
  }finally{clearTimeout(timer)}
}
const sign=(payload,secret)=>crypto.createHmac('sha256',secret).update(payload).digest('base64url');
function issueEstimateToken(service,transport,estimate,secret,now=Date.now()){
  if(!secret||secret.length<20)throw Error('Quote signing is unavailable.');
  const data={service,transport,estimate,expiresAt:now+15*60*1000};
  const data64=Buffer.from(JSON.stringify(data)).toString('base64url');
  return data64+'.'+sign(data64,secret);
}
function verifyEstimateToken(token,service,transport,secret,now=Date.now()){
  if(typeof token!=='string'||token.length>4096||!secret)return null;
  const parts=token.split('.');if(parts.length!==2)return null;
  const expected=sign(parts[0],secret);
  if(parts[1].length!==expected.length||!crypto.timingSafeEqual(Buffer.from(parts[1]),Buffer.from(expected)))return null;
  try{
    const data=JSON.parse(Buffer.from(parts[0],'base64url').toString('utf8'));
    if(data.expiresAt<=now||data.expiresAt>now+16*60*1000||data.service!==service||JSON.stringify(data.transport)!==JSON.stringify(transport))return null;
    if(data.estimate?.kind!=='planning-estimate'||data.estimate?.paymentCount!==1||!Number.isInteger(data.estimate?.estimatedTotalCents)||data.estimate.estimatedTotalCents<0)return null;
    return data.estimate;
  }catch{return null}
}
module.exports={isTransportService,requiresLabor,validateTransport,buildEstimate,drivingDistanceMeters,issueEstimateToken,verifyEstimateToken};
