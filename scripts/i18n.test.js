'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const messages = require('../i18n-messages');
const catalog = require('../src/service-catalog');

function runtime() {
  const sandbox = {
    window: {ZOVRO_MESSAGES: messages, addEventListener() {}},
    document: {
      readyState: 'loading', body: null, documentElement: {}, activeElement: null,
      addEventListener() {}, dispatchEvent() {}, getElementById() {return null;}
    },
    navigator: {language: 'en-US'},
    Node: {TEXT_NODE: 3, ELEMENT_NODE: 1},
    CustomEvent: class {constructor(type, init) {this.type = type; this.detail = init.detail;}},
    // Storage is deliberately unavailable: the language runtime must still work.
    localStorage: {getItem() {throw new Error('blocked');}, setItem() {throw new Error('blocked');}},
    WeakMap, Map, Set, Object, String, queueMicrotask
  };
  vm.runInNewContext(fs.readFileSync('i18n.js', 'utf8'), sandbox);
  return sandbox.window.ZOVRO_I18N;
}
function textNode(text, tag = 'BUTTON') {
  const attrs = new Map();
  const parent = {
    tagName: tag, value: text,
    closest(selector) {return selector.startsWith('button,') && tag === 'BUTTON' ? this : null;},
    hasAttribute(name) {return attrs.has(name);},
    getAttribute(name) {return attrs.get(name) ?? null;},
    setAttribute(name, value) {attrs.set(name, value);}
  };
  return {nodeType: 3, nodeValue: text, parentElement: parent};
}
test('English, Spanish, Arabic and Simplified Chinese are explicit choices', () => {
  const i18n = runtime();
  assert.deepEqual(Object.keys(i18n.locales), ['en', 'es', 'ar', 'zh']);
  assert.equal(i18n.locales.zh, '简体中文');
  for (const [input, expected] of [['ar-SA','ar'], ['es-MX','es'], ['zh-CN','zh'], ['zh_Hans','zh'], ['EN-US','en'], ['bad','en'], [null,'en']]) {
    assert.equal(i18n.normalize(input), expected);
  }
});
test('every catalog category and service has all three translations', () => {
  const labels = catalog.SERVICE_CATALOG.flatMap(group => [group.label.en, ...group.services.map(service => service.label.en)]);
  for (const label of labels) for (const locale of ['es', 'ar', 'zh']) {
    assert.ok(messages[label]?.[locale], `${label}: ${locale}`);
  }
  for (const [key, translations] of Object.entries(messages)) {
    assert.equal(key, key.trim().replace(/\s+/g, ' '));
    for (const locale of ['es','ar','zh']) assert.ok(translations[locale]?.trim(), `${key}: ${locale}`);
  }
});
test('translations preserve English fallback, whitespace and safe literal content', () => {
  const i18n = runtime();
  assert.equal(i18n.t('Home', 'ar'), 'الرئيسية');
  assert.equal(i18n.t('Home', 'zh-CN'), '首页');
  assert.equal(i18n.t('Home', 'es'), 'Inicio');
  assert.equal(i18n.t(' Home ', 'ar'), ' الرئيسية ');
  assert.equal(i18n.t('See all  ›', 'ar'), 'عرض الكل ‹');
  assert.equal(i18n.t('Unknown source text', 'ar'), 'Unknown source text');
  assert.equal(i18n.t('<script>alert(1)</script>', 'zh'), '<script>alert(1)</script>');
  assert.equal(i18n.t('Home', 'en'), 'Home');
});
test('dynamic counters localize without rewriting their numbers', () => {
  const i18n = runtime();
  assert.equal(i18n.t('2 workers', 'ar'), 'عدد العمال: 2');
  assert.equal(i18n.t('1.5 hours', 'zh'), '1.5 小时');
  assert.equal(i18n.t('93 services available', 'es'), '93 servicios disponibles');
  assert.equal(i18n.t('5 choices selected', 'zh'), '已选择 5 项');
});
test('language switching survives blocked storage and restores the original source', () => {
  const i18n = runtime(), node = textNode('Home');
  i18n.setLanguage('ar'); i18n.apply(node);
  assert.equal(node.nodeValue, 'الرئيسية');
  i18n.setLanguage('zh'); i18n.apply(node);
  assert.equal(node.nodeValue, '首页');
  i18n.setLanguage('es'); i18n.apply(node);
  assert.equal(node.nodeValue, 'Inicio');
  i18n.setLanguage('en'); i18n.apply(node);
  assert.equal(node.nodeValue, 'Home');
});
test('application updates win over stale translations and restored localized button labels recover', () => {
  const i18n = runtime(), node = textNode('Home');
  i18n.setLanguage('ar'); i18n.apply(node);
  node.nodeValue = 'Close'; i18n.apply(node);
  assert.equal(node.nodeValue, 'إغلاق');
  node.nodeValue = 'متابعة'; i18n.apply(node);
  i18n.setLanguage('en'); i18n.apply(node);
  assert.equal(node.nodeValue, 'Continue');
});
test('implicit option values remain canonical English when their labels are translated', () => {
  const i18n = runtime(), node = textNode('Moving', 'OPTION');
  i18n.setLanguage('ar'); i18n.apply(node);
  assert.equal(node.nodeValue, 'نقل الأثاث');
  assert.equal(node.parentElement.getAttribute('value'), 'Moving');
  i18n.setLanguage('zh'); i18n.apply(node);
  assert.equal(node.nodeValue, '搬家');
  assert.equal(node.parentElement.getAttribute('value'), 'Moving');
});
test('web and mobile share one picker and load the catalog before the runtime', () => {
  const html = fs.readFileSync('index.html', 'utf8');
  assert.equal((html.match(/id="zovroLanguage"/g)||[]).length, 1);
  assert.ok(html.indexOf('src="i18n-messages.js') < html.indexOf('src="i18n.js'));
  for (const locale of ['en', 'es', 'ar', 'zh']) assert.ok(html.includes(`value="${locale}"`));
  for (const file of ['privacy.html','terms.html','support.html','sms-terms.html']) {
    const text = fs.readFileSync(file, 'utf8');
    assert.ok(text.includes('src="i18n-messages.js'), file);
    assert.ok(text.includes('src="i18n.js'), file);
  }
  const mobile = fs.readFileSync('scripts/prepare-mobile.js', 'utf8');
  for (const file of ['i18n-messages.js','i18n.js','secure-session.js','payment-ui.js','support-policy-page.js']) assert.ok(mobile.includes(`'${file}'`), file);
});
test('optional generated mobile bundle retains native features and all languages', {skip: !fs.existsSync('www/index.html')}, () => {
  const html = fs.readFileSync('www/index.html', 'utf8');
  assert.equal((html.match(/id="zovroLanguage"/g)||[]).length, 1);
  for (const file of ['biometric-client.js','secure-session.js','consent-client.js','payment-ui.js','support-center.js','i18n-messages.js','i18n.js']) {
    assert.ok(html.includes(`src="${file}`), file);
    assert.ok(fs.existsSync(`www/${file}`), file);
  }
});
