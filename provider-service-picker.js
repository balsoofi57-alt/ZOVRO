'use strict';
(function(){
  const model=window.ZOVRO_PROVIDER_SERVICES;
  const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function markup(id,selected){
    const chosen=new Set(selected),seen=new Set();
    const groups=model.groups.map(group=>{
      const items=group.services.filter(s=>!seen.has(s.label)&&seen.add(s.label));
      if(!items.length)return '';
      return `<details class="provider-service-group" ${items.some(s=>chosen.has(s.label))?'open':''}><summary>${esc(group.label)}</summary>${items.map(s=>`<label class="provider-service-choice"><input type="checkbox" value="${esc(s.label)}" ${chosen.has(s.label)?'checked':''}><span>${esc(s.label)}</span></label>`).join('')}</details>`;
    }).join('');
    return `<fieldset id="${id}" class="provider-service-picker"><legend>Your professions & services</legend><p class="muted">Choose every service you offer, across any category. You can change these later.</p><label class="provider-service-search">Find a service<input type="search" placeholder="Try tire, battery, painting or flooring" oninput="ZOVRO_SERVICE_PICKER.search(this)"></label><p class="provider-service-count" aria-live="polite">${chosen.size} selected</p><div class="provider-service-options" onchange="ZOVRO_SERVICE_PICKER.update(this.closest('fieldset'))">${groups}</div><small class="muted">Selecting a service does not add a verified license or insurance badge.</small></fieldset>`;
  }
  function read(id){
    const fieldset=document.getElementById(id);
    const values=fieldset?[...fieldset.querySelectorAll('input[type="checkbox"]:checked')].map(x=>x.value):[];
    return model.validateServices(values);
  }
  function update(fieldset){
    const count=fieldset.querySelectorAll('input[type="checkbox"]:checked').length;
    fieldset.querySelector('.provider-service-count').textContent=`${count} selected`;
  }
  function search(input){
    const query=input.value.trim().toLowerCase();
    for(const group of input.closest('fieldset').querySelectorAll('details')){
      let matches=0;
      for(const row of group.querySelectorAll('.provider-service-choice')){
        row.hidden=!!query&&!row.textContent.toLowerCase().includes(query);
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
