'use strict';
(function(){
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const token=()=>localStorage.zovroToken||'';
async function request(path,opt={}){const headers={'content-type':'application/json',...(opt.headers||{})},t=token();if(t)headers.authorization='Bearer '+t;const r=await fetch('/api/workflows'+path,{...opt,headers});const d=await r.json().catch(()=>({}));if(!r.ok)throw Error(d.error||('Workflow request failed '+r.status));return d;}
const api={
 list:(type)=>request('?type='+encodeURIComponent(type)),
 create:(type,data,extra={})=>request('',{method:'POST',body:JSON.stringify({type,data,...extra})}),
 upsert:(type,key,data,extra={})=>request('/upsert',{method:'POST',body:JSON.stringify({type,key,data,...extra})}),
 update:(id,data,status)=>request('/'+encodeURIComponent(id),{method:'PATCH',body:JSON.stringify({data,status})}),
 remove:id=>request('/'+encodeURIComponent(id),{method:'DELETE'})
};
window.ZOVRO_WORKFLOWS=api;
async function loadPanel(){const host=document.getElementById('zovroWorkflowPanel');if(!host||!token()){if(host)host.innerHTML='<p class="muted">Sign in to sync preferences and saved items.</p>';return}try{const [prefs,favorites,reminders]=await Promise.all([api.list('notification_preferences'),api.list('favorite_provider'),api.list('service_reminder')]);const p=prefs.records?.[0]?.data||{};host.innerHTML=`<div class="field"><label>Notifications</label><label class="row"><input id="zovroJobAlerts" type="checkbox" ${p.jobAlerts!==false?'checked':''}> <span>Job and status alerts</span></label><label class="row"><input id="zovroMarketingAlerts" type="checkbox" ${p.marketing===true?'checked':''}> <span>Offers and product updates</span></label></div><button class="btn primary" id="zovroSavePrefs">Save preferences</button><div style="margin-top:16px"><b>Saved providers</b><div id="zovroSavedProviders">${(favorites.records||[]).map(x=>`<div class="row" style="margin-top:8px"><span class="grow">${esc(x.data?.name||x.data?.providerId||'Provider')}</span><button class="btn ghost" data-remove="${esc(x.id)}">Remove</button></div>`).join('')||'<p class="muted">No saved providers yet.</p>'}</div></div><div style="margin-top:16px"><b>Service reminders</b><p class="muted">${(reminders.records||[]).length} active reminder(s) synced with your account.</p></div>`;
 document.getElementById('zovroSavePrefs').onclick=async()=>{await api.upsert('notification_preferences','default',{jobAlerts:document.getElementById('zovroJobAlerts').checked,marketing:document.getElementById('zovroMarketingAlerts').checked});loadPanel();};
 host.querySelectorAll('[data-remove]').forEach(b=>b.onclick=async()=>{await api.remove(b.dataset.remove);loadPanel();});
}catch(e){host.innerHTML='<p class="muted">'+esc(e.message)+'</p>';}}
function install(){const profile=document.getElementById('profile');if(!profile||document.getElementById('zovroWorkflowPanel'))return;const section=document.createElement('div');section.innerHTML='<div class="sectionHead"><div><h2>Preferences & Saved</h2><p>Synced securely to your ZOVRO account.</p></div></div><div id="zovroWorkflowPanel" class="card"><p class="muted">Loading…</p></div>';profile.insertBefore(section,profile.querySelector('.sectionHead:last-of-type'));loadPanel();}
window.zovroReloadWorkflows=loadPanel;
window.zovroFavoriteProvider=async(providerId,name)=>{if(!token())throw Error('Sign in first');await api.upsert('favorite_provider',String(providerId),{providerId:String(providerId),name:String(name||'Provider')},{providerId:String(providerId)});return loadPanel();};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(install,0));else setTimeout(install,0);
window.addEventListener('storage',e=>{if(e.key==='zovroToken')loadPanel();});
})();
