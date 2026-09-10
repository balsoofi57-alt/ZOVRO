'use strict';
(function(){
  function ready(fn){document.readyState==='loading'?document.addEventListener('DOMContentLoaded',fn):fn()}
  function call(name,...args){if(typeof window[name]==='function')return window[name](...args)}
  function openHelp(prefill){
    call('newRequest');
    setTimeout(()=>{
      const d=document.getElementById('reqDetails');
      if(d&&prefill)d.value=prefill;
      const s=document.getElementById('reqService');
      if(s&&prefill){
        const q=prefill.toLowerCase();
        const rules=[[/tire|flat|jump|battery|tow|lockout|roadside/,'road'],[/car|vehicle|engine|mechanic|brake/,'auto'],[/plumb|leak|sink|toilet|water/,'plumb'],[/heat|cool|ac|air condition|furnace|hvac/,'hvac'],[/electric|outlet|power|light/,'electric'],[/move|moving|furniture/,'mov'],[/roof/,'roof'],[/snow/,'snow'],[/lawn|grass/,'lawn'],[/appliance|washer|dryer|refrigerator|fridge/,'appliance']];
        const hit=rules.find(([re])=>re.test(q));
        if(hit){const opt=[...s.options].find(o=>o.textContent.toLowerCase().includes(hit[1]));if(opt)s.value=opt.value}
      }
    },120);
  }
  function goNearby(){
    const b=[...document.querySelectorAll('.bottom button')].find(x=>/nearby/i.test(x.textContent));
    if(b){b.click();return}
    document.getElementById('nearby')?.scrollIntoView({behavior:'smooth'});
  }
  ready(()=>{
    document.title='ZOVRO — Anywhere, Anytime, Near to You.';
    const brand=document.querySelector('.brand');
    if(brand&&!brand.querySelector('.z-official-brand'))brand.innerHTML='<img class="z-official-brand" src="assets/zovro-official-brand.webp" alt="ZOVRO — Anywhere, Anytime, Near to You.">';

    const top=document.querySelector('.top');
    if(top){
      top.querySelector('.z-web-nav')?.remove();
      const nav=document.createElement('nav');
      nav.className='z-web-nav';
      nav.innerHTML='<a href="#smartMatch">Get Help</a><a href="#services">Services</a><a href="#howItWorks">How It Works</a><a href="#providerJoin">For Providers</a><a href="support.html">Support</a>';
      top.insertBefore(nav,document.getElementById('state'));
    }

    const hero=document.querySelector('.hero');
    if(hero){
      if(!hero.querySelector('.z-brand-showcase')){const art=document.createElement('img');art.className='z-brand-showcase';art.src='assets/zovro-official-brand.webp';art.alt='ZOVRO official brand';hero.prepend(art)}
      const eyebrow=hero.querySelector('.eyebrow');if(eyebrow)eyebrow.textContent='● Anywhere, Anytime, Near to You.';
      const h1=hero.querySelector('h1');if(h1)h1.innerHTML='Tell us what you need. <span>We’ll help you find it nearby.</span>';
      const p=h1?.nextElementSibling;if(p&&p.tagName==='P')p.textContent='Roadside, auto, home, moving and everyday services — one simple request, matched to nearby local professionals.';
      const bar=hero.querySelector('.bar');if(bar)bar.innerHTML='<button class="btn primary" id="zHeroHelp">Get Help Now</button><button class="btn ghost" id="zHeroProvider">Join as a Provider</button><button class="btn danger" id="sosButton">SOS<br><span style="font-size:9px;font-weight:800">EMERGENCY HELP</span></button>';
      document.getElementById('zHeroHelp')?.addEventListener('click',()=>document.getElementById('smartMatch')?.scrollIntoView({behavior:'smooth'}));
      document.getElementById('zHeroProvider')?.addEventListener('click',()=>{document.getElementById('providerJoin')?.scrollIntoView({behavior:'smooth'});setTimeout(()=>call('openAuth'),350)});
      document.getElementById('sosButton')?.addEventListener('click',()=>call('quickSOS'));
    }

    if(hero&&!document.getElementById('smartMatch')){
      const sm=document.createElement('section');sm.id='smartMatch';sm.className='z-smart-match';
      sm.innerHTML='<div class="z-section-kicker">Smart Match</div><h2>What do you need help with?</h2><p>Describe the problem in your own words. ZOVRO will start the right request flow for you.</p><div class="z-smart-box"><textarea id="zProblem" rows="2" placeholder="Example: My car will not start, or water is leaking under my sink"></textarea><div class="z-smart-actions"><button class="btn primary" id="zSmartGo">Find Help</button><button class="btn ghost" id="zVoice">🎙 Voice</button></div></div><div id="zSmartStatus" class="z-smart-status">No need to know the service category — just describe the problem.</div>';
      hero.insertAdjacentElement('afterend',sm);
      document.getElementById('zSmartGo').addEventListener('click',()=>{const q=document.getElementById('zProblem').value.trim();if(!q){document.getElementById('zProblem').focus();return}openHelp(q)});
      document.getElementById('zVoice').addEventListener('click',()=>{
        const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
        if(!SR){document.getElementById('zSmartStatus').textContent='Voice input is not available in this browser. You can type your request instead.';return}
        const r=new SR();r.lang='en-US';r.interimResults=false;r.maxAlternatives=1;
        document.getElementById('zSmartStatus').textContent='Listening…';
        r.onresult=e=>{document.getElementById('zProblem').value=e.results[0][0].transcript;document.getElementById('zSmartStatus').textContent='Voice captured. Tap Find Help.'};
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
        if(cards.length>8){const wrap=document.createElement('div');wrap.className='z-view-all-wrap';wrap.innerHTML='<button class="btn ghost" id="zViewAll">View All Services</button>';services.insertAdjacentElement('afterend',wrap);document.getElementById('zViewAll').onclick=e=>{const expanded=services.classList.toggle('z-all-services');e.currentTarget.textContent=expanded?'Show Popular Services':'View All Services'}}
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

    const account=document.getElementById('accountBox');
    if(account&&!document.getElementById('zSupportStrip')){const s=document.createElement('div');s.id='zSupportStrip';s.className='z-support-strip';s.innerHTML='<div><strong>ZOVRO Support</strong><span>AI-guided help, complaints, payment disputes, safety reports and account support.</span></div><div class="z-support-actions"><a href="support.html">Help Center</a><a href="support.html#complaints">File a Complaint</a><a href="mailto:support@zovro.net">Email Support</a></div>';account.insertAdjacentElement('afterend',s)}

    if(!document.getElementById('zMobileHelp')){const m=document.createElement('button');m.id='zMobileHelp';m.className='z-mobile-help';m.textContent='Get Help Now';m.onclick=()=>document.getElementById('smartMatch')?.scrollIntoView({behavior:'smooth'});document.body.appendChild(m)}

    const shell=document.querySelector('.shell');
    if(shell&&!document.querySelector('.z-site-footer')){const f=document.createElement('footer');f.className='z-site-footer';f.innerHTML='<div>© 2026 ZOVRO LLC · Anywhere, Anytime, Near to You.</div><div><a href="privacy.html">Privacy</a><a href="terms.html">Terms</a><a href="support.html">Support</a></div>';shell.appendChild(f)}
  })
})();