'use strict';
(function(root,factory){
  const api=factory(typeof module!=='undefined'&&module.exports?require('./service-catalog'):root.ZOVRO_CATALOG);
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  if(root)root.ZOVRO_PROVIDER_SERVICES=api;
})(typeof window!=='undefined'?window:null,function(catalog){
  const groups=catalog.SERVICE_CATALOG.map(g=>({id:g.id,label:g.label.en,services:g.services.map(s=>({id:s.id,label:s.label.en}))}));
  groups.push({id:'additional-services',label:'Additional services',services:[{id:'lawn-snow',label:'Lawn & Snow'},{id:'pest-rodent-control',label:'Pest & Rodent Control'}]});
  const all=[...new Map(groups.flatMap(g=>g.services).map(s=>[s.id,s])).values()];
  const names=new Map(all.flatMap(s=>[[s.id.toLowerCase(),s.label],[s.label.toLowerCase(),s.label]]));
  names.set('flooring','Flooring Installation & Repair');
  const roadside=new Set(['Tire Change','Mobile Tire Service','Flat Tire Repair','Jump Start','Battery Replacement','Fuel Delivery','Vehicle Lockout','Towing','Emergency Roadside Assistance','Emergency Towing']);
  function canonical(value){return typeof value==='string'?names.get(value.trim().toLowerCase())||null:null}
  function validateServices(values){
    if(!Array.isArray(values)||!values.length||values.length>all.length)throw Error('Choose at least one service from the list.');
    const normalized=values.map(canonical);
    if(normalized.some(s=>!s))throw Error('Choose valid services from the list.');
    return [...new Set(normalized)];
  }
  function servicesFor(user={}){
    // Existing single-service accounts continue to work without a bulk migration.
    if(Array.isArray(user.services))return [...new Set(user.services.map(canonical).filter(Boolean))];
    return typeof user.service==='string'&&user.service.trim()?[canonical(user.service)||user.service.trim()]:[];
  }
  function matchesService(user,requested){
    const selected=servicesFor(user);
    if(!requested)return selected.length>0;
    const service=canonical(requested)||String(requested).trim();
    if(selected.includes(service))return true;
    // An unspecified SOS can reach roadside specialists; a specific job must
    // match an explicitly selected skill, never every skill in its category.
    return (service==='Roadside Assistance'||service==='Emergency Roadside Assistance')&&selected.some(s=>s==='Roadside Assistance'||roadside.has(s));
  }
  // Conservative shared classification for both bundled clients and the API.
  const aliases={
    'Tree Service':['tree services','tree service','tree removal','tree trimming','trim trees','cut down a tree','stump removal','stump grinding','tree','trees','branch','branches','tree branch','fallen tree','fallen branch','remove tree','cut tree','trim tree','stump','shajara','ashjar','شجرة','الشجرة','اشجار','الأشجار','اشجار','خدمة الاشجار','خدمة الأشجار','قص شجرة','قطع شجرة','تقليم شجرة','تقليم الاشجار','تقليم الأشجار','ازالة شجرة','إزالة شجرة','ازالة الاشجار','إزالة الأشجار','جذع شجرة','طحن الجذع'],
    'Tire Change':['flat tire','change tire'],
    'Jump Start':['dead battery','jumpstart'],
    'Vehicle Lockout':['locked out of car','car lockout'],
    'Towing':['need a tow','tow truck'],
    'Plumbing':['leaking pipe','pipe leak','clogged drain','clogged toilet','plumber'],
    'Electrical':['electrician','breaker keeps tripping'],
    'HVAC':['air conditioner','furnace repair'],
    'Lawn Mowing':['mow lawn','cut grass'],
    'Snow Removal':['shovel snow'],
    'Painting':['paint walls','house painting'],
    'Moving':['need movers','move furniture']
  };
  for(const [service,words] of Object.entries({"Pest & Rodent Control":["bed bug","bedbug","bed bugs","bedbugs","cockroach","cockroaches","roach","roaches","termite","termites","ant infestation","ants","flea","fleas","ticks","tick bite","spider","spiders","wasp","wasps","hornet","hornets","yellow jacket","yellowjackets","mouse","mice","rat infestation","rats","rodent","rodents","droppings","gnaw marks","seal entry","entry point","holes in wall","prevent rodents","pest inspection","pest prevention","bugs in house","insects in house"],"Tire Change":["flat tire","tire blew","tire change","change tire"],"Jump Start":["dead battery","jump start","jumpstart"],"Vehicle Lockout":["locked out of car","car lockout"],"Towing":["need a tow","tow truck"],"Painting":["paint walls","house painting","interior painting","exterior painting"],"Flooring Installation & Repair":["install flooring","flooring repair","floor installation","install laminate","install hardwood"],"Roadside Assistance":["flat tire","tire blew","dead battery","jump start","jumpstart","locked out of car","car lockout","need a tow","tow truck","stuck on road","roadside"],"Mobile Mechanic":["car won’t start","car wont start","check engine","engine problem","brake problem","car overheating","alternator","starter motor","mechanic","car repair"],"Plumbing":["leaking pipe","pipe leak","water leak","clogged drain","clogged toilet","toilet overflowing","faucet leak","water heater","no hot water","plumber","sewer backup"],"Electrical":["power outlet","outlet not working","breaker keeps tripping","circuit breaker","electrical short","sparks from outlet","light switch","electrician","power issue"],"HVAC":["ac not working","air conditioner","no heat","heater not working","furnace","hvac","thermostat","house too hot","house too cold"],"Appliance Repair":["refrigerator not cooling","fridge not cooling","washer not working","dryer not heating","dishwasher not working","oven not heating","appliance repair"],"Moving":["need movers","moving furniture","move furniture","moving boxes","help moving","small move","搬家"],"Lawn & Snow":["mow lawn","lawn mowing","cut grass","yard work","snow removal","shovel snow","plow driveway","leaf cleanup"]}))aliases[service]=[...(aliases[service]||[]),...words];
  aliases['Roadside Assistance']=(aliases['Roadside Assistance']||[]).filter(word=>!Object.entries(aliases).some(([name,words])=>name!=='Roadside Assistance'&&words.includes(word)));
  const normalize=text=>String(text||'').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
  function inferService(details){
    if(typeof details!=='string'||details.length>1000)return null;
    const normalized=normalize(details);
    const text=' '+normalized+' ';
    // Negation and multiple distinct services need the customer's own selection.
    if(/\b(no|not|without|dont|don t|instead|rather)\b/.test(text))return null;
    const scores=new Map();
    const add=(service,points)=>scores.set(service,(scores.get(service)||0)+points);
    for(const item of all){
      for(const phrase of [item.label,...(aliases[item.label]||[])]){
        const p=normalize(phrase);
        if(!p)continue;
        const needle=' '+p+' ';
        const words=p.split(' ').filter(Boolean);
        if(text.includes(needle)){
          add(item.label,Math.max(4,words.length*4));
          continue;
        }
        if(words.length>1&&words.every(word=>text.includes(' '+word+' ')))add(item.label,words.length*2);
      }
    }
    const ranked=[...scores.entries()].sort((a,b)=>b[1]-a[1]);
    if(!ranked.length)return null;
    const [best,bestScore]=ranked[0], secondScore=ranked[1]?.[1]||0;
    return bestScore>=4&&bestScore>=secondScore+2?best:null;
  }
  function correctRequestService(request){
    if(request.source==='sos'||request.serviceSelectionManual===true)return request.service;
    return inferService(request.details)||request.service;
  }
  return {groups,all,canonical,validateServices,servicesFor,matchesService,inferService,correctRequestService};
});
