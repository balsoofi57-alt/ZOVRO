'use strict';
// ZOVRO mobile home improvements. This file reuses existing request,
// location, chat, notification and account APIs instead of duplicating them.
(function(){
  const byId=id=>document.getElementById(id);
  const icon={
    home:'M3 10 12 3l9 7v11h-6v-7H9v7H3z',
    requests:'M7 3h10v18H7zM10 8h4M10 12h4M10 16h3',
    messages:'M4 5h16v13H9l-5 4zM8 10h8M8 14h5',
    account:'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8M4 21v-2a8 8 0 0 1 16 0v2',
    bell:'M18 8a6 6 0 0 0-12 0c0 7-3 8-3 9h18c0-1-3-2-3-9M10 21h4',
    pin:'M12 22S4 13 4 9a8 8 0 1 1 16 0c0 4-8 13-8 13zM9 9a3 3 0 1 0 6 0 3 3 0 1 0-6 0',
    search:'M11 19a8 8 0 1 0 0-16 8 8 0 1 0 0 16M17 17l5 5',
    bolt:'m13 2-8 11h7l-1 9 8-12h-7z'
  };
  const svg=name=>'<svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="'+icon[name]+'"/></svg>';
  const make=(tag,cls,text)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=text;return el};
  const currentUser=()=>{try{return typeof me!=='undefined'?me:null}catch{return null}};
  const currentJobs=()=>{try{return typeof jobs!=='undefined'&&Array.isArray(jobs)?jobs:[]}catch{return []}};
  const customerLocation={mode:'none',manual:''}; // Never persist coordinates or send them during home browsing.
  function resetPrivateHome(){
    customerLocation.mode='none';customerLocation.manual='';
    const manual=byId('zHomeManualAddress');if(manual)manual.value='';
    setLocation('Choose location');
    hideSuggestions();
    const query=byId('zHomeSearch');if(query)query.value='';
    if(locationPanel)locationPanel.hidden=true;
    const toggle=byId('zHomeLocationToggle');if(toggle)toggle.setAttribute('aria-expanded','false');
    if(noticePanel)noticePanel.hidden=true;
    // Clear notification text and cached account state on logout/account switch.
    if(noticeList)noticeList.replaceChildren();
    notifAccount=null;notifLast=0;
    if(bell)bell.dataset.unread='';
    if(threads)threads.replaceChildren();
    if(activeCard){activeCard.hidden=true;activeCard.replaceChildren()}
    if(rebookCard){rebookCard.hidden=true;rebookCard.replaceChildren()}
    if(searchFeedback)searchFeedback.textContent='';
  }
  let inMessages=false,notifyBusy=false,notifAccount=null,notifLast=0;
  let searchInput,results,searchFeedback,locationTitle,locationPanel,activeCard,rebookCard,threads,noticePanel,noticeList,bell;
  const tabs=()=>[...document.querySelectorAll('nav.bottom button')];
  const requestNav=()=>tabs()[1]?.click();
  const call=(name,...args)=>typeof window[name]==='function'?window[name](...args):undefined;
  function draft(options={}){
    const params={details:options.details||'',urgent:options.urgent===true,useLocation:customerLocation.mode==='gps'};
    const requested=options.service;
    const selector=byId('reqService');
    if(requested&&[...(selector?.options||[])].some(o=>o.value===requested))params.service=requested;
    // Opening a draft never sends a request or location to a provider.
    call('startRequestWithLocation',params);
    if(customerLocation.mode==='manual'&&byId('requestModal')?.classList.contains('open')&&currentUser()){
      const address=byId('reqAddress');
      if(address){address.value=customerLocation.manual;call('requestAddressTypedManually')}
    }
    if(searchInput)searchInput.blur();
    hideSuggestions();
  }
  // Local service matching: a suggestion, not a confirmed diagnosis or an AI API call.
  // Local, explainable guidance: do not send typed text to an AI service.
  // All suggestions are provisional until a customer reviews the request.
  function problemGuide(query){
    const q=String(query||'').trim().slice(0,240);
    if(q.length<2)return {warning:'',hint:'',autoService:null,topName:null};
    const text=q.toLowerCase();
    const danger=/\b(?:gas leak|smell(?:ing)? gas|carbon monoxide|fire spreading|house fire|flames?|smoke (?:coming|from|inside)|electric shock|live wire|downed power line|unconscious|severe injury|chest pain)\b/i.test(q)
      || /\b(?:water|flood|flooding)\b.{0,55}\b(?:electricity|electrical|outlet|live wire|breaker)\b/i.test(q);
    let hint='Add a few details in the request form to help a professional understand the job.';
    if(/\b(?:car|vehicle|battery|engine|tire|tyre|roadside)\b/.test(text))hint='For vehicle help, include the vehicle type and what happened. Add only details you are comfortable sharing.';
    else if(/\b(?:leak|pipe|plumb|drain|flood|water)\b/.test(text))hint='For water issues, describe where you see the problem. Keep clear of electrical hazards.';
    else if(/\b(?:lock|key|locked)\b/.test(text))hint='Mention whether the lock is on a vehicle, home, or business.';
    else if(/\b(?:tow|moving|delivery|deliver|transport)\b/.test(text))hint='For transport jobs, you will be asked for pickup and destination addresses.';
    const catalog=window.ZOVRO_CATALOG;
    let scored=[];
    try{scored=Array.isArray(catalog?.smartMatch?.(q,{limit:5}))?catalog.smartMatch(q,{limit:5}):[]}catch{}
    const valid=scored.filter(x=>x?.service?.id!=='other'&&x?.service?.label?.en&&Number(x.score)>=.65);
    const first=valid[0],second=valid[1];
    // High confidence plus a clear lead is required to prefill, never to submit.
    const autoService=!danger&&first?.score>=.96&&first.score-(second?.score||0)>=.12?first.service.label.en:null;
    return {
      warning:danger?'Possible immediate danger: move to safety and call 911 if anyone is at risk. ZOVRO is not an emergency dispatch service.':'',
      hint:danger?'Do not rely on ZOVRO for emergency dispatch. Use local emergency services first.':hint,
      autoService,topName:danger?null:(first?.service?.label?.en||null)
    };
  }
  if(typeof window!=='undefined')window.ZOVRO_REQUEST_GUIDE=problemGuide;
  function serviceMatches(query){
    const q=String(query||'').trim().toLowerCase();
    if(q.length<2)return [];
    const catalog=window.ZOVRO_CATALOG;
    const all=(catalog?.SERVICE_CATALOG||[]).flatMap(g=>g.services||[]);
    const matches=new Map();
    function add(name,score){
      if(typeof name!=='string'||!name.trim()||name==='Other / I Need Help')return;
      const prior=matches.get(name);
      if(!prior||prior.score<score)matches.set(name,{name,score});
    }
    for(const service of all){
      const name=String(service.label?.en||'');
      const normalized=name.toLowerCase();
      if(normalized===q)add(name,1);
      else if(normalized.startsWith(q))add(name,.9);
      else if(normalized.includes(q))add(name,.76);
    }
    try{
      const suggested=typeof catalog?.smartMatch==='function'?catalog.smartMatch(query,{limit:8}):[];
      for(const item of Array.isArray(suggested)?suggested:[]){
        if(item?.score>=.48)add(item.service?.label?.en,item.score);
      }
    }catch{}
    return [...matches.values()].sort((a,b)=>b.score-a.score||a.name.localeCompare(b.name)).slice(0,5);
  }
  function hideSuggestions(){
    if(results){results.replaceChildren();results.hidden=true}
    if(searchInput)searchInput.setAttribute('aria-expanded','false');
  }
  function suggest(){
    if(!results||!searchInput)return;
    const q=searchInput.value.trim();
    results.replaceChildren();
    if(searchFeedback)searchFeedback.textContent='';
    if(q.length<2){hideSuggestions();return}
    const guide=problemGuide(q);
    if(guide.warning){
      const warning=make('p','z-home-guide-alert',guide.warning);
      warning.setAttribute('role','alert');
      results.appendChild(warning);
    }else{
      const matches=serviceMatches(q);
      if(matches.length){
        results.appendChild(make('p','z-home-guide-title','Possible services · select one to review'));
        for(const match of matches){
          const b=make('button','z-home-result');b.type='button';
          b.setAttribute('aria-label','Review '+match.name);
          b.append(make('strong','',match.name));
          b.append(make('small','',match.name===guide.topName?'Suggested based on your words':'Other possible match'));
          b.onclick=()=>draft({details:q,service:match.name});
          results.appendChild(b);
        }
      }else{
        results.appendChild(make('p','z-home-guide-empty','No clear match yet. Press Enter to describe the problem and select a service.'));
      }
    }
    results.appendChild(make('p','z-home-guide-hint',guide.hint+' Suggestions do not confirm a diagnosis or provider availability.'));
    results.hidden=false;
    searchInput.setAttribute('aria-expanded','true');
  }
  function submitSearch(){
    const q=searchInput?.value.trim();if(!q)return;
    const guide=problemGuide(q);
    // When a life-safety concern is detected, show the emergency warning instead
    // of automatically opening a routine ZOVRO service request.
    if(guide.warning){suggest();return}
    const matches=serviceMatches(q),top=matches[0],second=matches[1];
    // Retain the current strong-match fallback and all original confirmation steps.
    const confident=top&&top.score>=.88&&(!second||top.score-second.score>=.10);
    const suggested=guide.autoService&&matches.some(m=>m.name===guide.autoService)
      ?guide.autoService:(confident?top.name:undefined);
    draft({details:q,service:suggested});
  }
  function beginVoice(){
    const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(!SR)return;
    let recognition;
    try{
      recognition=new SR();
      recognition.lang='en-US';recognition.interimResults=false;
      recognition.maxAlternatives=1;
      if(searchFeedback)searchFeedback.textContent='Listening… Speak naturally.';
      recognition.onresult=event=>{
        const text=event.results?.[0]?.[0]?.transcript?.trim()||'';
        if(text&&searchInput){searchInput.value=text;suggest();searchInput.focus()}
        if(searchFeedback)searchFeedback.textContent=text?'Review the suggestions, then choose a service.':'No speech heard. Try typing instead.';
      };
      recognition.onerror=()=>{if(searchFeedback)searchFeedback.textContent='Voice input unavailable. You can still type your problem.'};
      recognition.onend=()=>{if(searchFeedback?.textContent==='Listening… Speak naturally.')searchFeedback.textContent='No speech heard. Try typing instead.'};
      recognition.start();
    }catch{if(searchFeedback)searchFeedback.textContent='Voice input unavailable. You can still type your problem.'}
  }
  function setupSearch(parent){
    const row=make('form','z-home-search');
    row.id='zHomeSearchForm';row.setAttribute('role','search');
    const label=make('label','z-visually-hidden','Search for a service or describe your problem');
    label.htmlFor='zHomeSearch';
    const field=make('div','z-home-search-field');
    const symbol=make('span','z-home-search-symbol');symbol.innerHTML=svg('search');
    searchInput=make('input');searchInput.type='search';searchInput.id='zHomeSearch';
    searchInput.placeholder='What do you need help with?';
    searchInput.autocomplete='off';searchInput.maxLength=240;
    searchInput.setAttribute('aria-controls','zHomeSearchResults');
    searchInput.setAttribute('aria-expanded','false');
    searchInput.setAttribute('aria-autocomplete','list');
    searchInput.oninput=suggest;
    searchInput.onkeydown=e=>{if(e.key==='Escape'){hideSuggestions();return}if(e.key==='ArrowDown'&&!results?.hidden){const first=results.querySelector('button');if(first){e.preventDefault();first.focus()}}};
    field.append(symbol,searchInput);
    if(window.SpeechRecognition||window.webkitSpeechRecognition){
      const voice=make('button','z-home-voice','🎙');
      voice.type='button';voice.id='zHomeVoice';
      voice.setAttribute('aria-label','Describe your problem by voice');
      voice.title='Voice search';voice.onclick=beginVoice;field.appendChild(voice);
    }
    results=make('div','z-home-search-results');results.id='zHomeSearchResults';results.hidden=true;results.setAttribute('role','region');results.setAttribute('aria-label','Service suggestions and safety guidance');
    searchFeedback=make('p','z-home-search-feedback');searchFeedback.setAttribute('role','status');searchFeedback.setAttribute('aria-live','polite');
    row.append(label,field,results,searchFeedback);
    row.onsubmit=e=>{e.preventDefault();submitSearch()};
    parent.appendChild(row);
  }
  function setLocation(text){if(locationTitle)locationTitle.textContent=text}
  function setupLocation(parent){
    const bar=make('div','z-home-location');
    const toggle=make('button','z-home-location-toggle');toggle.type='button';toggle.id='zHomeLocationToggle';
    toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-controls','zHomeLocationOptions');
    const glyph=make('span','z-home-location-glyph');glyph.innerHTML=svg('pin');
    const text=make('span','z-home-location-label');
    const small=make('small','', 'Service location');
    locationTitle=make('strong','','Choose location');text.append(small,locationTitle);
    const arrow=make('span','z-home-location-chevron','⌄');
    toggle.append(glyph,text,arrow);
    locationPanel=make('div','z-home-location-options');locationPanel.id='zHomeLocationOptions';locationPanel.hidden=true;
    const gps=make('button','z-home-location-action','Use my current location');gps.type='button';gps.id='zHomeUseGPS';
    const note=make('p','z-home-hint','Location is optional. GPS city lookup uses a geocoding service; providers receive your location only after you review and send a request.');
    const manualLabel=make('label','','Or enter a service address');manualLabel.htmlFor='zHomeManualAddress';
    const manual=make('input');manual.type='text';manual.id='zHomeManualAddress';manual.autocomplete='street-address';manual.maxLength=200;
    manual.placeholder='Street address, city, state';
    const apply=make('button','z-home-location-action z-home-manual-apply','Use this address');apply.type='button';
    const status=make('p','z-home-location-status');status.setAttribute('role','status');
    toggle.onclick=()=>{locationPanel.hidden=!locationPanel.hidden;toggle.setAttribute('aria-expanded',String(!locationPanel.hidden))};
    gps.onclick=()=>{
      customerLocation.mode='gps';customerLocation.manual='';
      // Clear the previous manual address when switching back to GPS.
      manual.value='';status.textContent='';
      setLocation('Finding your city…');
      status.textContent='Allow location access if prompted. We will confirm GPS again when you create a request.';
      const legacyCity=byId('zHeaderCity');
      if(legacyCity){legacyCity.click()}else setLocation('GPS selected for next request');
      locationPanel.hidden=true;toggle.setAttribute('aria-expanded','false');
    };
    apply.onclick=()=>{
      const value=manual.value.trim();
      if(value.length<8){status.textContent='Please enter a full street address and city.';manual.focus();return}
      customerLocation.mode='manual';customerLocation.manual=value;
      // A manually entered service address overrides a prior GPS choice.
      setLocation(value);status.textContent='Address saved for your next request on this screen.';
      locationPanel.hidden=true;toggle.setAttribute('aria-expanded','false');
    };
    locationPanel.append(gps,manualLabel,manual,apply,note,status);
    bar.append(toggle,locationPanel);parent.appendChild(bar);
    const city=byId('zHeaderCityName');
    if(city){
      const update=()=>{
        if(customerLocation.mode!=='gps')return;
        const v=city.textContent.trim();
        if(v&&!/locating|finding city|enable location|try location|unavailable/i.test(v))setLocation(v);
        else if(/try location|unavailable|enable location/i.test(v))setLocation('GPS unavailable — enter an address');
      };
      new MutationObserver(update).observe(city,{childList:true,characterData:true,subtree:true});
    }
  }
  function setupHome(){
    const categories=byId('zCategoryGrid');if(!categories||byId('zHomeTools'))return;
    const wrap=make('div','z-home-tools');wrap.id='zHomeTools';
    const top=make('div','z-home-top-actions');
    setupLocation(top);setupSearch(top);wrap.appendChild(top);
    const urgent=make('div','z-home-help-panel');
    const button=byId('zStartRequest');
    if(button){
      button.textContent='Help Now';button.id='zStartRequest';
      button.setAttribute('aria-label','Start an urgent roadside assistance request');
      button.onclick=()=>draft({service:'Roadside Assistance',urgent:true});
      button.prepend((()=>{const n=make('span','z-help-icon');n.innerHTML=svg('bolt');return n})());
      urgent.appendChild(button);
      urgent.appendChild(make('p','','Urgent roadside assistance · Review your request before sending'));
    }
    wrap.appendChild(urgent);
    activeCard=make('section','z-home-active-card');activeCard.id='zHomeActiveRequest';activeCard.hidden=true;
    activeCard.setAttribute('role','status');activeCard.setAttribute('aria-live','polite');wrap.appendChild(activeCard);
    rebookCard=make('section','z-home-rebook-card');rebookCard.id='zHomeRebook';rebookCard.hidden=true;
    wrap.appendChild(rebookCard);
    categories.before(wrap);
    // An address selected before authentication must survive the sign-in step.
    const resume=window.resumeRequestIntent;
    if(typeof resume==='function'&&!resume.__zHomeLocation){
      const restore=function(){const value=resume.apply(this,arguments);
        if(customerLocation.mode==='manual'&&byId('requestModal')?.classList.contains('open')){
          const address=byId('reqAddress');if(address){address.value=customerLocation.manual;call('requestAddressTypedManually')}
        }
        return value;
      };
      restore.__zHomeLocation=true;window.resumeRequestIntent=restore;
    }
    renderActive();
  }
  function renderActive(){
    if(!activeCard)return;
    const actor=currentUser();
    const open=actor?.role==='customer'?currentJobs().filter(j=>j.customerId===actor.id&&!['Completed','Cancelled'].includes(j.status)):[];
    open.sort((a,b)=>Date.parse(b.createdAt||0)-Date.parse(a.createdAt||0));
    const item=open[0];
    activeCard.replaceChildren();
    activeCard.hidden=!item;
    if(item){
      const rawStatus=String(item.status||'Pending');
      const stages={Pending:{label:'Request sent',hint:'Waiting for a professional to accept.'},Accepted:{label:'Professional assigned',hint:'Open your request for provider details.'},'In Progress':{label:'Service in progress',hint:'Check your request for the latest updates.'},EnRoute:{label:'Professional on the way',hint:'Open your request for arrival details.'},'On The Way':{label:'Professional on the way',hint:'Open your request for arrival details.'}};
      const stage=stages[rawStatus]||{label:rawStatus,hint:'View your request for details.'};
      const heading=make('div','z-home-active-heading');
      heading.append(make('strong','','Current request'),make('span','z-home-active-status',stage.label));
      activeCard.append(heading,make('p','',String(item.service||'Service')),make('small','z-home-active-hint',stage.hint));
      const go=make('button','z-home-track','View request');
      go.type='button';go.onclick=requestNav;activeCard.appendChild(go);
    }
    renderRebook();
  }
  function renderRebook(){
    if(!rebookCard)return;
    const actor=currentUser();
    const history=actor?.role==='customer'?currentJobs().filter(j=>
      j.customerId===actor.id&&j.status==='Completed'&&typeof j.service==='string'&&j.service.trim()
    ):[];
    history.sort((a,b)=>Date.parse(b.createdAt||0)-Date.parse(a.createdAt||0));
    const last=history[0];
    rebookCard.replaceChildren();rebookCard.hidden=!last;
    if(!last)return;
    const copy=make('div','z-home-rebook-copy');
    copy.append(make('small','','Save time next time'),make('strong','',last.service));
    const again=make('button','z-home-rebook-action','Book again');
    again.type='button';
    // Never reuse a previous request's address, description or coordinates.
    again.onclick=()=>draft({service:last.service});
    rebookCard.append(copy,again);
  }
  function renderThreads(){
    if(!threads)return;
    threads.replaceChildren();
    const actor=currentUser();
    if(!actor){threads.appendChild(make('p','z-home-empty','Sign in from Account to view your conversations.'));return}
    const conversations=currentJobs().filter(j=>j.providerId&&j.id&&
      (j.customerId===actor.id||j.providerId===actor.id));
    conversations.sort((a,b)=>Date.parse(b.createdAt||0)-Date.parse(a.createdAt||0));
    if(!conversations.length){
      threads.appendChild(make('p','z-home-empty','No conversations yet. Chat becomes available after a provider accepts a request.'));
      return;
    }
    for(const j of conversations){
      const button=make('button','z-home-thread');button.type='button';
      const name=actor.role==='customer'?(j.providerName||'Service provider'):(j.customerName||'Customer');
      const heading=make('strong','',name);
      const info=make('span','',String(j.service||'Service')+' · '+String(j.status||''));
      button.append(heading,info);
      button.onclick=()=>call('openChat',j.id);
      threads.appendChild(button);
    }
  }
  function setupMessages(){
    const page=byId('jobs');
    if(!page||byId('zHomeMessages'))return;
    const pane=make('div','z-home-message-list');pane.id='zHomeMessages';pane.hidden=true;
    threads=make('div','z-home-threads');
    pane.appendChild(threads);
    const heading=page.querySelector(':scope>.sectionHead');
    heading?.after(pane);
    const originalNav=window.nav;
    if(typeof originalNav!=='function')return;
    window.nav=function(id,b){
      const messages=id==='messages';inMessages=messages;
      originalNav(messages?'jobs':id,b);
      page.classList.toggle('z-messages-view',messages);
      pane.hidden=!messages;
      const h=page.querySelector(':scope>.sectionHead h2');
      const p=page.querySelector(':scope>.sectionHead p');
      if(h)h.textContent=messages?'Messages':'My Requests';
      if(p)p.textContent=messages?'Conversations linked to your service requests.':'Manage active and completed service requests.';
      if(messages)renderThreads();
    };
    const list=byId('jobList');
    if(list)new MutationObserver(()=>{renderActive();if(inMessages)renderThreads()}).observe(list,{childList:true,subtree:false});
  }
  function setupNavigation(){
    const nav=document.querySelector('nav.bottom');
    if(!nav)return;
    const items=[['home','Home','home'],['jobs','My Requests','requests'],['messages','Messages','messages'],['profile','Account','account']];
    const buttons=tabs();
    for(let i=0;i<4;i++){
      const b=buttons[i],item=items[i];if(!b)continue;
      b.classList.remove('z-secondary-tab');
      b.dataset.zHomeTab=item[0];b.setAttribute('aria-label',item[1]);
      b.innerHTML=svg(item[2])+'<span>'+item[1]+'</span>';
      b.setAttribute('onclick',"nav('"+item[0]+"',this)");
    }
    nav.classList.add('z-home-bottom-nav');
    nav.setAttribute('aria-label','Main navigation');
  }
  function ensureNoticePanel(){
    if(noticePanel)return;
    noticePanel=make('div','z-notifications-overlay');noticePanel.id='zNotificationsOverlay';noticePanel.hidden=true;
    const content=make('section','z-notifications-sheet');
    content.setAttribute('role','dialog');content.setAttribute('aria-modal','true');
    content.setAttribute('aria-labelledby','zNotificationsTitle');
    const header=make('div','z-notifications-header');
    const title=make('h2','','Notifications');title.id='zNotificationsTitle';
    const close=make('button','','Close');close.type='button';
    close.onclick=()=>{noticePanel.hidden=true;bell?.focus()};
    header.append(title,close);
    const read=make('button','z-notifications-mark','Mark all as read');read.type='button';read.id='zNotificationsRead';
    read.onclick=async()=>{
      try{await call('api','/notifications/read',{method:'POST',body:'{}'});await loadNotifications(true)}
      catch{noticeList.replaceChildren(make('p','','Could not update notifications. Try again.'))}
    };
    noticeList=make('div','z-notification-items');noticeList.id='zNotificationItems';
    content.append(header,read,noticeList);noticePanel.appendChild(content);document.body.appendChild(noticePanel);
    noticePanel.addEventListener('click',e=>{if(e.target===noticePanel)noticePanel.hidden=true});
    noticePanel.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();noticePanel.hidden=true;bell?.focus()}});
  }
  async function loadNotifications(show=false){
    const actor=currentUser();
    if(!actor){if(show)call('openAuth');return}
    if(notifyBusy)return;
    notifyBusy=true;const userId=actor.id;
    if(show){ensureNoticePanel();noticePanel.hidden=false;noticeList.replaceChildren(make('p','','Loading notifications…'))}
    try{
      const response=await call('api','/notifications');
      if(currentUser()?.id!==userId)return;
      const list=Array.isArray(response?.notifications)?response.notifications:[];
      const unread=list.filter(n=>!n.read).length;
      if(bell)bell.dataset.unread=unread>0?String(unread):'';
      if(show){
        noticeList.replaceChildren();
        if(!list.length)noticeList.appendChild(make('p','z-home-empty','No notifications yet.'));
        for(const n of list){
          const item=make('button','z-notification-item'+(!n.read?' z-unread':''));item.type='button';
          item.append(make('strong','',String(n.title||'ZOVRO update')),make('span','',String(n.text||'')));
          item.onclick=()=>{
            noticePanel.hidden=true;
            const requestId=String(n.meta?.requestId||'');
            const job=currentJobs().find(j=>j.id===requestId&&j.providerId);
            if(n.meta?.type==='message'&&job){call('openChat',requestId);return}
            if(!requestId&&/verification|account/i.test(String(n.meta?.type||'')+' '+String(n.title||''))){tabs()[3]?.click();return}
            requestNav();
          };
          noticeList.appendChild(item);
        }
      }
      notifAccount=userId;notifLast=Date.now();
    }catch{
      if(show)noticeList.replaceChildren(make('p','z-home-empty','Notifications are unavailable. Please try again.'));
    }finally{notifyBusy=false}
  }
  function setupBell(){
    const shortcut=document.querySelector('.top .z-account-shortcut');if(!shortcut)return;
    bell=shortcut;
    bell.id='zNotificationBell';bell.classList.add('z-notification-bell');
    bell.setAttribute('aria-label','Notifications');
    bell.title='Notifications';
    bell.innerHTML=svg('bell')+'<span class="z-notification-dot" aria-hidden="true"></span>';
    bell.onclick=()=>loadNotifications(true);
    const brand=byId('zBrandLocation');
    if(brand){
      const logo=brand.querySelector('img');
      // The separate location selector is the only visible location action.
      if(logo)brand.replaceWith(logo);
    }
    ensureNoticePanel();
    for(const method of ['logout','deleteAccount']){
      const original=window[method];
      if(typeof original!=='function'||original.__zHomePrivateReset)continue;
      const wrapped=async function(...args){
        const result=await original.apply(this,args);
        if(!currentUser())resetPrivateHome();
        return result;
      };
      wrapped.__zHomePrivateReset=true;window[method]=wrapped;
    }
    let priorAccountId=currentUser()?.id||null;
    setInterval(()=>{
      const latestAccountId=currentUser()?.id||null;
      if(priorAccountId&&priorAccountId!==latestAccountId)resetPrivateHome();
      priorAccountId=latestAccountId;
      const actor=currentUser();
      if(!actor){if(bell)bell.dataset.unread='';notifAccount=null;return}
      if(document.visibilityState==='hidden')return;
      if(notifAccount!==actor.id||Date.now()-notifLast>60000)void loadNotifications();
    },15000);
  }
  function boot(){
    if(byId('zHomeTools'))return;
    setupHome();setupMessages();setupNavigation();setupBell();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
