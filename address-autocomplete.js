'use strict';
// ZOVRO address autocomplete.
// Shows street-address suggestions under every address field while the user types.
// - Uses the public ArcGIS World Geocoding "suggest" endpoint (no key, CORS enabled).
// - Sends only the typed text plus a fixed Metro-Detroit bias point; never device GPS.
// - Selecting a suggestion fills the field and fires a normal "input" event so the
//   existing manual-address logic (no GPS sent) keeps working unchanged.
(function(){
  if(window.ZOVRO_ADDRESS_AUTOCOMPLETE)return;
  const ENDPOINT='https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/suggest';
  const BIAS='-83.1763,42.3223'; // Dearborn, MI (lng,lat) — fixed, not the user's location.
  const FIELD_IDS=['reqAddress','transportDropoff','zHomeManualAddress','zPrivAddress'];
  const MIN_CHARS=3,DELAY=220,MAX=6;
  const cache=new Map();
  let active=null; // {input,box,items,index,controller,timer,lastQuery}

  const isAddressField=el=>el&&el.tagName==='INPUT'&&(FIELD_IDS.includes(el.id)||el.dataset.addressAutocomplete==='on');
  // "3410 Katherine St, Dearborn, MI, 48124, USA" -> "3410 Katherine St, Dearborn, MI 48124"
  const clean=text=>String(text||'').replace(/,\s*USA(\s*\([^)]*\))?$/i,'').replace(/,\s*([A-Z]{2}),\s*(\d{5}(-\d{4})?)$/,', $1 $2').trim();

  function ensureStyles(){
    if(document.getElementById('zAddrAcStyle'))return;
    const s=document.createElement('style');s.id='zAddrAcStyle';
    s.textContent='.z-addr-ac{position:absolute;z-index:2147483000;background:#fff;border:1px solid #c9d2dd;border-radius:14px;box-shadow:0 12px 30px rgba(10,25,48,.18);overflow:hidden;max-height:300px;overflow-y:auto;-webkit-overflow-scrolling:touch}'
      +'.z-addr-ac[hidden]{display:none}'
      +'.z-addr-ac button{display:flex;gap:10px;align-items:flex-start;width:100%;text-align:left;background:none;border:0;border-bottom:1px solid #eef1f5;padding:13px 14px;font:inherit;font-size:15px;line-height:1.3;color:#0d1b2e;cursor:pointer}'
      +'.z-addr-ac button:last-of-type{border-bottom:0}'
      +'.z-addr-ac button[aria-selected="true"],.z-addr-ac button:hover{background:#f1f5fa}'
      +'.z-addr-ac .z-addr-pin{flex:none;width:18px;height:18px;margin-top:1px;color:#b08a3e}'
      +'.z-addr-ac .z-addr-main{display:block;font-weight:600}'
      +'.z-addr-ac .z-addr-sub{display:block;font-size:13px;color:#5b6878;margin-top:2px}'
      +'.z-addr-ac .z-addr-credit{display:block;font-size:11px;color:#8a95a3;padding:6px 14px;text-align:right;background:#fafbfc}';
    document.head.appendChild(s);
  }

  function box(){
    let el=document.getElementById('zAddrAcList');
    if(!el){
      el=document.createElement('div');el.id='zAddrAcList';el.className='z-addr-ac';el.hidden=true;el.setAttribute('role','listbox');
      // Prevent the input from blurring before a tap is handled.
      el.addEventListener('pointerdown',e=>e.preventDefault());
      el.addEventListener('mousedown',e=>e.preventDefault());
      document.body.appendChild(el);
    }
    return el;
  }

  function position(){
    if(!active)return;
    const r=active.input.getBoundingClientRect(),b=active.box;
    const vv=window.visualViewport,viewTop=vv?vv.offsetTop:0,viewBottom=vv?vv.offsetTop+vv.height:window.innerHeight;
    const below=viewBottom-r.bottom-8,above=r.top-viewTop-8,wanted=Math.min(300,b.scrollHeight||300);
    const up=below<Math.min(wanted,200)&&above>below;
    const room=Math.max(140,Math.min(300,(up?above:below)));
    b.style.maxHeight=room+'px';
    b.style.left=(r.left+window.scrollX)+'px';
    b.style.width=r.width+'px';
    const h=Math.min(b.scrollHeight,room);
    b.style.top=(up?r.top+window.scrollY-h-4:r.bottom+window.scrollY+4)+'px';
  }

  function hide(){
    const b=document.getElementById('zAddrAcList');
    if(b){b.hidden=true;b.replaceChildren()}
    if(active){active.input.setAttribute('aria-expanded','false');active.input.removeAttribute('aria-activedescendant');active.items=[];active.index=-1}
  }

  function render(list){
    if(!active)return;
    const b=active.box;b.replaceChildren();active.items=list;active.index=-1;
    if(!list.length){hide();return}
    list.forEach((text,i)=>{
      const btn=document.createElement('button');btn.type='button';btn.id='zAddrAcOpt'+i;btn.setAttribute('role','option');btn.setAttribute('aria-selected','false');
      const comma=text.indexOf(',');
      const main=document.createElement('span');main.className='z-addr-main';main.textContent=comma>0?text.slice(0,comma):text;
      const sub=document.createElement('span');sub.className='z-addr-sub';sub.textContent=comma>0?text.slice(comma+1).trim():'';
      const wrap=document.createElement('span');wrap.append(main,sub);
      btn.innerHTML='<svg class="z-addr-pin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 22S4 13 4 9a8 8 0 1 1 16 0c0 4-8 13-8 13z"/><circle cx="12" cy="9" r="3"/></svg>';
      btn.appendChild(wrap);
      btn.addEventListener('click',()=>choose(i));
      b.appendChild(btn);
    });
    const credit=document.createElement('small');credit.className='z-addr-credit';credit.textContent='Address suggestions by Esri';b.appendChild(credit);
    b.hidden=false;active.input.setAttribute('aria-expanded','true');position();
  }

  function highlight(i){
    if(!active||!active.items.length)return;
    const n=active.items.length;active.index=(i+n)%n;
    [...active.box.querySelectorAll('button')].forEach((btn,k)=>btn.setAttribute('aria-selected',String(k===active.index)));
    active.input.setAttribute('aria-activedescendant','zAddrAcOpt'+active.index);
  }

  function choose(i){
    if(!active||!active.items[i])return;
    const input=active.input,value=active.items[i];
    active.lastQuery=value;
    input.value=value.slice(0,Number(input.maxLength)>0?Number(input.maxLength):200);
    hide();
    // Same path as typing: existing handlers switch to manual mode and never send GPS.
    input.dispatchEvent(new Event('input',{bubbles:true}));
    input.dispatchEvent(new Event('change',{bubbles:true}));
  }

  async function lookup(query){
    const key=query.toLowerCase();
    if(cache.has(key))return cache.get(key);
    if(active.controller)active.controller.abort();
    const controller=typeof AbortController==='function'?new AbortController():null;active.controller=controller;
    const url=ENDPOINT+'?'+new URLSearchParams({f:'json',text:query,countryCode:'USA',location:BIAS,maxSuggestions:String(MAX),category:'Address,Street Address,Postal,Populated Place'});
    const res=await fetch(url,{signal:controller?.signal,credentials:'omit',referrerPolicy:'no-referrer',cache:'no-store'});
    if(!res.ok)throw new Error('Address lookup failed');
    const data=await res.json();
    const seen=new Set(),list=[];
    for(const s of data?.suggestions||[]){if(s?.isCollection)continue;const t=clean(s?.text);if(t&&!seen.has(t)){seen.add(t);list.push(t)}}
    cache.set(key,list);if(cache.size>80)cache.delete(cache.keys().next().value);
    return list;
  }

  function schedule(){
    if(!active)return;
    const input=active.input,query=input.value.trim();
    clearTimeout(active.timer);
    if(query.length<MIN_CHARS||query===active.lastQuery){hide();return}
    active.timer=setTimeout(async()=>{
      try{
        const list=await lookup(query);
        if(active&&active.input===input&&input.value.trim()===query&&document.activeElement===input)render(list);
      }catch(e){if(e?.name!=='AbortError')hide()}
    },DELAY);
  }

  function attach(input){
    ensureStyles();
    if(active&&active.input!==input)hide();
    if(!input.dataset.zAddrAc){
      input.dataset.zAddrAc='1';
      input.setAttribute('role','combobox');input.setAttribute('aria-autocomplete','list');
      input.setAttribute('aria-controls','zAddrAcList');input.setAttribute('aria-expanded','false');
      input.setAttribute('autocorrect','off');input.setAttribute('spellcheck','false');
      input.addEventListener('input',()=>{if(active?.input===input)schedule()});
      input.addEventListener('keydown',e=>{
        if(!active||active.input!==input||active.box.hidden)return;
        if(e.key==='ArrowDown'){e.preventDefault();highlight(active.index+1)}
        else if(e.key==='ArrowUp'){e.preventDefault();highlight(active.index-1)}
        else if(e.key==='Enter'&&active.index>=0){e.preventDefault();choose(active.index)}
        else if(e.key==='Escape'){hide()}
      });
      input.addEventListener('blur',()=>setTimeout(()=>{if(active?.input===input&&document.activeElement!==input)hide()},150));
    }
    active={input,box:box(),items:[],index:-1,controller:null,timer:null,lastQuery:active?.input===input?active.lastQuery:null};
  }

  document.addEventListener('focusin',e=>{if(isAddressField(e.target))attach(e.target)});
  window.addEventListener('resize',position);
  window.visualViewport?.addEventListener('resize',position);
  window.visualViewport?.addEventListener('scroll',position);
  document.addEventListener('scroll',()=>{if(active&&!active.box.hidden)position()},true);

  window.ZOVRO_ADDRESS_AUTOCOMPLETE={fields:FIELD_IDS.slice(),hide,_clean:clean};
})();
