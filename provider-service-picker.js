'use strict';
(function(){
  const model=window.ZOVRO_PROVIDER_SERVICES;
  const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  // Explicit bundles preserve the original service names submitted to the API.
  const bundles=[
    {label:'Tire Services',members:['Tire Change','Mobile Tire Service','Flat Tire Repair']},
    {label:'Doors & Windows',members:['Door & Window Repair','Windows & Doors']},
    {label:'Lawn & Snow Services',members:['Lawn Mowing','Snow Removal','Snow Plowing','Lawn & Snow']},
    {label:'Plumbing (including emergency)',members:['Plumbing','Emergency Plumber']},
    {label:'Electrical (including emergency)',members:['Electrical','Emergency Electrician']},
    {label:'HVAC (including emergency)',members:['HVAC','Emergency HVAC']},
    {label:'Locksmith (including emergency)',members:['Locksmith','Emergency Locksmith']},
    {label:'Roadside Assistance (including emergency)',members:['Roadside Assistance','Emergency Roadside Assistance']},
    {label:'Mobile Mechanic & Battery (including emergency mechanic)',members:['Mobile Mechanic','Emergency Mobile Mechanic','Jump Start','Battery Replacement']},
    {label:'Towing (including emergency)',members:['Towing','Emergency Towing']},
    {label:'Home Cleaning',members:['House Cleaning','Deep Cleaning','Move-In Cleaning','Move-Out Cleaning']},
    {label:'Moving & Loading',members:['Moving','Furniture Moving','Loading & Unloading']}
  ];
  function markup(id,selected){
    const chosen=new Set(selected),seen=new Set();
    const groups=model.groups.map(group=>{
      const items=group.services.filter(s=>!seen.has(s.label)&&seen.add(s.label)).map(s=>{
        const bundle=bundles.find(b=>b.members.includes(s.label));
        if(bundle){
          if(seen.has('bundle:'+bundle.label))return '';
          seen.add('bundle:'+bundle.label);
          const original=bundle.members.filter(x=>chosen.has(x));
          return `<label class="provider-service-choice"><input type="checkbox" value="${esc(bundle.label)}" data-members="${esc(JSON.stringify(bundle.members))}" data-original="${esc(JSON.stringify(original))}" ${original.length===bundle.members.length?'checked':''}><span>${esc(bundle.label)} <small>(${esc(bundle.members.join(', '))})</small>${original.length&&original.length<bundle.members.length?` — currently saved: ${esc(original.join(', '))}. Select to add all; clear to remove all.`:''}</span></label>`;
        }
        return `<label class="provider-service-choice"><input type="checkbox" value="${esc(s.label)}" ${chosen.has(s.label)?'checked':''}><span>${esc(s.label)}</span></label>`;
      }).join('');
      if(!items)return '';
      return `<details class="provider-service-group" ${group.services.some(s=>chosen.has(s.label))?'open':''}><summary>${esc(group.label)}</summary>${items}</details>`;
    }).join('');
    return `<fieldset id="${id}" class="provider-service-picker"><legend>Your professions & services</legend><p class="muted">Choose the work you offer. A grouped choice includes every service listed beside it; emergency work is included only where shown. You can change your choices later.</p><label class="provider-service-search">Find a service<input type="search" placeholder="Try tire, battery, painting or flooring" oninput="ZOVRO_SERVICE_PICKER.search(this)"></label><p class="provider-service-count" aria-live="polite">Review your selections</p><div class="provider-service-options" onchange="ZOVRO_SERVICE_PICKER.update(this.closest('fieldset'),event)">${groups}</div><small class="muted">Choose only work you can perform, with the equipment, availability, licenses and permits required for it. Selecting a service does not add a verified license or insurance badge.</small></fieldset>`;
  }
  function read(id){
    const fieldset=document.getElementById(id);
    const values=[];
    if(fieldset)for(const input of fieldset.querySelectorAll('input[type="checkbox"]')){
      if(input.dataset.members){
        if(input.checked)values.push(...JSON.parse(input.dataset.members));
        else if(input.dataset.original)values.push(...JSON.parse(input.dataset.original));
      }else if(input.checked)values.push(input.value);
    }
    return model.validateServices(values);
  }
  function update(fieldset,event){
    const input=event?.target;
    if(input?.dataset?.members)input.dataset.original='[]';
    const count=fieldset.querySelectorAll('input[type="checkbox"]:checked').length;
    fieldset.querySelector('.provider-service-count').textContent=`${count} choices selected`;
  }
  function search(input){
    const query=input.value.trim().toLowerCase();
    const smart=new Set((window.ZOVRO_CATALOG?.smartMatch?.(query,{limit:12})||[]).map(x=>x?.service?.label?.en).filter(Boolean));
    for(const group of input.closest('fieldset').querySelectorAll('details')){
      let matches=0;
      for(const row of group.querySelectorAll('.provider-service-choice')){
        const label=row.textContent.trim();
        const members=row.querySelector('input')?.dataset.members;
        const direct=label.toLowerCase().includes(query);
        const intelligent=!!query&&(smart.has(label)||(members&&JSON.parse(members).some(x=>smart.has(x))));
        row.hidden=!!query&&!direct&&!intelligent;
        if(!row.hidden)matches++;
      }
      group.hidden=matches===0;
      if(query)group.open=matches>0;
    }
  }
  function options(){
    const seen=new Set();
    return model.groups.map(g=>`<optgroup label="${esc(g.label)}">${g.services.filter(s=>!seen.has(s.label)&&seen.add(s.label)).map(s=>`<option value="${esc(s.label)}">${esc(s.label)}</option>`).join('')}</optgroup>`).join('');
  }
  window.ZOVRO_SERVICE_PICKER={markup,read,update,search,options};
})();
