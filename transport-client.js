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
    const pickupAddress=String($('reqAddress')?.value||'').trim().replace(/\s+/g,' ');
    const dropoffAddress=String($('transportDropoff')?.value||'').trim().replace(/\s+/g,' ');
    const labor=LABOR.has(service);
    return {service,transport:{pickupAddress,dropoffAddress,workers:labor?Number($('transportWorkers')?.value):0,hours:labor?Number($('transportHours')?.value):0,includesLoadingUnloading:labor}};
  }
  function fingerprint(x){return JSON.stringify(x)}
  function invalidate(){
    latest=null;const output=$('transportQuote');if(output)output.textContent='Enter both addresses, then calculate driving miles and the estimated all-inclusive price.';
  }
  function sync(){
    const service=$('reqService')?.value||'',active=SERVICES.has(service);
    const wrap=$('transportFields');if(!wrap)return;
    wrap.hidden=!active;wrap.classList.toggle('hidden',!active);
    const labor=$('transportLabor');if(labor)labor.hidden=!LABOR.has(service);
    const label=document.querySelector('label[for="reqAddress"]');
    if(label)label.textContent=active?'Pickup / starting address':'Your address';
    const note=$('transportPricingNote');
    if(note)note.textContent=LABOR.has(service)?'One combined price includes the vehicle, driving miles, and the selected loading/unloading workers. One payment after you approve the provider quote.':'One combined estimated transport price, based on driving miles. One payment after you approve the provider quote.';
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
    if(x.transport.pickupAddress.length<8||x.transport.dropoffAddress.length<8)return {error:'Enter a complete pickup and a different drop-off address, including city.'};
    if(x.transport.pickupAddress.toLowerCase()===x.transport.dropoffAddress.toLowerCase())return {error:'Pickup and drop-off must be different places.'};
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
      '<small>Only the approved provider quote is payable, in a single payment.</small></div>';
  }
  function init(){
    const where=$('zReqStep2'),address=$('reqAddress'),service=$('reqService');
    if(!where||!address||!service||$('transportFields'))return;
    const wrap=document.createElement('div');wrap.id='transportFields';wrap.hidden=true;
    wrap.className='card';wrap.style.cssText='margin:12px 0;padding:14px;border-radius:16px';
    wrap.innerHTML='<div style="font-weight:700;margin-bottom:8px">Transport route & all-in price</div>'+
      '<div class="field"><label for="transportDropoff">Drop-off / destination address</label><input id="transportDropoff" autocomplete="street-address" maxlength="200" placeholder="Destination street, city, state"><small class="muted">Pickup is the starting address above.</small></div>'+
      '<div id="transportLabor"><div class="field"><label for="transportWorkers">Workers for loading and unloading</label><select id="transportWorkers">'+[1,2,3,4,5,6,7,8].map(n=>'<option value="'+n+'"'+(n===2?' selected':'')+'>'+n+' worker'+(n===1?'':'s')+'</option>').join('')+'</select></div>'+
      '<div class="field"><label for="transportHours">Estimated working hours (per worker)</label><select id="transportHours">'+Array.from({length:31},(_,i)=>i*.5+1).map(n=>'<option value="'+n+'"'+(n===2?' selected':'')+'>'+n+' hours</option>').join('')+'</select></div></div>'+
      '<p id="transportPricingNote" class="muted" style="margin:8px 0"></p>'+
      '<button type="button" class="btn ghost" id="transportCalculate">Calculate miles & total</button>'+
      '<div id="transportQuote" role="status" aria-live="polite" style="margin-top:9px;line-height:1.6"></div>';
    address.closest('.field')?.insertAdjacentElement('afterend',wrap);
    for(const id of ['reqAddress','transportDropoff','transportWorkers','transportHours'])$(id)?.addEventListener('input',invalidate);
    service.addEventListener('change',()=>{invalidate();sync()});
    $('transportCalculate').addEventListener('click',calculate);
    invalidate();sync();
  }
  window.ZOVRO_TRANSPORT={sync,reset,collect,jobSummary,calculate};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
