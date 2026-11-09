(function () {
  'use strict';
  const KEY = 'zovroLanguage';
  const locales = {en: 'English', es: 'Español', ar: 'العربية', zh: '简体中文'};
  const messages = window.ZOVRO_MESSAGES || {};
  const reverse = new Map();
  for (const [source, values] of Object.entries(messages)) {
    for (const value of Object.values(values)) if (!reverse.has(value)) reverse.set(value, source);
  }
  const originals = new WeakMap(), attributes = new WeakMap();
  const skip = 'script,style,code,pre,[translate="no"],[data-i18n-ignore],#chatList,#chatIdentity,#supportChatLog,.leaflet-pane';
  const translatedAttributes = ['placeholder', 'aria-label', 'title', 'label'];
  let current = 'en', observer, pending = new Set(), scheduled = false;

  function normalize(value) {
    const code = String(value || '').toLowerCase().split(/[-_]/)[0];
    return Object.prototype.hasOwnProperty.call(locales, code) ? code : 'en';
  }
  function readLanguage() {
    try {
      const saved = localStorage.getItem(KEY);
      if (saved) return normalize(saved);
    } catch (_) { /* Private browsing and sandboxed previews can block storage. */ }
    return normalize(navigator.language);
  }
  function translate(text, locale = current) {
    const value = String(text ?? ''), core = value.trim();
    const target = normalize(locale);
    if (target === 'en' || !core) return value;
    const translated = messages[core.replace(/\s+/g, ' ')]?.[target];
    if (translated) return value.slice(0, value.indexOf(core)) + translated + value.slice(value.indexOf(core) + core.length);
    // Localize dynamic counters without modifying user-authored text or API values.
    const counters = [
      [/^Role: (customer|provider|admin)$/, {
        es: role => `Tipo de cuenta: ${{customer: 'cliente', provider: 'profesional', admin: 'administrador'}[role]}`,
        ar: role => `نوع الحساب: ${{customer: 'عميل', provider: 'مقدم خدمة', admin: 'مسؤول'}[role]}`,
        zh: role => `账户类型：${{customer: '客户', provider: '服务商', admin: '管理员'}[role]}`
      }],
      [/^(\d+) services available$/, {
        es: n => `${n} servicios disponibles`, ar: n => `الخدمات المتاحة: ${n}`, zh: n => `${n} 项可用服务`
      }],
      [/^(\d+) choices selected$/, {
        es: n => `${n} opciones seleccionadas`, ar: n => `الخيارات المحددة: ${n}`, zh: n => `已选择 ${n} 项`
      }],
      [/^(\d+) workers?$/, {
        es: n => `${n} trabajadores`, ar: n => `عدد العمال: ${n}`, zh: n => `${n} 名工人`
      }],
      [/^([\d.]+) hours$/, {
        es: n => `${n} horas`, ar: n => `${n} ساعة`, zh: n => `${n} 小时`
      }]
    ];
    for (const [pattern, labels] of counters) {
      const match = core.match(pattern);
      if (match) return value.replace(core, labels[target](match[1]));
    }
    return value;
  }
  function excluded(element) { return !element || Boolean(element.closest(skip)); }
  function sourceText(element) {
    if (!element) return '';
    if (element.nodeType === Node.TEXT_NODE) return originals.get(element)?.source ?? element.nodeValue;
    return [...element.childNodes].map(sourceText).join('');
  }
  function translateNode(node) {
    const parent = node.parentElement;
    if (excluded(parent) || parent.closest('textarea,#zovroLanguage') || !node.nodeValue.trim()) return;
    // Option text is also its implicit value. Preserve the API value before translation.
    if (parent.tagName === 'OPTION' && !parent.hasAttribute('value')) parent.setAttribute('value', parent.value);
    let record = originals.get(node);
    if (!record || node.nodeValue !== record.rendered) {
      let source = node.nodeValue;
      // Existing handlers sometimes restore a button's previously displayed label.
      // Recover its English source without touching user-authored messages or form values.
      if (parent.closest('button,h1,h2,h3,h4,h5,h6,label,summary,option,legend')) {
        const core = source.trim(), canonical = reverse.get(core);
        if (!messages[core] && canonical) source = source.replace(core, canonical);
      }
      record = {source};
    }
    const rendered = translate(record.source);
    record.rendered = rendered;
    originals.set(node, record);
    if (node.nodeValue !== rendered) node.nodeValue = rendered;
  }
  function translateAttributes(element) {
    if (excluded(element) || element.closest('#zovroLanguage')) return;
    let records = attributes.get(element);
    if (!records) { records = {}; attributes.set(element, records); }
    for (const name of translatedAttributes) {
      if (!element.hasAttribute(name)) continue;
      const value = element.getAttribute(name);
      let record = records[name];
      if (!record || value !== record.rendered) record = {source: value};
      const rendered = translate(record.source);
      record.rendered = rendered;
      records[name] = record;
      if (value !== rendered) element.setAttribute(name, rendered);
    }
    // This field is a display-only GPS status, never an address or API payload.
    if (element.id === 'reqLocationStatus') {
      let record = records.value;
      if (!record || element.value !== record.rendered) record = {source: element.value};
      record.rendered = translate(record.source);
      records.value = record;
      if (element.value !== record.rendered) element.value = record.rendered;
    }
  }
  function observe() {
    if (observer && document.body) observer.observe(document.body, {
      childList: true, subtree: true, characterData: true,
      attributes: true, attributeFilter: translatedAttributes
    });
  }
  function apply(root = document.body) {
    if (!root) return;
    // Disconnect while writing, so our own translations cannot create an observer loop.
    observer?.disconnect();
    const focused = document.activeElement;
    // Let mixed-script names, messages and addresses use their own writing direction.
    root.querySelectorAll?.('textarea,input:not([type]),input[type="text"],input[type="search"]').forEach(element => {
      if (element.id !== 'reqLocationStatus' && !element.hasAttribute('dir')) element.dir = 'auto';
    });
    if (root.nodeType === Node.TEXT_NODE) translateNode(root);
    else {
      if (root.nodeType === Node.ELEMENT_NODE) translateAttributes(root);
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) translateNode(walker.currentNode);
      root.querySelectorAll?.('[placeholder],[aria-label],[title],optgroup[label]').forEach(translateAttributes);
    }
    const chooser = document.getElementById('zovroLanguage');
    if (chooser) { chooser.value = current; chooser.setAttribute('aria-label', translate('Language')); }
    // Never steal focus or rewrite form values when changing the display language.
    if (focused && focused !== document.activeElement && document.contains(focused)) focused.focus({preventScroll: true});
    observe();
  }
  function queue(records) {
    for (const record of records) {
      if (record.type === 'childList') record.addedNodes.forEach(node => pending.add(node));
      else pending.add(record.target);
    }
    const locationStatus = document.getElementById('reqLocationStatus');
    if (locationStatus && records.length) pending.add(locationStatus);
    if (scheduled) return;
    scheduled = true;
    queueMicrotask(() => {
      scheduled = false;
      const roots = [...pending]; pending.clear();
      for (const root of roots) if (root.isConnected) apply(root);
    });
  }
  function setLanguage(value, persist = true) {
    // Process application mutations before disconnecting the observer.
    if (observer) queue(observer.takeRecords());
    current = normalize(value);
    if (persist) { try { localStorage.setItem(KEY, current); } catch (_) {} }
    document.documentElement.lang = current === 'zh' ? 'zh-Hans' : current;
    document.documentElement.dir = current === 'ar' ? 'rtl' : 'ltr';
    apply();
    document.dispatchEvent(new CustomEvent('zovro:languagechange', {detail: {language: current}}));
    return current;
  }
  function installChooser() {
    let chooser = document.getElementById('zovroLanguage');
    if (!chooser || chooser.tagName !== 'SELECT') {
      const select = document.createElement('select');
      select.id = 'zovroLanguage'; select.className = 'state zovro-language';
      select.setAttribute('aria-label', 'Language');
      if (chooser) chooser.replaceWith(select);
      else {
        const top = document.querySelector('.top,.z-doc-header');
        if (!top) return;
        const status = document.getElementById('state');
        if (status?.parentElement === top) top.insertBefore(select, status);
        else top.appendChild(select);
      }
      chooser = select;
    }
    chooser.classList.add('zovro-language');
    chooser.replaceChildren(...Object.entries(locales).map(([value, text]) => {
      const option = document.createElement('option');
      option.value = value; option.textContent = text; option.lang = value === 'zh' ? 'zh-Hans' : value;
      option.dir = value === 'ar' ? 'rtl' : 'ltr';
      return option;
    }));
    chooser.removeAttribute('onchange');
    chooser.onchange = () => setLanguage(chooser.value);
  }
  function boot() {
    installChooser();
    observer = new MutationObserver(queue);
    setLanguage(readLanguage(), false);
  }
  window.ZOVRO_I18N = {getLanguage: () => current, setLanguage, apply, t: translate, sourceText, normalize, locales};
  window.addEventListener('storage', event => {
    if (event.key === KEY) setLanguage(event.newValue || navigator.language, false);
  });
  // Existing UI builders run at DOMContentLoaded. Let them finish before translating.
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(boot, 0), {once: true});
  else setTimeout(boot, 0);
})();
