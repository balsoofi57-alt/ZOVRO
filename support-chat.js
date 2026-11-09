'use strict';
(function () {
  let modal, log, input, status, returnTo, transcript = [], owner, pending = false, submitted = '', attempt = null, answering = false, generation = 0, escalation = 'general';
  const signedIn = () => typeof me !== 'undefined' && me ? me.id : null;
  const currentLanguage=()=>window.ZOVRO_I18N?.getLanguage?.()||'en';
  // Policy-approved automated answers are available in English, Arabic and Spanish.
  // Keep French/Chinese customer questions for a support ticket; never invent an answer.
  const supportIntro={
    en:'Welcome to ZOVRO support. Automated answers currently cover English, Arabic and Spanish. For other languages, sign in and submit a support ticket. Never share passwords, verification codes or card details.',
    ar:'مرحبًا بك في دعم ZOVRO. تتوفر الإجابات الآلية حاليًا بالإنجليزية والعربية والإسبانية. للغات الأخرى، سجّل الدخول وأرسل تذكرة دعم. لا تشارك كلمات المرور أو رموز التحقق أو بيانات البطاقة.',
    es:'Bienvenido al soporte de ZOVRO. Las respuestas automáticas están disponibles en inglés, árabe y español. Para otros idiomas, inicia sesión y envía un ticket. No compartas contraseñas, códigos de verificación ni datos de tarjetas.',
    fr:'Bienvenue dans l’assistance ZOVRO. Les réponses automatiques sont proposées en anglais, en arabe et en espagnol. Pour les autres langues, connectez-vous et envoyez un ticket au support. Ne partagez jamais de mots de passe, de codes de vérification ou de données de carte.',
    zh:'欢迎使用 ZOVRO 支持服务。自动回复目前支持英语、阿拉伯语和西班牙语。使用其他语言时，请登录并提交支持工单。请勿分享密码、验证码或银行卡信息。'
  };
  const unsupportedReply={
    fr:'Je ne peux pas fournir de réponse automatique vérifiée en français pour le moment. Connectez-vous et sélectionnez « Contacter le service client » pour envoyer votre demande à l’équipe de support. Aucun agent en direct n’est connecté et aucun délai de réponse n’est garanti.',
    zh:'目前无法提供经过审核的中文自动答复。请登录后选择“联系客户支持”，提交您的问题供支持团队审核。当前没有在线人工客服，也无法保证回复时间。'
  };
  function message(role, text) {
    const item = document.createElement('p');
    item.className = 'msg'; item.dir = 'auto'; item.setAttribute('translate','no');
    item.textContent = (role === 'user' ? 'You: ' : 'ZOVRO: ') + text;
    log.appendChild(item); log.scrollTop = log.scrollHeight;
    transcript.push({role, text});
    while (transcript.length > 30) { transcript.shift(); log.firstChild.remove(); }
  }
  function close() {
    generation++; answering = false;
    document.querySelector('#supportChatForm button[type=submit]').disabled = false;
    modal.classList.remove('open');
    if (returnTo && document.contains(returnTo) && !modal.contains(returnTo)) {
      returnTo.closest('.modal')?.classList.add('open'); returnTo.focus();
    }
  }
  function init() {
    if (modal) return;
    modal = document.createElement('div'); modal.id = 'supportChatModal'; modal.className = 'modal';
    modal.setAttribute('role', 'dialog'); modal.setAttribute('aria-modal', 'true'); modal.setAttribute('aria-labelledby', 'supportChatTitle');
    modal.innerHTML = '<div class="sheet" style="max-height:90dvh;overflow:auto"><h2 id="supportChatTitle">ZOVRO Support</h2><p>Clear answers based on ZOVRO policies. Complex issues go to customer support. Do not share passwords, verification codes or card details.</p><div id="supportChatLog" role="log" aria-live="polite" style="max-height:35dvh;overflow:auto;overflow-wrap:anywhere"></div><form id="supportChatForm"><div class="field"><label for="supportChatText">Your message</label><textarea id="supportChatText" maxlength="2000" required placeholder="How can we help?"></textarea></div><label id="supportAIChoice" hidden style="gap:10px;align-items:flex-start;margin:14px 0"><input id="supportAllowAI" type="checkbox"><span>Use AI to understand my question. My question and up to three previous questions may be processed by OpenAI.</span></label><button class="btn primary" type="submit">Send message</button></form><p id="supportChatStatus" role="status"></p><div class="bar"><button id="supportChatTicket" class="btn ghost" type="button">Contact customer support</button><button id="supportChatRequests" class="btn ghost" type="button">View support requests</button><button id="supportChatClose" class="btn ghost" type="button">Back</button></div></div>';
    document.body.appendChild(modal);
    log = document.getElementById('supportChatLog'); input = document.getElementById('supportChatText'); status = document.getElementById('supportChatStatus');
    document.getElementById('supportChatClose').onclick = close;
    modal.addEventListener('keydown', e => {
      if (e.key === 'Escape') { e.preventDefault(); close(); }
      if (e.key === 'Tab') {
        const focusable = [...modal.querySelectorAll('button:not(:disabled),textarea,input')].filter(el=>!el.closest('[hidden]'));
        const first = focusable[0], last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
    const suggestions = document.createElement('div'); suggestions.className = 'bar';
    for (const question of ['How do I request help?', 'My GPS is not working', 'I forgot my password', 'Do I need a license to join ZOVRO?']) {
      const button = document.createElement('button'); button.type = 'button'; button.className = 'btn ghost'; button.textContent = question;
      button.onclick = () => { input.value = question; document.getElementById('supportChatForm').requestSubmit(); };
      suggestions.appendChild(button);
    }
    log.before(suggestions);
    document.getElementById('supportChatRequests').onclick = () => {
      if (!signedIn()) { status.textContent = 'Sign in to view your support requests.'; return; }
      close(); if (typeof nav === 'function') nav('profile', document.querySelectorAll('.bottom button')[3]);
      window.ZOVRO_SUPPORT?.loadTickets();
    };
    document.getElementById('supportChatForm').onsubmit = async e => {
      e.preventDefault(); const text = input.value.trim(); if (!text || answering) return;
      if (signedIn() !== owner) { open(); status.textContent = 'Account changed. Please enter your question again.'; return; }
      const actor = owner, run = ++generation, history = transcript.filter(x=>x.role==='user').slice(-3).map(x=>x.text);
      message('user', text); input.value = ''; answering = true;
      const send = document.querySelector('#supportChatForm button[type=submit]'); send.disabled = true;
      status.textContent = 'Reviewing your question…';
      const locale=currentLanguage();
      let result=unsupportedReply[locale]
        ? {answerId:'human-review',language:locale,reply:unsupportedReply[locale],humanReviewRequired:true}
        : window.ZOVRO_SUPPORT_ASSISTANT.answer({text,locale});
      try {
        if (!unsupportedReply[locale] && result.answerId === 'human-review' && document.getElementById('supportAllowAI').checked && !document.getElementById('supportAIChoice').hidden) {
          const out = await api('/support/answer', {method:'POST',signal:AbortSignal.timeout(12000),body:JSON.stringify({text,history,locale,allowAI:true})});
          if (typeof out.reply === 'string' && out.reply.length <= 4000 && ['en','ar','es'].includes(out.language) && typeof out.humanReviewRequired === 'boolean') result = out;
        }
      } catch (_) { /* Approved fallback remains available during provider outages. */ }
      if (generation !== run || owner !== actor || signedIn() !== actor) return;
      answering = false; send.disabled = false;
      message('assistant', result.reply);
      if (result.answerId === 'safety') escalation = 'safety';
      else if (result.answerId === 'payment-review' && escalation !== 'safety') escalation = 'payment';
      else if (result.answerId === 'sensitive-review' && escalation === 'general') escalation = 'complaint';
      const handoff = document.getElementById('supportChatTicket');
      handoff.disabled = pending; handoff.classList.toggle('primary', result.humanReviewRequired); handoff.classList.toggle('ghost', !result.humanReviewRequired);
      status.textContent = result.humanReviewRequired ? 'Customer support review recommended. No live agent is connected. Select Contact customer support to submit a ticket.' : (result.mode === 'ai-assisted' ? 'AI-assisted understanding · approved ZOVRO answer' : 'Answer from ZOVRO help guidance');
      input.focus();
    };
    document.getElementById('supportChatTicket').onclick = async e => {
      if (!signedIn()) { status.textContent = 'Automated help is available here. Human review requires sign-in; account recovery still requires a verified recovery method.'; return; }
      if (!transcript.some(x => x.role === 'user')) { status.textContent = 'Describe your issue first.'; input.focus(); return; }
      if (pending || answering) return;
      const snapshot = transcript.map(x => x.role + ': ' + x.text).join('\n').slice(-18000);
      if (submitted === snapshot) { status.textContent = 'This conversation has already been submitted for review.'; return; }
      const actor = signedIn();
      if (!attempt || attempt.snapshot !== snapshot || attempt.actor !== actor) attempt = {snapshot, actor, key:crypto.randomUUID()};
      const activeAttempt = attempt;
      const button = e.currentTarget; pending = true; button.disabled = true; status.textContent = 'Submitting for review…';
      try {
        const out = await api('/workflows/upsert', {method:'POST', signal:AbortSignal.timeout(15000), body:JSON.stringify({type:'support_ticket', key:activeAttempt.key, status:'received', data:{category:escalation,priority:escalation==='safety'?'urgent':'normal',subject:'In-app customer support request',description:snapshot,source:'in_app',humanReviewRequired:true,knowledgeVersion:window.ZOVRO_SUPPORT_ASSISTANT.version,liveAgent:false}})});
        if (signedIn() !== actor || owner !== actor) return;
        if (!out.record?.id) throw new Error('No ticket confirmation was returned.');
        submitted = snapshot;
        status.textContent = 'Support ticket received: ' + out.record.id + '. Saved for customer support review. No live agent is connected and a response time is not confirmed. View support requests for updates.';
      } catch (error) {
        if (signedIn() === actor && owner === actor) status.textContent = error.name === 'TimeoutError' ? 'Confirmation took too long. Retry to check the same support request.' : error.message || 'Could not submit. Try again.';
      } finally { pending = false; button.disabled = false; }
    };
  }
  function open(trigger) {
    init(); const origin = trigger || document.activeElement;
    if (origin && !modal.contains(origin)) returnTo = origin;
    const current = signedIn();
    if (owner !== current) { generation++; answering = false; escalation = 'general'; document.getElementById('supportAllowAI').checked = false; owner = current; transcript = []; submitted = ''; attempt = null; log.replaceChildren(); input.value = ''; }
    status.textContent = 'Conversation stays on this page until you leave. Contact customer support saves it as a ticket when signed in. This is not a live-agent chat.';
    document.querySelector('#supportChatForm button[type=submit]').disabled = answering;
    const actor = owner, check = generation;
    document.getElementById('supportAIChoice').hidden = true;
    if (typeof api === 'function') api('/support/status').then(out=>{if(owner===actor&&generation===check)document.getElementById('supportAIChoice').hidden=!out.aiConfigured}).catch(()=>{});
    document.getElementById('supportChatTicket').disabled = pending;
    returnTo?.closest('.modal')?.classList.remove('open');
    modal.classList.add('open');
    if (!transcript.length) message('assistant',supportIntro[currentLanguage()]||supportIntro.en);
    input.focus();
  }
  window.ZOVRO_SUPPORT_CHAT = {open};
  document.addEventListener('click', event => {
    const link = event.target.closest('a[href="mailto:support@zovro.work"], [data-support-chat]');
    if (link) { event.preventDefault(); open(link); }
  });
  function openSupportLink(){if(location.hash==='#support')open();}
  window.addEventListener('hashchange',openSupportLink);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',openSupportLink,{once:true});else openSupportLink();
})();
