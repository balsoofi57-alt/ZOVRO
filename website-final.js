'use strict';
(function(){
  function ready(fn){document.readyState==='loading'?document.addEventListener('DOMContentLoaded',fn):fn()}
  function call(name,...args){if(typeof window[name]==='function')return window[name](...args)}
  function openHelp(prefill){
    call('startRequestWithLocation',{details:prefill||''});
  }
  function goNearby(){
    const b=[...document.querySelectorAll('.bottom button')].find(x=>/nearby/i.test(x.textContent));
    if(b){b.click();return}
    document.getElementById('nearby')?.scrollIntoView({behavior:'smooth'});
  }
  function fullServiceDirectory(){
    const directory=document.createElement('section');
    directory.id='zFullServiceCatalog';directory.className='z-full-service-catalog hidden';
    const label=document.createElement('label');label.htmlFor='zServiceSearch';label.textContent='Search all services';
    const search=document.createElement('input');search.id='zServiceSearch';search.type='search';search.placeholder='Try tree, tire, plumbing or painting';
    const status=document.createElement('p');status.className='muted';status.setAttribute('aria-live','polite');
    directory.append(label,search,status);
    const seen=new Set(),groups=[];
    for(const group of window.ZOVRO_PROVIDER_SERVICES?.groups||[]){
      const section=document.createElement('section'),heading=document.createElement('h3'),list=document.createElement('div');
      heading.textContent=group.label;list.className='z-full-service-list';const rows=[];
      for(const service of group.services){
        if(seen.has(service.label))continue;seen.add(service.label);
        const button=document.createElement('button');button.type='button';button.className='btn ghost';button.textContent=service.label;
        button.addEventListener('click',()=>call('startService',service.label));list.appendChild(button);rows.push(button);
      }
      if(rows.length){section.append(heading,list);directory.appendChild(section);groups.push({section,rows})}
    }
    function filter(){let count=0;const q=search.value.trim().toLowerCase();for(const group of groups){let visible=0;for(const button of group.rows){button.hidden=!!q&&!button.textContent.toLowerCase().includes(q);if(!button.hidden)visible++}group.section.hidden=!visible;count+=visible}status.textContent=count?count+' services available':'No matching services. Try a different word.'}
    search.addEventListener('input',filter);filter();return directory;
  }
  function enhanceRegistrationNames(){
    const legacy=document.getElementById('name');
    if(!legacy||document.getElementById('firstName'))return;
    const field=legacy.closest('.field');
    if(!field)return;
    const wrap=document.createElement('div');
    wrap.className='z-name-grid';
    wrap.innerHTML='<div class="field"><label for="firstName">First name</label><input id="firstName" name="given-name" autocomplete="given-name" placeholder="First name" required></div><div class="field"><label for="lastName">Last name</label><input id="lastName" name="family-name" autocomplete="family-name" placeholder="Last name" required></div>';
    legacy.type='hidden';legacy.setAttribute('aria-hidden','true');
    field.querySelector('label')?.remove();
    field.insertAdjacentElement('beforebegin',wrap);
    field.style.display='none';
  }
  function enhanceRegistrationConsent(){
    if(!document.getElementById('name')||document.getElementById('zLegalConsent'))return;
    const registerFields=document.getElementById('registerFields');
    if(!registerFields)return;
    const wrap=document.createElement('div');
    wrap.id='zLegalConsentWrap';
    wrap.className='field';
    wrap.innerHTML='<label style="display:flex;gap:10px;align-items:flex-start;font-weight:700;line-height:1.45"><input id="zLegalConsent" type="checkbox" required style="width:20px;height:20px;flex:0 0 20px;margin-top:2px"><span>I agree to the <a href="terms.html" target="_blank" rel="noopener">Terms of Service</a>, will use ZOVRO only for lawful purposes, accept responsibility for my own conduct and services, and acknowledge the <a href="privacy.html" target="_blank" rel="noopener">Privacy Policy</a>.</span></label><fieldset id="zLawfulUseAttestation" style="margin:16px 0 0;border:1px solid #69717f;border-radius:12px;padding:14px"><legend style="font-weight:800;padding:0 6px">Lawful use & responsibility</legend><p style="margin:4px 0 12px;font-size:13px;line-height:1.55">Do you agree to use ZOVRO only for lawful purposes, comply with all laws and any licensing, permit, registration, or insurance requirements that apply to you, and accept responsibility for your own conduct, requests, services, statements, and transactions?</p><label style="display:flex;gap:8px;align-items:center;margin:8px 0"><input type="radio" name="zLawfulUse" value="yes"> <span>Yes, I agree</span></label><label style="display:flex;gap:8px;align-items:center;margin:8px 0"><input type="radio" name="zLawfulUse" value="no"> <span>No</span></label></fieldset><div id="zLegalConsentError" role="alert" aria-live="polite" style="display:none;margin-top:7px;color:#ffb4b4;font-size:12px">Please accept the Terms, Privacy Policy, and lawful-use responsibility statement to create your account.</div>';
    registerFields.appendChild(wrap);
  }
  function installRegistrationConsentTransport(){
    if(window.__zovroConsentTransportInstalled)return;
    window.__zovroConsentTransportInstalled=true;
    const nativeFetch=window.fetch.bind(window);
    window.fetch=async function(input,init={}){
      const url=typeof input==='string'?input:(input&&input.url)||'';
      if(/\/api\/auth\/register(?:\?|$)/.test(url)){
        const consent=document.getElementById('zLegalConsent');
        if(consent?.checked){
          const headers=new Headers(init.headers||(input&&input.headers)||{});
          headers.set('X-ZOVRO-Terms-Version','2026-09-27');
          headers.set('X-ZOVRO-Privacy-Version','2026-09-22');
          const lawful=document.querySelector('input[name="zLawfulUse"]:checked');
          if(lawful?.value==='yes')headers.set('X-ZOVRO-Lawful-Use-Attestation','accepted-v1');
          init={...init,headers};
        }
      }
      return nativeFetch(input,init);
    };
  }
  ready(()=>{
    try {
    installRegistrationConsentTransport();
    document.title='ZOVRO — Anywhere, Any Time, Near You.';
    const brand=document.querySelector('.brand');
    if(brand&&!brand.querySelector('.z-official-brand'))brand.innerHTML='<img class="z-official-brand" src="assets/brand/zovro-logo-transparent.webp" alt="ZOVRO — Anywhere, Any Time, Near You.">';

    const top=document.querySelector('.top');
    if(top){
      top.querySelector('.z-web-nav')?.remove();
      const nav=document.createElement('nav');
      nav.className='z-web-nav';
      nav.innerHTML='<a href="#smartMatch">Get Help</a><a href="#services">Services</a><a href="#howItWorks">How It Works</a><a href="#providerJoin">For Providers</a><a href="support.html">Support</a>';
      // Mobile wraps the status in its language chooser; insert before that
      // direct child rather than throwing on a nested status node.
      const status=document.getElementById('state');
      const anchor=[...top.children].find(child=>child.contains(status));
      top.insertBefore(nav,anchor||null);
    }

    const hero=document.querySelector('.hero');
    if(hero){
      if(!hero.querySelector('.z-brand-showcase')){const art=document.createElement('img');art.className='z-brand-showcase';art.src='assets/brand/zovro-logo-transparent.webp';art.alt='ZOVRO official brand';hero.prepend(art)}
      const eyebrow=hero.querySelector('.eyebrow');if(eyebrow)eyebrow.textContent='Anywhere, Any Time, Near You.';
      const h1=hero.querySelector('h1');if(h1)h1.innerHTML='Everyday problems.<br><span>Nearby solutions.</span>';
      const p=h1?.nextElementSibling;if(p&&p.tagName==='P')p.textContent='From roadside help to home repairs. Find a local professional and keep every update in one place.';
      // The Smart Match form below is the single Home "Help Now" action.
      // Provider enrollment stays in More > Work with ZOVRO.
      hero.querySelector('.bar')?.remove();
    }

    if(hero&&!document.getElementById('smartMatch')){
      const sm=document.createElement('section');sm.id='smartMatch';sm.className='z-smart-match';
      sm.innerHTML='<div class="z-section-kicker">Smart Match</div><h2>What do you need help with?</h2><p>Describe the problem in your own words. ZOVRO will start the right request flow for you.</p><div class="z-smart-box"><textarea id="zProblem" rows="2" placeholder="Example: My car will not start, or water is leaking under my sink"></textarea><div class="z-smart-actions"><button class="btn primary" id="zSmartGo">Help Now</button><button class="btn ghost" id="zVoice">🎙 Voice</button></div></div><div id="zSmartStatus" class="z-smart-status" role="status" aria-live="polite"></div>';
      hero.insertAdjacentElement('afterend',sm);
      document.getElementById('zSmartGo').addEventListener('click',()=>openHelp(document.getElementById('zProblem')?.value.trim()||''));
      document.getElementById('zVoice').addEventListener('click',()=>{
        const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
        if(!SR){document.getElementById('zSmartStatus').textContent='Voice input is not available in this browser. You can type your request instead.';return}
        const r=new SR();r.lang='en-US';r.interimResults=false;r.maxAlternatives=1;
        document.getElementById('zSmartStatus').textContent='Listening…';
        r.onresult=e=>{document.getElementById('zProblem').value=e.results[0][0].transcript;document.getElementById('zSmartStatus').textContent='Voice captured. Tap Help Now.'};
        r.onerror=()=>document.getElementById('zSmartStatus').textContent='Voice input could not start. You can type your request instead.';
        r.start();
      });
    }

    const serviceHead=document.querySelector('#services')?.previousElementSibling;
    if(serviceHead?.classList.contains('sectionHead')){
      const h=serviceHead.querySelector('h2'),p=serviceHead.querySelector('p');if(h)h.textContent='Popular Services';if(p)p.textContent='Start with the most common needs, or view every service.';
      if(!serviceHead.querySelector('.z-section-kicker')){const k=document.createElement('div');k.className='z-section-kicker';k.textContent='Nearby services';serviceHead.querySelector('div')?.prepend(k)}
    }
    const services=document.getElementById('services');
    if(services&&!document.getElementById('zViewAll')){
      setTimeout(()=>{
        const cards=[...services.children];cards.slice(8).forEach(c=>c.classList.add('z-service-extra'));
        if(cards.length>8){const wrap=document.createElement('div');wrap.className='z-view-all-wrap';wrap.innerHTML='<button class="btn ghost" id="zViewAll">View All Services</button>';services.insertAdjacentElement('afterend',wrap);const directory=fullServiceDirectory();wrap.insertAdjacentElement('afterend',directory);document.getElementById('zViewAll').setAttribute('aria-controls',directory.id);document.getElementById('zViewAll').setAttribute('aria-expanded','false');document.getElementById('zViewAll').onclick=e=>{const expanded=directory.classList.contains('hidden');directory.classList.toggle('hidden',!expanded);e.currentTarget.setAttribute('aria-expanded',String(expanded));e.currentTarget.textContent=expanded?'Show Popular Services':'View All Services';if(expanded)directory.querySelector('input').focus()}}
      },350);
    }

    const trust=document.querySelector('.trust');
    if(trust&&!document.getElementById('howItWorks')){
      const how=document.createElement('section');how.id='howItWorks';how.className='z-how';how.innerHTML='<div class="z-section-kicker">How it works</div><h2>Three simple steps</h2><div class="z-steps"><div><b>1</b><strong>Tell us what you need</strong><span>Type or use voice. ZOVRO helps identify the right service.</span></div><div><b>2</b><strong>Get matched nearby</strong><span>See suitable local providers based on availability and location.</span></div><div><b>3</b><strong>Get it done</strong><span>Connect, track the job and keep everything in one place.</span></div></div>';
      trust.insertAdjacentElement('afterend',how);
    }

    const features=document.querySelector('.featureRow');
    if(features&&!document.getElementById('zAvailableNow')){
      const n=document.createElement('section');n.id='zAvailableNow';n.className='z-nearby-cta';n.innerHTML='<div><div class="z-section-kicker">Available near you</div><h2>Need someone now?</h2><p>Check nearby active providers. Exact provider location stays private until a job is accepted.</p></div><button class="btn primary" id="zNearbyGo">Check Available Now</button>';
      features.insertAdjacentElement('beforebegin',n);document.getElementById('zNearbyGo').onclick=goNearby;
    }

    if(features&&!document.getElementById('providerJoin')){
      const p=document.createElement('section');p.id='providerJoin';p.className='z-provider-join';p.innerHTML='<div><div class="z-section-kicker">For providers</div><h2>Turn your skills into nearby jobs.</h2><p>Create your provider profile, set your availability and receive service requests near you.</p></div><button class="btn primary" id="zProviderJoinBtn">Join ZOVRO</button>';
      features.insertAdjacentElement('afterend',p);document.getElementById('zProviderJoinBtn').onclick=()=>call('openAuth');
    }

    const howSection=document.getElementById('howItWorks');
    const nearbySection=document.getElementById('zAvailableNow');
    if(howSection&&nearbySection)nearbySection.insertAdjacentElement('beforebegin',howSection);

    const account=document.getElementById('accountBox');
    // Support lives in More; do not add a second support strip or floating Help button.

    const shell=document.querySelector('.shell');
    if(shell&&!document.querySelector('.z-site-footer')){const f=document.createElement('footer');f.className='z-site-footer';f.innerHTML='<div>© 2026 ZOVRO LLC · Anywhere, Any Time, Near You.</div><div><a href="privacy.html">Privacy</a><a href="terms.html">Terms</a><a href="support.html">Support</a></div>';shell.appendChild(f)}

    const originalRenderAuth=window.renderAuth;
    if(typeof originalRenderAuth==='function'&&!originalRenderAuth.__zovroNames){
      const wrappedRenderAuth=function(){const out=originalRenderAuth.apply(this,arguments);setTimeout(()=>{enhanceRegistrationNames();enhanceRegistrationConsent()},0);return out};
      wrappedRenderAuth.__zovroNames=true;window.renderAuth=wrappedRenderAuth;
    }
    const originalSubmitAuth=window.submitAuth;
    if(typeof originalSubmitAuth==='function'&&!originalSubmitAuth.__zovroNames){
      const wrappedSubmitAuth=async function(){
        const first=document.getElementById('firstName'),last=document.getElementById('lastName'),legacy=document.getElementById('name');
        if(first||last){
          const firstValue=(first?.value||'').trim(),lastValue=(last?.value||'').trim();
          if(!firstValue){first?.focus();call('toast','Please enter your first name');return}
          if(!lastValue){last?.focus();call('toast','Please enter your last name');return}
          if(legacy)legacy.value=(firstValue+' '+lastValue).replace(/\s+/g,' ').trim();
          const consent=document.getElementById('zLegalConsent');
          const error=document.getElementById('zLegalConsentError');
          const lawful=document.querySelector('input[name="zLawfulUse"]:checked');
          if(!consent?.checked){if(error)error.style.display='block';consent?.focus();call('toast','Please accept the Terms and Privacy Policy');return}
          if(!lawful){if(error)error.style.display='block';document.getElementById('zLawfulUseAttestation')?.scrollIntoView({behavior:'smooth',block:'center'});call('toast','Please answer the lawful-use responsibility question');return}
          if(lawful.value!=='yes'){if(error)error.style.display='block';call('toast','You must agree to lawful use and personal responsibility to create a ZOVRO account');return}
          if(error)error.style.display='none';
        }
        return originalSubmitAuth.apply(this,arguments);
      };
      wrappedSubmitAuth.__zovroNames=true;window.submitAuth=wrappedSubmitAuth;
    }
    } catch (error) {
      console.error('ZOVRO enhancement failed', error);
      document.documentElement.classList.add('z-enhancement-fallback');
    }
  })
})();

// Keep secondary actions reachable in one menu without changing their handlers.
(function(){
  function simplify(){
    const profile=document.getElementById('profile'),bottom=document.querySelector('.bottom');
    if(!profile||!bottom||document.getElementById('zMoreMenu'))return;
    const tabs=[...bottom.querySelectorAll('button')];
    if(tabs.length!==4)return;
    tabs[1].textContent='Requests';
    tabs[2].classList.add('z-secondary-tab');
    tabs[3].textContent='More';
    bottom.classList.add('z-simple-nav');
    const title=profile.querySelector('.sectionHead h2'),subtitle=profile.querySelector('.sectionHead p');
    if(title)title.textContent='More';
    if(subtitle)subtitle.textContent='Account, nearby providers and support in one place.';
    const menu=document.createElement('div');menu.id='zMoreMenu';
    profile.insertBefore(menu,profile.querySelector('#profileBox'));
    function group(label,id){const d=document.createElement('details');d.className='z-menu-group';d.id=id;const s=document.createElement('summary');s.textContent=label;d.appendChild(s);menu.appendChild(d);return d}
    const account=group('Account & security','zAccountMenu');
    for(const id of ['profileBox','accountActions']){const node=document.getElementById(id);if(node)account.appendChild(node)}
    const homeAccount=document.getElementById('accountBox');if(homeAccount){const h=homeAccount.previousElementSibling;if(h?.classList.contains('sectionHead'))h.hidden=true;account.appendChild(homeAccount)}
    const nearby=group('Find nearby providers','zNearbyMenu');
    const find=document.createElement('button');find.type='button';find.className='btn primary';find.textContent='Find nearby providers';find.onclick=()=>{tabs[2].click();tabs[2].classList.remove('active');tabs[3].classList.add('active')};nearby.appendChild(find);
    const support=group('Help, support & legal','zSupportMenu');
    const moreOptions=document.getElementById('moreSettings');if(moreOptions)menu.insertBefore(moreOptions,support);
    const legal=profile.querySelector('.legal');if(legal){const heading=legal.previousElementSibling;if(heading?.classList.contains('sectionHead'))heading.hidden=true;support.appendChild(legal)}
    function collectSupport(){const node=document.getElementById('zovroSupportCenter');if(node&&node.parentElement!==support)support.appendChild(node)}
    collectSupport();new MutationObserver(collectSupport).observe(profile,{childList:true});
    const provider=document.getElementById('providerJoin');if(provider){group('Become a service provider','zProviderMenu').appendChild(provider)}
    const nearbyCta=document.getElementById('zAvailableNow');if(nearbyCta)nearbyCta.hidden=true;
    // Preserve the existing tab order because request flows reference it.
    const oldNav=window.nav;window.nav=function(id,b){const result=oldNav.apply(this,arguments);if(id==='nearby'){tabs[2].classList.remove('active');tabs[3].classList.add('active')}return result};
    // Links to the provider section now open its menu before scrolling.
    for(const link of document.querySelectorAll('a[href="#providerJoin"]'))link.addEventListener('click',event=>{event.preventDefault();tabs[3].click();const d=document.getElementById('zProviderMenu');if(d)d.open=true;d?.scrollIntoView({block:'start',behavior:'smooth'})});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',simplify);else simplify();
})();

// Owner-approved silver layout: reuse original request/account handlers.
(function(){
  function ready(){
    if(document.getElementById('zCategoryGrid'))return;
    const home=document.getElementById('home'),smart=document.getElementById('smartMatch');
    if(!home||!smart)return;
    document.body.classList.add('z-silver-layout');
    const webNav=document.querySelector('.z-web-nav');if(webNav){webNav.innerHTML='<a href="#home">Home</a><a href="#zCategoryGrid">Services</a><a href="#profile">More</a><a href="support.html">Support</a>';for(const a of webNav.querySelectorAll('a[href^="#"]'))a.onclick=()=>{document.querySelectorAll('.bottom button')[a.hash==='#profile'?3:0]?.click()}}
    const tabs=[...document.querySelectorAll('.bottom button')];
    const iconPaths={car:'M3 15V9l3-5h12l3 5v6M3 10h18M5 15v4M19 15v4M6 13h2M16 13h2M3 15h18',home:'M3 11 12 3l9 8M5 10v11h5v-7h4v7h5V10',clean:'m14 3-6 11M6 12l8 5-4 5-7-4zM18 4v5M16 6h4',tree:'M12 3c-4 0-5 3-4 5-5 1-5 7-1 8h10c4-1 4-7-1-8 1-2 0-5-4-5zM12 16v6',truck:'M2 5h12v12H2zM14 10h4l4 4v3h-8M5 17a2 2 0 1 0 4 0M16 17a2 2 0 1 0 4 0',more:'M4 12h1M11 12h1M18 12h1',pin:'M12 22S4 13 4 9a8 8 0 1 1 16 0c0 4-8 13-8 13zM9 9a3 3 0 1 0 6 0 3 3 0 1 0-6 0',account:'M8 7a4 4 0 1 0 8 0 4 4 0 1 0-8 0M4 22v-3a8 8 0 0 1 16 0v3z',requests:'M6 3h12v19H6zM9 8h6M9 12h6M9 16h4'};
    const icon=name=>window.ZOVRO_ART?.icon(name)||'<svg viewBox="0 0 24 26" aria-hidden="true"><path d="'+iconPaths[name]+'"/></svg>';
    const button=(text,action,cls='btn ghost')=>{const b=document.createElement('button');b.type='button';b.className=cls;b.textContent=text;b.onclick=action;return b};
    const serviceVisual=(label,categoryId='')=>{
      const text=String(label||'').toLowerCase();
      const direct=[
        [/roadside|emergency roadside/,['roadside','🛟']],
        [/tire/,['tire','🛞']],
        [/jump|battery/,['battery','🔋']],
        [/lockout|locked/,['lock','🔐']],
        [/tow/,['tow','🪝']],
        [/mechanic|engine|brake|oil|vehicle|auto|car repair/,['mechanic','🔧']],
        [/handyman|repair/,['handyman','🛠️']],
        [/plumb|pipe|faucet|sewer/,['plumbing','🚿']],
        [/drain|toilet/,['drain','🚽']],
        [/electric|outlet|breaker|wiring/,['electrical','⚡']],
        [/light/,['lighting','💡']],
        [/hvac|air condition|ac\b|thermostat/,['hvac','❄️']],
        [/furnace|heat/,['heat','🔥']],
        [/appliance/,['appliance','🧰']],
        [/washer/,['washer','🫧']],
        [/dryer/,['dryer','🌬️']],
        [/dishwasher/,['dishwasher','🍽️']],
        [/oven/,['oven','♨️']],
        [/refrigerator|fridge/,['fridge','🧊']],
        [/roof/,['roof','🏠']],
        [/paint/,['paint','🎨']],
        [/floor|tile|hardwood|laminate/,['floor','▰']],
        [/drywall/,['drywall','⬚']],
        [/concrete/,['concrete','◼']],
        [/deck/,['deck','▤']],
        [/fence/,['fence','▥']],
        [/contractor|construction/,['construction','🏗️']],
        [/landscap/,['landscape','🌿']],
        [/lawn|grass|mowing/,['lawn','🌱']],
        [/yard cleanup|yard clean|leaf/,['yard','🍂']],
        [/snow/,['snow','❄️']],
        [/tree|branch|arborist|prun/,['tree','🌳']],
        [/stump/,['stump','🪵']],
        [/gutter/,['gutter','💧']],
        [/house clean|maid/,['houseclean','🏡']],
        [/deep clean/,['deepclean','✨']],
        [/move-in/,['movein','📥']],
        [/move-out/,['moveout','📤']],
        [/carpet|rug/,['carpet','▣']],
        [/window clean|clean windows/,['window','🪟']],
        [/commercial cleaning|office cleaning|janitorial/,['commercialclean','🏢']],
        [/post-construction/,['postconstruction','🏗️']],
        [/moving$/,['moving','🚚']],
        [/furniture/,['furniture','🛋️']],
        [/loading|unloading/,['loading','📦']],
        [/junk|debris|haul/,['junk','🧱']],
        [/pest|bug|insect/,['pest','🐜']],
        [/bed bug/,['bedbug','▦']],
        [/termite/,['termite','🪵']],
        [/roach|cockroach/,['roach','⬢']],
        [/ant/,['ant','🐜']],
        [/spider/,['spider','✳']],
        [/wasp|hornet/,['wasp','◇']],
        [/mice|mouse/,['mouse','⌁']],
        [/rat|rodent/,['rodent','◉']],
        [/security/,['security','🛡️']],
        [/business|commercial|office/,['business','🏢']]
      ];
      for(const [pattern,result] of direct){if(pattern.test(text))return result}
      const categoryTone={ 'auto-roadside':['auto','🚗'], 'home-services':['home','🏠'], 'emergency-sos':['emergency','🚨'], 'construction-property':['construction','🏗️'], 'outdoor-seasonal':['outdoor','🌳'], cleaning:['clean','🧹'], 'moving-hauling':['moving','🚚'], 'business-services':['business','🏢'], 'other-help':['other','✨'] };
      return categoryTone[categoryId]||['other','✨'];
    };
    const servicePaths={
      plumbing:'M12 3v8M8 7h8M5 11h14v5H5zM9 16v4M15 16v4',
      electrical:'m13 2-8 12h6l-1 10 9-14h-6z',
      hvac:'M12 3v20M3 13h18M5 6l14 14M5 20 19 6M9 5l3 3 3-3M9 21l3-3 3 3',
      tool:'M15 4a6 6 0 0 0-7 7L3 20l3 3 9-10a6 6 0 0 0 6-8l-5 4-3-3z'
    };
    const styleServiceButton=(b,label,categoryId)=>{
      const [tone,legacyIcon]=serviceVisual(label,categoryId);
      b.classList.add('z-service-option','z-tone-'+tone,'z-service-vector');b.dataset.zServiceIcon=legacyIcon;
      const glyph=/plumb|drain|water/i.test(label)?'plumbing':/electric|light|power/i.test(label)?'electrical':/heat|hvac|air condition/i.test(label)?'hvac':/handyman|appliance|repair|mechanic/i.test(label)?'tool':null;
      const categoryGlyph={'auto-roadside':'car','home-services':'home','cleaning':'clean','outdoor-seasonal':'tree','moving-hauling':'truck'};
      const symbol=window.ZOVRO_ART?.service(label,categoryId)||(glyph?'<svg viewBox="0 0 24 26" aria-hidden="true"><path d="'+servicePaths[glyph]+'"/></svg>':icon(categoryGlyph[categoryId]||'home'));
      const badge=document.createElement('span');badge.className='z-catalog-icon';badge.setAttribute('aria-hidden','true');badge.innerHTML=symbol;
      const text=document.createElement('span');text.className='z-catalog-label';text.textContent=label;
      b.replaceChildren(badge,text);return b;
    };
    const showTab=i=>{tabs[i]?.click();window.scrollTo({top:0,behavior:'smooth'})};
    // Single Home request handler is installed above. GPS remains opt-in inside
    // the request form; account management remains under the More tab.
    const services=document.getElementById('services');const oldHeading=services.previousElementSibling;if(oldHeading?.classList.contains('sectionHead'))oldHeading.hidden=true;
    const categories=document.createElement('section');categories.id='zCategoryGrid';categories.innerHTML='<div class="z-service-heading"><h2>Services</h2></div><div class="z-category-grid"></div>';
    smart.insertAdjacentElement('afterend',categories);
    let catalog,catalogBackAction=null,catalogTrigger=null;
    function openCatalog(categoryId,title){
      if(!catalog){catalog=document.createElement('div');catalog.id='zSilverCatalog';catalog.className='modal';catalog.innerHTML='<div class="sheet" role="dialog" aria-modal="true" aria-labelledby="zCatalogTitle"><div class="z-service-heading"><button type="button" id="zCatalogBack" aria-label="Back to home"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14 6-6 6 6 6M8 12h13"/></svg></button><h2 id="zCatalogTitle"></h2><button type="button" id="zCatalogClose" aria-label="Close services">Close</button></div><div class="field"><label for="zCatalogSearch">Find a service</label><input id="zCatalogSearch" type="search" placeholder="Search services"></div><div class="z-catalog-list"></div></div>';document.body.appendChild(catalog);
        const leaveCatalog=()=>{window.closeModal(catalog.id);catalogTrigger?.focus({preventScroll:true})};
        document.getElementById('zCatalogClose').onclick=leaveCatalog;
        document.getElementById('zCatalogBack').onclick=()=>{if(catalogBackAction)catalogBackAction();else leaveCatalog()};
        catalog.addEventListener('click',e=>{if(e.target===catalog)leaveCatalog()});
        catalog.addEventListener('keydown',e=>{
          if(e.key==='Escape'){e.stopPropagation();leaveCatalog()}
          if(e.key==='Tab'){const controls=[...catalog.querySelectorAll('button,input')].filter(x=>!x.hidden&&x.getClientRects().length);const first=controls[0],last=controls[controls.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus()}}
        });
      }
      if(!catalog.classList.contains('open'))catalogTrigger=document.activeElement;
      catalogBackAction=null;catalog.dataset.category=categoryId||'';catalog.dataset.title=title||'';
      document.getElementById('zCatalogBack').setAttribute('aria-label','Back to home');
      document.getElementById('zCatalogTitle').textContent=title||'All services';const list=catalog.querySelector('.z-catalog-list');list.replaceChildren();
      const groups=window.ZOVRO_CATALOG?.SERVICE_CATALOG||[];const seen=new Set();
      const related=[
        {label:'Tire Services',ids:['tire-change','mobile-tire-service','flat-tire-repair']},
        {label:'Doors & Windows',ids:['doors-windows','windows-doors']},
        {label:'Snow Removal & Plowing',ids:['snow-removal','snow-plowing']},
        {label:'Plumbing',ids:['plumbing','emergency-plumber']},
        {label:'Electrical',ids:['electrical','emergency-electrician']},
        {label:'Heating & Air Conditioning',ids:['hvac','emergency-hvac']},
        {label:'Locksmith',ids:['locksmith','emergency-locksmith']},
        {label:'Roadside Assistance',ids:['roadside-assistance','emergency-roadside']},
        {label:'Mobile Mechanic',ids:['mobile-mechanic','emergency-mechanic']},
        {label:'Towing',ids:['towing','emergency-towing']}
      ];
      const all=groups.flatMap(g=>g.services);const displayedGroups=new Set();
      const addService=(service)=>{const item=styleServiceButton(button(service.label.en,()=>{window.closeModal(catalog.id);window.startService(service.label.en)}),service.label.en,service.categoryId);item.dataset.searchTerms=service.label.en.toLowerCase();list.appendChild(item)};
      for(const g of groups){if(categoryId&&g.id!==categoryId)continue;for(const service of g.services){if(seen.has(service.id)||seen.has(service.label.en))continue;const family=related.find(x=>x.ids.includes(service.id));if(family){if(displayedGroups.has(family.label))continue;displayedGroups.add(family.label);const choices=all.filter(x=>family.ids.includes(x.id));for(const choice of choices){seen.add(choice.id);seen.add(choice.label.en)}const item=styleServiceButton(button(family.label,()=>{
        list.replaceChildren();document.getElementById('zCatalogTitle').textContent=family.label;
        catalogBackAction=()=>openCatalog(categoryId,title);document.getElementById('zCatalogBack').setAttribute('aria-label','Back to services');
        const back=button('‹ Back to services',catalogBackAction);list.appendChild(back);choices.forEach(addService);
        document.getElementById('zCatalogSearch').value='';list.scrollTop=0;document.getElementById('zCatalogBack').focus({preventScroll:true});
      }),family.label,g.id);item.dataset.searchTerms=(family.label+' '+choices.map(x=>x.label.en).join(' ')).toLowerCase();list.appendChild(item);continue}seen.add(service.id);seen.add(service.label.en);addService(service)}}
      if(!categoryId){for(const group of window.ZOVRO_PROVIDER_SERVICES?.groups||[]){for(const service of group.services){if(seen.has(service.label))continue;seen.add(service.label);const item=styleServiceButton(button(service.label,()=>{window.closeModal(catalog.id);window.startService(service.label)}),service.label,group.id);list.appendChild(item)}}}
      const search=document.getElementById('zCatalogSearch');search.value='';search.oninput=()=>{const q=search.value.trim().toLowerCase();for(const b of list.children)b.hidden=!(b.dataset.searchTerms||b.textContent.toLowerCase()).includes(q)};window.openModal(catalog.id);list.scrollTop=0;document.getElementById('zCatalogBack').focus({preventScroll:true});
    }
    // "More Services" is the sole way to open the full service directory.
    for(const [label,id,glyph] of [['Roadside Assistance','auto-roadside','car'],['Home Repairs','home-services','home'],['Cleaning','cleaning','clean'],['Outdoor & Tree Care','outdoor-seasonal','tree'],['Moving & Hauling','moving-hauling','truck'],['More Services',null,'more']]){const b=button('',()=>openCatalog(id,label),'z-category');b.innerHTML='<span class="z-icon-badge" aria-hidden="true">'+icon(glyph)+'</span><span class="z-category-label">'+label+'</span>';categories.querySelector('.z-category-grid').appendChild(b)}
    // Nearby providers live in More; request tracking lives in Requests.
    document.querySelector('#zAccountMenu>summary').textContent='My Account · Profile & security';
    document.querySelector('#zSupportMenu>summary').textContent='Get help · Support & legal';
    const how=document.getElementById('howItWorks');if(how)document.getElementById('zSupportMenu').appendChild(how);
    const provider=document.querySelector('#zProviderMenu>summary');if(provider)provider.textContent='Work with ZOVRO';
    const support=document.getElementById('zSupportMenu');const links=document.createElement('div');links.innerHTML='<a class="z-menu-row" href="mailto:support@zovro.work">Contact Support <span>›</span></a>';support.insertBefore(links,support.children[1]);
    const manage=document.createElement('section');manage.id='zManageMenu';manage.className='z-menu-group';manage.innerHTML='<h3>Manage</h3>';
    manage.appendChild(button('Notifications  ›',()=>{const d=document.getElementById('zAccountMenu');d.open=true;const field=document.getElementById('smsNotifications');if(field){field.scrollIntoView({block:'center'});field.focus()}else{window.toast('Manage ZOVRO notifications in your device settings. Provider SMS preferences are in your account.')}},'z-menu-row'));
    document.getElementById('zMoreMenu').insertBefore(manage,support);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready);else ready();
})();

// Organize More as one account card and consistent settings sections.
(function(){
  function init(){
    const profile=document.getElementById('profile'),menu=document.getElementById('zMoreMenu'),account=document.getElementById('zAccountMenu');
    if(!profile||!menu||!account||document.getElementById('zMoreBack'))return;
    const svg=path=>'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="'+path+'"/></svg>';
    const paths={
      back:'m14 6-6 6 6 6M8 12h13',
      account:'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8M4 21v-2a8 8 0 0 1 16 0v2',
      nearby:'M12 22S4 13 4 9a8 8 0 1 1 16 0c0 4-8 13-8 13zM9 9a3 3 0 1 0 6 0 3 3 0 1 0-6 0',
      support:'M4 13v-1a8 8 0 0 1 16 0v1M4 12H2v6h4v-6zM20 12h2v6h-4v-6zM20 18v3h-7',
      provider:'M3 7h18v14H3zM8 7V3h8v4M3 12h18M10 12v3h4v-3',
      options:'M5 6h14M5 12h14M5 18h14M8 3v6M16 9v6M10 15v6',
      security:'M12 2 3 6v6c0 5 9 10 9 10s9-5 9-10V6zM8 12l3 3 5-6'
    };
    const heading=profile.querySelector(':scope > .sectionHead');
    if(heading){
      heading.classList.add('z-more-page-header');
      const back=document.createElement('button');back.id='zMoreBack';back.type='button';back.setAttribute('aria-label','Back to home');back.innerHTML=svg(paths.back);
      back.onclick=()=>{document.querySelector('.bottom button')?.click();window.scrollTo({top:0,behavior:'smooth'})};
      heading.prepend(back);
      const description=heading.querySelector('p');if(description)description.textContent='Your account, preferences and support.';
    }
    function decorate(id,title,description,glyph){
      const summary=document.querySelector('#'+id+'>summary');if(!summary)return;
      summary.replaceChildren();
      const badge=document.createElement('span');badge.className='z-more-icon';badge.setAttribute('aria-hidden','true');badge.innerHTML=window.ZOVRO_ART?.icon(glyph)||svg(paths[glyph]);
      const labels=document.createElement('span');labels.className='z-more-summary-label';
      const strong=document.createElement('strong');strong.textContent=title;
      const small=document.createElement('small');small.textContent=description;
      labels.append(strong,small);summary.append(badge,labels);
    }
    decorate('zAccountMenu','My Account','Profile & security','account');
    decorate('zNearbyMenu','Nearby providers','Find professionals in your area','nearby');
    decorate('zSupportMenu','Help & support','Support, policies and legal information','support');
    decorate('zProviderMenu','Work with ZOVRO','Information for service providers','provider');
    decorate('moreSettings','More options','Urgent roadside assistance','options');
    const controls=document.createElement('details');controls.id='zAccountControls';controls.className='z-menu-group';
    controls.innerHTML='<summary></summary><p class="z-account-actions-note">Sign out on this device, or permanently delete your account.</p>';
    const actions=document.getElementById('accountActions');if(actions)controls.appendChild(actions);
    menu.appendChild(controls);decorate('zAccountControls','Account actions','Sign out or delete your account','security');
    for(const id of ['zAccountMenu','zManageMenu','zNearbyMenu','zSupportMenu','zProviderMenu','moreSettings','zAccountControls']){
      const node=document.getElementById(id);if(node)menu.appendChild(node);
    }
    const manage=document.querySelector('#zManageMenu>h3');if(manage)manage.textContent='Preferences & payments';
    function refresh(){
      const box=document.getElementById('profileBox'),status=document.getElementById('accountBox');
      const name=box?.querySelector(':scope > b');
      if(name){
        const contact=name.nextElementSibling,role=contact?.nextElementSibling;
        const identity=document.createElement('div');identity.className='z-profile-identity';
        const avatar=document.createElement('span');avatar.className='z-profile-avatar';avatar.setAttribute('aria-hidden','true');
        avatar.textContent=name.textContent.trim().split(/\s+/).slice(0,2).map(x=>x.charAt(0)).join('').toUpperCase();
        const info=document.createElement('div');info.className='z-profile-name';
        name.before(identity);info.appendChild(name);if(role?.tagName==='P'&&role.classList.contains('muted'))info.appendChild(role);
        identity.append(avatar,info);
        if(contact?.tagName==='P'){
          const values=[];let value='';for(const node of contact.childNodes){if(node.nodeName==='BR'){values.push(value.trim());value=''}else value+=node.textContent}values.push(value.trim());
          contact.className='z-profile-contact';contact.replaceChildren();
          for(const [i,label] of ['Phone','Email'].entries()){if(!values[i])continue;const row=document.createElement('span'),caption=document.createElement('small'),text=document.createElement('span');caption.textContent=label;text.textContent=values[i];row.append(caption,text);contact.appendChild(row)}
        }
      }
      const hasIdentity=!!box?.querySelector('.z-profile-identity');
      profile.classList.toggle('z-has-profile',hasIdentity);
      if(status&&box&&status.previousElementSibling!==box)box.after(status);
      const verification=document.getElementById('phoneVerificationCard');if(verification&&verification.parentElement!==account)account.appendChild(verification);
      controls.hidden=!actions||actions.classList.contains('hidden');
    }
    refresh();new MutationObserver(refresh).observe(profile,{childList:true,subtree:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();

// Consistent secondary pages. Filters affect visibility only, not request data.
(function(){
  function init(){
    const jobsPage=document.getElementById('jobs'),nearby=document.getElementById('nearby'),list=document.getElementById('jobList');
    if(!jobsPage||!nearby||!list||document.getElementById('zRequestFilters'))return;
    const backIcon='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14 6-6 6 6 6M8 12h13"/></svg>';
    for(const section of [jobsPage,nearby]){
      const heading=section.querySelector(':scope > .sectionHead');if(!heading)continue;
      heading.classList.add('z-secondary-page-header');
      const back=document.createElement('button');back.type='button';back.className='z-page-back';back.setAttribute('aria-label','Back to home');back.innerHTML=backIcon;
      back.onclick=()=>{document.querySelector('.bottom button')?.click();window.scrollTo({top:0,behavior:'instant'})};heading.prepend(back);
    }
    const toolbar=jobsPage.querySelector(':scope > .bar');toolbar?.classList.add('z-request-toolbar');
    const refreshButton=toolbar?.querySelector('button[onclick="loadJobs()"]');
    const status=document.createElement('p');status.id='zJobsStatus';status.className='z-page-status';status.setAttribute('role','status');toolbar?.after(status);
    const filters=document.createElement('div');filters.id='zRequestFilters';filters.setAttribute('role','group');filters.setAttribute('aria-label','Filter requests');
    let selected='all';
    for(const [value,label] of [['all','All'],['active','Active'],['history','History']]){
      const button=document.createElement('button');button.type='button';button.dataset.zRequestFilter=value;button.setAttribute('aria-pressed',String(value==='all'));
      const text=document.createElement('span');text.textContent=label;const count=document.createElement('span');count.className='z-filter-count';
      button.append(text,count);button.onclick=()=>{selected=value;updateFilters()};filters.appendChild(button);
    }
    list.before(filters);
    const empty=document.createElement('div');empty.id='zFilterEmpty';empty.className='card z-filter-empty';empty.hidden=true;
    empty.innerHTML='<b>No requests in this view</b><p>Choose All above to see your other requests.</p>';list.after(empty);
    function updateFilters(){
      for(const icon of list.querySelectorAll('.z-empty-icon')){
        if(!icon.querySelector('svg'))icon.innerHTML=window.ZOVRO_ART?.icon('requests')||'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4H5v17h14V4h-4M9 3h6v4H9zM8 11h8M8 15h6"/></svg>';
      }
      const cards=[...list.querySelectorAll(':scope > .card.job')],counts={all:cards.length,active:0,history:0};let shown=0;
      for(const card of cards){
        const isHistory=/^(completed|cancelled)$/i.test((card.querySelector('.tag')?.textContent||'').trim());
        counts[isHistory?'history':'active']++;
        const visible=selected==='all'||(selected==='history'?isHistory:!isHistory);
        card.classList.toggle('z-request-filtered',!visible);if(visible)shown++;
      }
      filters.hidden=!cards.length;
      if(!cards.length)selected='all';
      for(const button of filters.children){
        const value=button.dataset.zRequestFilter;
        button.setAttribute('aria-pressed',String(selected===value));button.querySelector('.z-filter-count').textContent=String(counts[value]);
      }
      empty.hidden=!cards.length||shown>0;
    }
    updateFilters();new MutationObserver(updateFilters).observe(list,{childList:true,subtree:true});
    const discovery=nearby.querySelector(':scope > .card');discovery?.classList.add('z-discovery-form');
    const select=document.getElementById('nearbyService');select?.setAttribute('aria-label','Choose a service');
    const locationButton=discovery?.querySelector('button[onclick="findNearby()"]');
    if(locationButton)locationButton.textContent='Find nearby providers';
    const nearbyStatus=document.createElement('p');nearbyStatus.id='zNearbyStatus';nearbyStatus.className='z-page-status';nearbyStatus.setAttribute('role','status');discovery?.after(nearbyStatus);
    const intro=document.createElement('div');intro.id='zNearbyIntro';intro.className='card z-discovery-intro';
    intro.innerHTML='<span class="z-discovery-symbol" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 22S4 13 4 9a8 8 0 1 1 16 0c0 4-8 13-8 13zM9 9a3 3 0 1 0 6 0 3 3 0 1 0-6 0"/></svg></span><b>Find the right professional</b><p>Choose a service above, then use your current location to search nearby.</p><small>Exact provider locations stay private until a request is accepted.</small>';
    if(window.ZOVRO_ART)intro.querySelector('.z-discovery-symbol').innerHTML=window.ZOVRO_ART.icon('pin');
    document.getElementById('nearbyList')?.before(intro);
    const oldNav=window.nav;
    if(typeof oldNav==='function')window.nav=function(id){
      const result=oldNav.apply(this,arguments);
      if(id==='jobs'||id==='nearby')window.scrollTo({top:0,behavior:'instant'});
      return result;
    };
    let jobsPending=0,nearbyPending=0;
    const oldLoad=window.loadJobs;
    if(typeof oldLoad==='function')window.loadJobs=async function(){
      jobsPending++;list.setAttribute('aria-busy','true');if(refreshButton){refreshButton.disabled=true;refreshButton.textContent='Updating…'}status.textContent='Updating requests…';
      try{return await oldLoad.apply(this,arguments)}finally{
        jobsPending--;if(!jobsPending){list.setAttribute('aria-busy','false');if(refreshButton){refreshButton.disabled=false;refreshButton.textContent='Refresh'}status.textContent=''}updateFilters();
      }
    };
    const oldFind=window.findNearby;
    if(typeof oldFind==='function')window.findNearby=async function(){
      nearbyPending++;nearby.setAttribute('aria-busy','true');if(locationButton){locationButton.disabled=true;locationButton.textContent='Searching…'}nearbyStatus.textContent='Finding providers near your current location…';
      try{return await oldFind.apply(this,arguments)}finally{
        nearbyPending--;if(!nearbyPending){nearby.setAttribute('aria-busy','false');if(locationButton){locationButton.disabled=false;locationButton.textContent='Find nearby providers'}nearbyStatus.textContent=''}
      }
    };
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();

// 2026-11-09 UX polish: sheet close buttons, color-coded statuses,
// friendly empty states. Additive only; existing handlers untouched.
(function(){
  function ready(fn){document.readyState==='loading'?document.addEventListener('DOMContentLoaded',fn):fn()}
  function statusClass(text){
    const t=String(text||'').toLowerCase();
    if(t.includes('cancel'))return 'z-status-cancelled';
    if(t.includes('completed'))return 'z-status-done';
    if(t.includes('looking')||t.includes('searching'))return 'z-status-waiting';
    return 'z-status-active';
  }
  function jobClass(text){
    const t=String(text||'').toLowerCase();
    if(t.includes('cancel'))return 'z-job-cancelled';
    if(t.includes('completed'))return 'z-job-done';
    return 'z-job-active';
  }
  function init(){
    // Always-visible close button on every modal sheet.
    document.querySelectorAll('.modal .sheet').forEach(sheet=>{
      if(sheet.querySelector('.z-sheet-close'))return;
      const modal=sheet.closest('.modal');
      if(!modal||!modal.id)return;
      const close=document.createElement('button');
      close.type='button';close.className='z-sheet-close';close.setAttribute('aria-label','Close');close.innerHTML='×';
      close.addEventListener('click',()=>{if(typeof window.closeModal==='function')window.closeModal(modal.id)});
      sheet.prepend(close);
    });
    // Color-coded statuses + friendly empty states in the request list.
    const list=document.getElementById('jobList');
    if(!list)return;
    function enhance(){
      for(const tag of list.querySelectorAll('.tag')){
        if(!tag.dataset.zStatusDone){tag.dataset.zStatusDone='1';tag.classList.add(statusClass(tag.textContent))}
      }
      for(const job of list.querySelectorAll('.card.job')){
        const tag=job.querySelector('.tag');
        if(tag&&!job.dataset.zJobDone){job.dataset.zJobDone='1';job.classList.add(jobClass(tag.textContent))}
      }
      const empty=list.querySelector('.card:not(.job)');
      if(empty&&!empty.dataset.zEmptyDone){
        const text=(empty.textContent||'').trim();
        if(text==='No requests yet.'){
          empty.dataset.zEmptyDone='1';empty.classList.add('z-empty');
          empty.innerHTML='<span class="z-empty-icon">🛠️</span><b>No requests yet</b><p class="muted">Go to Home to start a new request using Smart Match or the service categories.</p>';
        }else if(text==='Sign in to see jobs.'){
          empty.dataset.zEmptyDone='1';empty.classList.add('z-empty');
          empty.innerHTML='<span class="z-empty-icon">📋</span><b>Sign in to see your requests</b><p class="muted">Track your requests, chat with your professional and follow the job live.</p><button type="button" class="btn primary" onclick="openAuth()">Sign in</button>';
        }
      }
    }
    enhance();
    new MutationObserver(enhance).observe(list,{childList:true,subtree:true});
  }
  ready(init);
})();

// 2026-11-09 · Simple 2-step request wizard (owner-requested):
// Step 1 "What" (description + auto service), Step 2 "Where" (address first,
// GPS optional). All original IDs, handlers and validation logic untouched.
(function(){
  function ready(fn){document.readyState==='loading'?document.addEventListener('DOMContentLoaded',fn):fn()}
  function init(){
    const modal=document.getElementById('requestModal');if(!modal)return;
    const step1=document.getElementById('zReqStep1'),step2=document.getElementById('zReqStep2');
    const next=document.getElementById('zReqNext'),back=document.getElementById('zReqBack'),send=document.getElementById('zReqSend');
    const label=document.getElementById('zReqProgressLabel'),fill=document.getElementById('zReqProgressFill');
    if(!step1||!step2||!next||!back||!send||!label||!fill)return;
    function show(n){
      step1.classList.toggle('hidden',n!==1);step2.classList.toggle('hidden',n!==2);
      next.hidden=n!==1;back.hidden=n!==2;send.hidden=n!==2;
      label.textContent=n===1?'Step 1 of 2':'Step 2 of 2';
      fill.style.width=n===1?'50%':'100%';
      if(n===2)setTimeout(()=>{document.getElementById('reqAddress')?.focus()},60);
    }
    next.addEventListener('click',()=>{
      const details=document.getElementById('reqDetails');
      if(!details||!details.value.trim()){details?.focus();window.toast('Please describe what you need help with');return}
      show(2);
    });
    back.addEventListener('click',()=>show(1));
    new MutationObserver(()=>{if(modal.classList.contains('open'))show(1)}).observe(modal,{attributes:true,attributeFilter:['class']});
  }
  ready(init);
})();

// 2026-11-09 · Friendlier feedback and small ergonomics wins:
// toast icons, Enter-to-send in chat, Escape closes the topmost modal.
(function(){
  function ready(fn){document.readyState==='loading'?document.addEventListener('DOMContentLoaded',fn):fn()}
  function init(){
    // Toast icons: success vs attention, derived from the message content.
    const original=window.toast;
    if(typeof original==='function'&&!original.__zovroToastIcons){
      const wrapped=function(message){
        try{
          const el=document.getElementById('toast');
          if(el){
            const text=String(message||'');
            const bad=/fail|error|unavailable|not |cannot|could not|invalid|missing|expired|denied|offline|too long|required|please|not found|not confirmed/i;
            const good=/✓|sent|success|welcome|saved|updated|approved|enabled|disabled|ready|received|thank you|deleted|signed out|cancelled|location ready|have been saved/i;
            el.classList.remove('z-toast-ok','z-toast-warn');
            if(bad.test(text))el.classList.add('z-toast-warn');
            else if(good.test(text))el.classList.add('z-toast-ok');
          }
        }catch(_){}
        return original(message);
      };
      wrapped.__zovroToastIcons=true;window.toast=wrapped;
    }
    // Enter sends a chat message.
    const chatInput=document.getElementById('chatText');
    if(chatInput&&!chatInput.dataset.zEnterSend){
      chatInput.dataset.zEnterSend='1';
      chatInput.addEventListener('keydown',e=>{
        if(e.key==='Enter'&&!e.shiftKey&&typeof window.sendMessage==='function'){e.preventDefault();window.sendMessage()}
      });
    }
    // Escape closes the topmost open modal (same as its Close button).
    if(!window.__zovroEscapeClose){
      window.__zovroEscapeClose=true;
      document.addEventListener('keydown',e=>{
        if(e.key!=='Escape'||e.defaultPrevented)return;
        const open=[...document.querySelectorAll('.modal.open')].pop();
        if(open&&open.id&&typeof window.closeModal==='function')window.closeModal(open.id);
      });
    }
  }
  ready(init);
})();

// Full-page presentation for all current and lazily-created application sheets.
// Reuse original dismissal controls so cancellation, retry and cleanup still run.
(function(){
  function init(){
    const selector='.modal,.z-private-modal',prepared=new WeakSet();
    const arrow='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14 6-6 6 6 6M8 12h13"/></svg>';
    function visible(el){return !!el&&el.isConnected&&!el.disabled&&!!el.getClientRects().length&&getComputedStyle(el).visibility!=='hidden'}
    function prepare(modal){
      if(prepared.has(modal))return;
      const sheet=modal.querySelector(':scope > .sheet,:scope > .z-private-sheet');
      if(!sheet)return;
      prepared.add(modal);modal.classList.add('z-page-modal');sheet.classList.add('z-page-sheet');
      const dedicated=modal.id==='authModal'||modal.id==='zSilverCatalog';
      const originalCloseIds={
        passwordRecoveryModal:'recoveryBack',phoneVerificationModal:'phoneVerificationClose',
        supportChatModal:'supportChatClose',zPrivateProfileModal:'zPrivClose',zovroCategoryModal:'zovroCategoryClose'
      };
      function dismiss(back=false){
        const previous=document.getElementById('zReqBack');
        if(back&&modal.id==='requestModal'&&visible(previous)){previous.click();return}
        const special=document.getElementById(originalCloseIds[modal.id]||'');
        if(special){special.click();return}
        if(modal.id==='trackingModal'&&typeof window.closeTracking==='function'){window.closeTracking();return}
        if(modal.id==='zSilverCatalog'){document.getElementById(back?'zCatalogBack':'zCatalogClose')?.click();return}
        const original=sheet.querySelector('.z-sheet-close');
        if(original){original.click();return}
        if(typeof window.closeModal==='function'&&modal.id){window.closeModal(modal.id);return}
        modal.classList.remove('open');
      }
      let header,body,back;
      if(dedicated){
        header=sheet.querySelector('#zAuthHeader,.z-service-heading');
        body=sheet.querySelector('#zAuthBody,.z-catalog-list');
        back=header?.querySelector('button');
      }else{
        header=document.createElement('header');header.className='z-full-page-header';
        back=document.createElement('button');back.type='button';back.className='z-page-back';
        back.setAttribute('aria-label','Back to previous page');back.innerHTML=arrow;
        back.onclick=()=>dismiss(true);
        const title=sheet.querySelector('h2')||document.createElement('h2');
        if(!title.textContent.trim())title.textContent='ZOVRO';
        if(!title.id)title.id=(modal.id||'zPage')+'Title';
        const close=document.createElement('button');close.type='button';close.className='z-page-close';
        close.setAttribute('aria-label','Close');close.textContent='×';close.onclick=()=>dismiss();
        header.append(back,title,close);
        body=document.createElement('div');body.className='z-full-page-body';
        for(const node of [...sheet.childNodes])body.appendChild(node);
        sheet.append(header,body);
        // Late-injected helpers belong in the page body, never below the page.
        new MutationObserver(()=>{
          for(const node of [...sheet.childNodes])if(node!==header&&node!==body)body.appendChild(node);
        }).observe(sheet,{childList:true});
        modal.setAttribute('aria-labelledby',title.id);
      }
      modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');
      let wasOpen=false,returnFocus=null;
      function state(){
        const open=modal.classList.contains('open');
        if(open&&!wasOpen){
          returnFocus=document.activeElement;
          if(body)body.scrollTop=0;
          if(!modal.contains(document.activeElement))back?.focus({preventScroll:true});
          requestAnimationFrame(()=>window.dispatchEvent(new Event('resize')));
        }
        if(!open&&wasOpen&&!document.querySelector('.z-page-modal.open')&&
          (!visible(document.activeElement)||modal.contains(document.activeElement))&&visible(returnFocus)){
          returnFocus.focus({preventScroll:true});
        }
        wasOpen=open;
      }
      new MutationObserver(state).observe(modal,{attributes:true,attributeFilter:['class']});
      modal.addEventListener('keydown',event=>{
        if(!modal.classList.contains('open')||event.defaultPrevented)return;
        if(event.key==='Escape'){event.preventDefault();dismiss();return}
        // Dedicated auth already has its own focus containment.
        if(event.key!=='Tab'||modal.id==='authModal')return;
        const controls=[...sheet.querySelectorAll('button,a[href],input,select,textarea,summary,[tabindex="0"]')].filter(visible);
        const first=controls[0],last=controls[controls.length-1];
        if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus()}
        else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus()}
      });
      state();
    }
    document.querySelectorAll(selector).forEach(prepare);
    new MutationObserver(records=>{
      for(const record of records)for(const node of record.addedNodes){
        if(node.nodeType!==1)continue;
        if(node.matches(selector))prepare(node);
        node.querySelectorAll(selector).forEach(prepare);
      }
    }).observe(document.body,{childList:true,subtree:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();

// 2026-11-09 · Keep the Sign-in / Create-account segmented control in sync.
(function(){
  function ready(fn){document.readyState==='loading'?document.addEventListener('DOMContentLoaded',fn):fn()}
  ready(()=>{
    const original=window.renderAuth;
    if(typeof original!=='function'||original.__zovroTabs)return;
    const wrapped=function(){
      const out=original.apply(this,arguments);
      try{
        const tabs=document.querySelectorAll('#authModal .tabs .btn');
        const login=document.getElementById('authTitle')?.textContent!=='Create account';
        tabs.forEach((t,i)=>{
          const active=login?i===0:i===1;t.classList.toggle('z-tab-active',active);
          t.setAttribute('aria-pressed',String(active));
        });
        const body=document.getElementById('zAuthBody');if(body)body.scrollTop=0;
      }catch(_){}
      return out;
    };
    wrapped.__zovroTabs=true;window.renderAuth=wrapped;
    try{window.renderAuth()}catch(_){}
  });
})();

// Full-height authentication on phones; keep the original form and consent controls.
(function(){
  function init(){
    const modal=document.getElementById('authModal'),sheet=modal?.querySelector('.sheet');
    const title=document.getElementById('authTitle'),tabs=sheet?.querySelector('.tabs'),close=sheet?.querySelector('.z-sheet-close');
    if(!sheet||!title||!tabs||!close||document.getElementById('zAuthHeader'))return;
    const header=document.createElement('header');header.id='zAuthHeader';
    const back=document.createElement('button');back.id='zAuthBack';back.type='button';back.className='z-page-back';back.setAttribute('aria-label','Back to previous page');
    back.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14 6-6 6 6 6M8 12h13"/></svg>';
    back.onclick=()=>window.closeModal('authModal');
    const body=document.createElement('div');body.id='zAuthBody';
    header.append(back,title,close,tabs);
    for(const node of [...sheet.childNodes])body.appendChild(node);
    sheet.append(header,body);
    // Later-loaded recovery helpers remain inside the same scrolling form area.
    new MutationObserver(()=>{
      for(const node of [...sheet.childNodes])if(node!==header&&node!==body)body.appendChild(node);
    }).observe(sheet,{childList:true});
    sheet.setAttribute('role','dialog');sheet.setAttribute('aria-modal','true');sheet.setAttribute('aria-labelledby','authTitle');
    let wasOpen=false,returnFocus=null;
    new MutationObserver(()=>{
      const open=modal.classList.contains('open');
      if(open&&!wasOpen){returnFocus=document.activeElement;body.scrollTop=0;back.focus({preventScroll:true})}
      if(!open&&wasOpen&&returnFocus?.isConnected)returnFocus.focus({preventScroll:true});
      wasOpen=open;
    }).observe(modal,{attributes:true,attributeFilter:['class']});
    modal.addEventListener('keydown',event=>{
      if(event.key!=='Tab'||!modal.classList.contains('open'))return;
      const focusable=[...sheet.querySelectorAll('button,a[href],input,select,textarea,summary,[tabindex="0"]')].filter(el=>!el.disabled&&el.getClientRects().length&&getComputedStyle(el).visibility!=='hidden');
      const first=focusable[0],last=focusable[focusable.length-1];
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus()}
      else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus()}
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();

// Header-only city detection: never starts a service request or provider tracking.
(function(){
  function init(){
    const header=document.querySelector('.top'),brand=header?.querySelector('.brand'),image=brand?.querySelector('.z-official-brand');
    if(!header||!brand||!image||document.getElementById('zHeaderCity'))return;
    const logo=document.createElement('button');logo.id='zBrandLocation';logo.type='button';
    logo.setAttribute('aria-label','Detect current city using the location pin in the ZOVRO logo');
    logo.title='Use device location to find your city via BigDataCloud';
    image.replaceWith(logo);logo.appendChild(image);
    // Keep the lookup state without the owner-removed visible city card.
    const city=document.createElement('button');city.id='zHeaderCity';city.type='button';city.hidden=true;
    city.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22S4 13 4 9a8 8 0 1 1 16 0c0 4-8 13-8 13zM9 9a3 3 0 1 0 6 0 3 3 0 1 0-6 0"/></svg><span><small>Current city</small><b id="zHeaderCityName">Enable location</b></span>';
    brand.after(city);
    const live=document.createElement('span');live.className='z-city-live';live.setAttribute('role','status');header.appendChild(live);
    const requestLocation=document.getElementById('zLocationShortcut');
    if(requestLocation)requestLocation.textContent='Use location for a request  ›';
    const name=city.querySelector('b'),caption=city.querySelector('small');
    let busy=false,lastAttempt=0;
    function setCity(text,message){
      name.textContent=text;live.textContent=message;city.setAttribute('aria-label',message);city.title=message;
      logo.title=message;logo.setAttribute('aria-label','ZOVRO location. '+message);
    }
    async function detect(interactive=false){
      if(busy)return;
      if(!navigator.geolocation||!window.isSecureContext){
        setCity('Location unavailable','Device location requires a supported browser and HTTPS. You can still type a service address.');
        if(interactive)window.toast?.('Location is unavailable. You can still enter your service address manually.');return;
      }
      busy=true;lastAttempt=Date.now();city.disabled=true;logo.disabled=true;city.setAttribute('aria-busy','true');
      caption.textContent='Current city';setCity('Locating…','Finding your city using device location and BigDataCloud.');
      try{
        const position=await window.gpsRead({enableHighAccuracy:false,maximumAge:0,timeout:10000});
        const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),8000);
        let result;
        try{
          const url='https://api.bigdatacloud.net/data/reverse-geocode-client?'+new URLSearchParams({latitude:String(position.lat),longitude:String(position.lng),localityLanguage:'en'});
          const response=await fetch(url,{credentials:'omit',referrerPolicy:'no-referrer',cache:'no-store',signal:controller.signal});
          if(!response.ok)throw new Error('City lookup unavailable');
          result=await response.json();
        }finally{clearTimeout(timer)}
        if(result.lookupSource&&result.lookupSource!=='reverseGeocoding')throw new Error('Precise city lookup unavailable');
        const text=String(result.city||result.locality||'').trim();
        if(!text)throw new Error('City name unavailable');
        caption.textContent=result.city?'Current city':'Current area';
        setCity(text.slice(0,120),'Current '+(result.city?'city':'area')+': '+text+'. Tap to refresh device location. City lookup by BigDataCloud.');
        if(interactive)window.toast?.('Current '+(result.city?'city':'area')+': '+text.slice(0,120));
      }catch(error){
        const denied=Number(error?.code)===1;
        setCity(denied?'Enable location':'Try location again',denied?'Allow location in browser or device settings to display your city.':'Your city could not be determined. Tap to retry. Manual service addresses still work.');
        if(interactive)window.toast?.(denied?'Allow location in your browser or device settings, then tap the logo again.':'City lookup could not finish. Check location and internet access, then try again.');
      }finally{busy=false;city.disabled=false;logo.disabled=false;city.setAttribute('aria-busy','false')}
    }
    logo.onclick=city.onclick=()=>detect(true);
    // The browser's own permission prompt controls initial access. Do not bypass denial.
    async function automatic(){
      try{
        if(navigator.permissions?.query){
          const permission=await navigator.permissions.query({name:'geolocation'});
          if(permission.state==='denied'){setCity('Enable location','Allow location in browser or device settings to display your city.');return}
        }
      }catch(_){}
      detect();
    }
    document.addEventListener('visibilitychange',()=>{
      if(document.visibilityState==='visible'&&Date.now()-lastAttempt>300000)automatic();
    });
    automatic();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();

// 2026-11-09 · More sections open as full pages with a back arrow to the More menu.
// The original <details> elements stay in place so existing code that sets
// `.open=true` (Notifications, provider links) keeps working unchanged.
(function(){
  const arrow='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14 6-6 6 6 6M8 12h13"/></svg>';
  function isSection(d){return d&&d.tagName==='DETAILS'&&d.parentElement&&d.parentElement.id==='zMoreMenu'}
  function title(d){const s=d.querySelector(':scope>summary');return (s?.querySelector('strong')?.textContent||s?.textContent||'ZOVRO').replace(/[›»]/g,'').trim()}
  function goHome(){document.querySelector('.bottom button')?.click();window.scrollTo({top:0})}
  function header(d){
    let h=d.querySelector(':scope>.z-more-subpage-header');
    if(h){h.querySelector('h2').textContent=title(d);return h}
    h=document.createElement('header');h.className='z-full-page-header z-more-subpage-header';
    const back=document.createElement('button');back.type='button';back.className='z-page-back';
    back.setAttribute('aria-label','Back to More');back.innerHTML=arrow;back.onclick=()=>{d.open=false};
    const h2=document.createElement('h2');h2.textContent=title(d);h2.id=(d.id||'zMoreSection')+'PageTitle';
    const close=document.createElement('button');close.type='button';close.className='z-page-close';
    close.setAttribute('aria-label','Close and go to Home');close.textContent='×';close.onclick=()=>{d.open=false;goHome()};
    h.append(back,h2,close);
    d.querySelector(':scope>summary').after(h);
    return h;
  }
  let returnFocus=null;
  document.addEventListener('toggle',event=>{
    const d=event.target;if(!isSection(d))return;
    if(d.open){
      if(d.id==='zNearbyMenu'){d.open=false;document.querySelector('#zNearbyMenu .btn')?.click();return}
      for(const other of document.querySelectorAll('#zMoreMenu>details.z-more-subpage'))if(other!==d)other.open=false;
      const h=header(d);
      returnFocus=d.querySelector(':scope>summary');
      d.classList.add('z-more-subpage');d.setAttribute('role','dialog');d.setAttribute('aria-modal','true');
      d.setAttribute('aria-labelledby',h.querySelector('h2').id);
      document.body.classList.add('z-more-subpage-open');d.scrollTop=0;
      h.querySelector('.z-page-back').focus({preventScroll:true});
    }else if(d.classList.contains('z-more-subpage')){
      d.classList.remove('z-more-subpage');d.removeAttribute('role');d.removeAttribute('aria-modal');d.removeAttribute('aria-labelledby');
      if(!document.querySelector('#zMoreMenu>details.z-more-subpage'))document.body.classList.remove('z-more-subpage-open');
      if(returnFocus&&returnFocus.isConnected&&document.getElementById('profile')?.offsetParent!==null)returnFocus.focus({preventScroll:true});
    }
  },true);
  document.addEventListener('keydown',e=>{
    if(e.key!=='Escape'||e.defaultPrevented||document.querySelector('.z-page-modal.open'))return;
    const open=document.querySelector('#zMoreMenu>details.z-more-subpage');
    if(open){e.preventDefault();open.open=false}
  });
  // Leaving the More tab (bottom navigation) always closes an open section page.
  document.addEventListener('click',e=>{
    if(!e.target.closest('.bottom button'))return;
    for(const d of document.querySelectorAll('#zMoreMenu>details.z-more-subpage'))d.open=false;
  },true);
})();
