'use strict';
(function(){
  const SERVICES=new Set(['Moving','Furniture Moving','Furniture Delivery','Appliance Delivery','Pickup-Truck Help','Hauling','Junk Removal','Local Courier','Towing','Emergency Towing','Vehicle Transport']);
  const LABOR=new Set(['Moving','Furniture Moving','Furniture Delivery','Appliance Delivery','Pickup-Truck Help','Hauling','Junk Removal']);
  const $=id=>document.getElementById(id);
  let latest=null,busy=false;
  const usd=cents=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(cents/100);
  const encode=text=>String(text??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  function values(){
    const service=$('reqService')?.value||'';
    const pickupLocation=window.ZOVRO_ACTIVE_PICKUP_LOCATION?.()||null;
    const pickupAddress=pickupLocation?'GPS location: '+Number(pickupLocation.lat).toFixed(6)+', '+Number(pickupLocation.lng).toFixed(6):String($('reqAddress')?.value||'').trim().replace(/\s+/g,' ');
    const dropoffAddress=String($('transportDropoff')?.value||'').trim().replace(/\s+/g,' ');
    const labor=LABOR.has(service);
    return {service,transport:{pickupAddress,dropoffAddress,workers:labor?Number($('transportWorkers')?.value):0,hours:labor?Number($('transportHours')?.value):0,includesLoadingUnloading:labor,pickupLocation}};
  }
  function fingerprint(x){return JSON.stringify(x)}
  function invalidate(){
    latest=null;const output=$('transportQuote');if(output)output.textContent='Enter pickup by address or GPS and a destination, then calculate road miles and the all-inclusive estimate.';
  }
  function sync(){
    const service=$('reqService')?.value||'',active=SERVICES.has(service);
    const wrap=$('transportFields'),destination=$('transportDropoff');
    if(wrap){wrap.hidden=!active;wrap.classList.toggle('hidden',!active)}
    const labor=$('transportLabor');if(labor)labor.hidden=!LABOR.has(service);
    if(destination){
      destination.required=active;
      destination.setAttribute('aria-required',active?'true':'false');
      destination.placeholder=active?'Drop-off street address, city, state':'Destination (optional), street and city';
    }
    const startLabel=$('routeFromLabelText'),endLabel=$('routeToLabelText');
    if(startLabel)startLabel.textContent=active?'From — pickup / starting address':'From — starting / service address';
    if(endLabel)endLabel.textContent=active?'To — drop-off / destination (required)':'To — destination (optional)';
    const heading=$('routeStepHeading'),subheading=$('routeStepSubheading'),hint=$('routeDestinationHint');
    if(heading)heading.textContent=active?'From pickup to destination':'Where are you going?';
    if(subheading)subheading.textContent=active?'Enter both addresses (A → B). Road miles and a single all-inclusive estimate can be calculated below.':'Enter a starting address (A). Add a destination (B) when this service involves transportation.';
    if(hint)hint.textContent=active?'Required: complete destination street and city. Pickup must be a different place.':'Optional for other services. Choose Moving, Vehicle Transport, or Towing to request mileage-based transport.';
    const currentGps=window.ZOVRO_ACTIVE_PICKUP_LOCATION?.();
    const addressInput=$('reqAddress'),fromHint=$('routeFromHint');
    if(addressInput)addressInput.placeholder=currentGps?'GPS pickup selected — type an address to switch':'Type a street address, city, state';
    if(fromHint)fromHint.textContent=currentGps?'Your current GPS pin is the starting point. Type another address to switch to manual pickup.':'You can type any address here, including for someone at a different location.';
    const note=$('transportPricingNote');
    if(note)note.textContent=LABOR.has(service)?'One combined price includes the vehicle, road miles, and loading/unloading workers. One payment after approval.':'One combined price for the transport and its driving miles. One payment after approval.';
    if(latest&&latest.fingerprint!==fingerprint(values()))invalidate();
  }
  function reset(){
    if($('transportDropoff'))$('transportDropoff').value='';
    if($('transportWorkers'))$('transportWorkers').value='2';
    if($('transportHours'))$('transportHours').value='2';
    invalidate();sync();
  }
  function collect(service){
    if(!SERVICES.has(service))return null;
    const x=values();
    if((!x.transport.pickupLocation&&x.transport.pickupAddress.length<8)||x.transport.dropoffAddress.length<8)return {error:'Type a pickup address or use your current GPS, and enter a complete destination street and city.'};
    if(!x.transport.pickupLocation&&x.transport.pickupAddress.toLowerCase()===x.transport.dropoffAddress.toLowerCase())return {error:'Pickup and drop-off must be different places.'};
    if(LABOR.has(service)&&(!Number.isInteger(x.transport.workers)||x.transport.workers<1||x.transport.workers>8||x.transport.hours<1||x.transport.hours>16||!Number.isFinite(x.transport.hours)))return {error:'Choose 1–8 moving workers and 1–16 working hours.'};
    const valid=latest&&latest.fingerprint===fingerprint(x)&&latest.expiresAt>Date.now();
    return {value:x.transport,quoteToken:valid?latest.token:null};
  }
  async function calculate(){
    if(busy||window.requestAttempt||window.requestSending)return;
    const {service}=values();const result=collect(service);
    if(result?.error){$('transportQuote').textContent=result.error;return}
    if(!result)return;
    const fingerprintAtRequest=fingerprint(values()),button=$('transportCalculate');
    busy=true;button.disabled=true;button.textContent='Calculating…';$('transportQuote').textContent='Calculating the drivable route…';
    try{
      const data=await window.api('/transport/estimate',{method:'POST',body:JSON.stringify({service,...result.value})});
      if(fingerprintAtRequest!==fingerprint(values())){invalidate();return}
      const q=data?.estimate;
      if(!q||!Number.isFinite(q.distanceMiles)||!Number.isInteger(q.estimatedTotalCents)||!data.estimateToken)throw Error('A verified quote was not returned.');
      latest={fingerprint:fingerprintAtRequest,token:data.estimateToken,expiresAt:Number(data.expiresAt||Date.now()+10*60*1000)};
      $('transportQuote').innerHTML='<strong>Estimated all-in total: '+usd(q.estimatedTotalCents)+'</strong><div>'+q.distanceMiles.toFixed(1)+' driving miles'+(q.includesLabor?' · '+q.workers+' workers · '+q.hours+' labor hours (loading and unloading included)':'')+'</div><small>Planning estimate only. The provider confirms one final inclusive quote for your approval before any payment. No separate labor checkout.</small>';
    }catch(error){
      latest=null;
      $('transportQuote').textContent=(error?.message||'Distance estimate unavailable')+' You can still send the route to a provider for a single all-in quote.';
    }finally{busy=false;button.disabled=false;button.textContent='Calculate miles & total'}
  }
  function jobSummary(job){
    const t=job?.transport;if(!t?.pickupAddress||!t?.dropoffAddress)return '';
    const estimate=job?.transportEstimate;
    return '<div class="muted" style="margin-top:9px"><b>Transport route:</b> '+encode(t.pickupAddress)+' → '+encode(t.dropoffAddress)+
      (Number.isFinite(estimate?.distanceMiles)?'<div>'+estimate.distanceMiles.toFixed(1)+' driving miles</div>':'')+
      (t.includesLoadingUnloading?'<div>Loading/unloading included: '+encode(t.workers)+' workers · '+encode(t.hours)+' hours</div>':'')+
      (Number.isInteger(estimate?.estimatedTotalCents)?'<div>Planning estimate (all-in): '+usd(estimate.estimatedTotalCents)+'</div>':'<div>Provider will confirm one all-inclusive price.</div>')+
      (t.pickupLocation&&Number.isFinite(t.pickupLocation.lat)&&Number.isFinite(t.pickupLocation.lng)?'<div><a href="https://www.google.com/maps?q='+encodeURIComponent(t.pickupLocation.lat+','+t.pickupLocation.lng)+'" target="_blank" rel="noopener noreferrer">Open GPS pickup in Maps</a></div>':'')+
      '<small>Only the approved provider quote is payable, in a single payment.</small></div>';
  }
  function restore(job){
    const t=job?.transport;
    if(!t||!$('transportDropoff'))return;
    if($('reqAddress'))$('reqAddress').value=t.pickupAddress||job.address||'';
    $('transportDropoff').value=t.dropoffAddress||'';
    if(t.includesLoadingUnloading){
      if($('transportWorkers'))$('transportWorkers').value=String(t.workers||2);
      if($('transportHours'))$('transportHours').value=String(t.hours||2);
    }
    invalidate();sync();
  }
  function init(){
    const route=$('routeAddresses'),address=$('reqAddress'),destination=$('transportDropoff'),service=$('reqService');
    if(!route||!address||!destination||!service||$('transportFields'))return;
    const wrap=document.createElement('div');wrap.id='transportFields';wrap.hidden=true;
    wrap.className='card hidden';wrap.style.cssText='margin:10px 0 14px;padding:14px;border-radius:16px';
    wrap.innerHTML='<div style="font-weight:700;margin-bottom:8px">Distance & one all-inclusive price</div>'+
      '<div id="transportLabor"><div class="field"><label for="transportWorkers">Workers for loading and unloading</label><select id="transportWorkers">'+[1,2,3,4,5,6,7,8].map(n=>'<option value="'+n+'"'+(n===2?' selected':'')+'>'+n+' worker'+(n===1?'':'s')+'</option>').join('')+'</select></div>'+
      '<div class="field"><label for="transportHours">Estimated working hours (per worker)</label><select id="transportHours">'+Array.from({length:31},(_,i)=>i*.5+1).map(n=>'<option value="'+n+'"'+(n===2?' selected':'')+'>'+n+' hours</option>').join('')+'</select></div></div>'+
      '<p id="transportPricingNote" class="muted" style="margin:8px 0"></p>'+
      '<button type="button" class="btn ghost" id="transportCalculate">Calculate miles & total</button>'+
      '<div id="transportQuote" role="status" aria-live="polite" style="margin-top:9px;line-height:1.6"></div>';
    route.insertAdjacentElement('afterend',wrap);
    for(const id of ['reqAddress','transportDropoff','transportWorkers','transportHours'])$(id)?.addEventListener('input',invalidate);
    service.addEventListener('change',()=>{invalidate();sync()});
    $('transportCalculate').addEventListener('click',calculate);
    invalidate();sync();
  }
  window.ZOVRO_TRANSPORT={sync,reset,collect,jobSummary,calculate,restore};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
