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
  return {groups,all,canonical,validateServices,servicesFor,matchesService};
});
