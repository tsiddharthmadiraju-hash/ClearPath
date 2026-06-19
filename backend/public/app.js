/* ClearPath web client — multilingual, icon-free native app shell. */

const PALETTE = {
  red: { bg: '#FEE2E2', text: '#991B1B' },
  amber: { bg: '#FEF3C7', text: '#92400E' },
  blue: { bg: '#DBEAFE', text: '#1E40AF' },
  green: { bg: '#DCFCE7', text: '#166534' },
  navy: { bg: '#EEF3F8', text: '#1B4F72' },
};

const LANGS = window.CP_LANGUAGES;
const BYCODE = window.CP_LANG_BY_CODE;
const STRINGS = window.CP_STRINGS;
const STORAGE_KEY = 'cp_lang';
const BANNER_KEY = 'cp_lang_banner_shown';
const BASE_FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, Roboto, sans-serif";

let lang = 'en';
let currentScreen = 'home';
let lastAnalysis = null;
let lastDocumentType = null;
let lastHistoryMeta = null;
let resultLang = 'English'; // the language the CURRENT result's content is in
let processingTimers = [];
const loadedFonts = new Set();

const el = (id) => document.getElementById(id);
const t = (key) => (STRINGS[lang] && STRINGS[lang][key]) || STRINGS.en[key] || key;

/* ---------------- language / i18n ---------------- */
function loadFont(fontName) {
  if (!fontName || loadedFonts.has(fontName)) return;
  loadedFonts.add(fontName);
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'https://fonts.googleapis.com/css2?family=' + fontName.replace(/ /g, '+') + ':wght@400;600;700;800&display=swap';
  document.head.appendChild(link);
}

function applyI18n() {
  document.querySelectorAll('[data-i18n]').forEach((n) => {
    n.textContent = t(n.getAttribute('data-i18n'));
  });
  document.querySelectorAll('[data-i18n-ph]').forEach((n) => {
    n.setAttribute('placeholder', t(n.getAttribute('data-i18n-ph')));
  });
  const meta = BYCODE[lang] || BYCODE.en;
  el('lang-current').textContent = meta.native;
  el('lang-sheet-title').textContent = t('choose_language');
  el('lang-sheet-sub').textContent = STRINGS.en.choose_language;
  if (lastAnalysis && currentScreen === 'results') buildResults(lastAnalysis, lastHistoryMeta);
}

function setLanguage(code, persist) {
  if (!BYCODE[code]) code = 'en';
  lang = code;
  const meta = BYCODE[code];
  if (meta.font) loadFont(meta.font);
  const phone = el('phone');
  const dir = meta.rtl ? 'rtl' : 'ltr';
  document.documentElement.dir = dir;
  document.documentElement.lang = code;
  phone.setAttribute('dir', dir);
  phone.setAttribute('data-lang', code);
  phone.style.fontFamily = meta.font ? `'${meta.font}', ${BASE_FONT}` : BASE_FONT;
  if (persist) {
    try { localStorage.setItem(STORAGE_KEY, code); } catch {}
  }
  updateLangChecks();
  applyI18n();
  // When viewing a result, re-translate its CONTENT into the new language too.
  if (currentScreen === 'results') translateCurrent();
}

/** Re-translate the currently displayed result into the active language. */
async function translateCurrent() {
  const target = (BYCODE[lang] || BYCODE.en).english;
  if (!lastAnalysis || target === resultLang) return;
  const meta = lastHistoryMeta;
  startProcessing();
  try {
    const res = await fetch('/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ analysis: lastAnalysis, language: target }),
    });
    const data = await res.json();
    clearProcessing();
    if (res.ok) {
      resultLang = target;
      renderResults(data, meta);
    } else {
      show('results'); // chrome already re-labeled; keep existing content
    }
  } catch {
    clearProcessing();
    show('results');
  }
}

function matchLang(raw) {
  if (!raw) return null;
  const l = raw.toLowerCase();
  if (l.startsWith('zh')) {
    return /(tw|hant|hk|mo)/.test(l) ? 'zh-Hant' : 'zh-Hans';
  }
  const base = l.split('-')[0];
  const map = { en: 'en', es: 'es', vi: 'vi', tl: 'tl', fil: 'tl', ar: 'ar', fr: 'fr', ko: 'ko', ru: 'ru', ht: 'ht', pt: 'pt', hi: 'hi', so: 'so', am: 'am' };
  return map[base] || (BYCODE[raw] ? raw : null);
}

function detectDeviceLang() {
  const navs = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || 'en'];
  for (const raw of navs) {
    const code = matchLang(raw);
    if (code) return code;
  }
  return null;
}

function buildLangList() {
  el('lang-list').innerHTML = LANGS.map(
    (L) => `
      <button class="lang-row" data-lang-code="${L.code}">
        <span class="lang-row__main">
          <span class="lang-row__native">${L.native}</span>
          <span class="lang-row__en">${L.english}</span>
        </span>
        <span class="lang-row__check">✓</span>
      </button>`
  ).join('');
  updateLangChecks();
}

function updateLangChecks() {
  document.querySelectorAll('.lang-row').forEach((r) => {
    r.classList.toggle('is-selected', r.getAttribute('data-lang-code') === lang);
  });
}

function openLangSheet() {
  updateLangChecks();
  el('lang-sheet').hidden = false;
}
function closeLangSheet() {
  el('lang-sheet').hidden = true;
}

function maybeShowBanner(detected) {
  if (!detected || detected === 'en') return;
  let shown = false;
  try { shown = localStorage.getItem(BANNER_KEY) === '1'; } catch {}
  if (shown) return;
  try { localStorage.setItem(BANNER_KEY, '1'); } catch {}
  const meta = BYCODE[detected];
  const banner = el('lang-banner');
  banner.textContent = t('detected_tpl').split('{lang}').join(meta.native);
  banner.hidden = false;
  const dismiss = () => { banner.hidden = true; };
  banner.onclick = () => { dismiss(); openLangSheet(); };
  setTimeout(dismiss, 4000);
}

const LEGAL_KEY = 'cp_legal_banner';
function maybeShowLegalBanner() {
  let dismissed = false;
  try { dismissed = localStorage.getItem(LEGAL_KEY) === '1'; } catch {}
  if (dismissed) return;
  try { localStorage.setItem(LEGAL_KEY, '1'); } catch {} // one-time only
  const b = el('legal-banner');
  if (!b) return;
  b.hidden = false;
  setTimeout(() => { b.hidden = true; }, 5000);
}

/* ---------------- navigation ---------------- */
const SCREENS = ['home', 'text', 'processing', 'results', 'history', 'help'];
function show(name, activeTab) {
  currentScreen = name;
  SCREENS.forEach((s) => el('screen-' + s).classList.toggle('is-active', s === name));
  const tabbar = el('tabbar');
  tabbar.classList.toggle('is-dimmed', name === 'processing');
  const tab = activeTab || (name === 'history' ? 'history' : name === 'help' ? 'help' : 'home');
  tabbar.querySelectorAll('.tab').forEach((b) => b.classList.toggle('is-active', b.dataset.tab === tab));
  if (name === 'history') renderHistory();
  const scroll = document.querySelector('#screen-' + name + ' .scroll');
  if (scroll) scroll.scrollTop = 0;
}

/* ---------------- processing ---------------- */
function startProcessing(subKey) {
  show('processing');
  clearProcessing();
  el('processing-sub').textContent = t(subKey || 'processing_title');
  const fill = el('pbar-fill');
  fill.style.width = '12%';
  let pct = 12;
  processingTimers.push(
    setInterval(() => {
      pct = Math.min(pct + 16, 90);
      fill.style.width = pct + '%';
    }, 1400)
  );
}
function clearProcessing() {
  processingTimers.forEach((x) => { clearInterval(x); clearTimeout(x); });
  processingTimers = [];
}

/* ---------------- API ---------------- */
async function analyze(payload) {
  // Offline: don't attempt a network call — guide the user to their History.
  if (!navigator.onLine && !payload.demoType) {
    showError(t('offline_analyze'));
    return;
  }
  const langName = (BYCODE[lang] || BYCODE.en).english;
  payload.language = langName;
  startProcessing(payload.inputMethod === 'camera' ? 'reading_photo' : 'processing_title');
  const started = Date.now();
  try {
    const res = await fetch('/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    const elapsed = Date.now() - started;
    if (elapsed < 1300) await new Promise((r) => setTimeout(r, 1300 - elapsed));
    el('pbar-fill').style.width = '100%';
    clearProcessing();
    if (!res.ok) return showError(data.message);
    resultLang = payload.language || 'English';
    renderResults(data);
    // Save real analyses to local history (never demo chips, never the document).
    if (!payload.demoType && window.CP_History) {
      const inputType = payload.inputMethod === 'camera' ? 'camera' : payload.inputMethod === 'pdf' ? 'upload' : 'paste';
      window.CP_History.saveAnalysis(data, inputType, langName);
      updateHistoryBadge();
    }
  } catch {
    clearProcessing();
    showError(null);
  }
}

function showError(message) {
  renderResults({
    document_type: t('error_title'),
    plain_explanation: message || t('generic_error'),
    action_checklist: [],
    resources: [],
    confidence: 'low',
    confidence_reason: '',
    disclaimer: t('disclaimer'),
  });
}

/* ---------------- render helpers ---------------- */
function esc(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function docTheme(type) {
  const x = String(type).toLowerCase();
  if (/(evict|vacate|lease|writ|detainer|utility|shutoff|disconnect|electric|housing|إخلاء|驱逐|驅逐)/.test(x)) return PALETTE.red;
  if (/(medical|discharge|hospital|health|clinic|surg|مستشفى|出院|병원)/.test(x)) return PALETTE.blue;
  if (/(benefit|snap|medicaid|ssi|school|truancy|attendance|food|إعانات|福利|복지)/.test(x)) return PALETTE.amber;
  return PALETTE.navy;
}
function urgencyTag(checklist) {
  if (checklist.some((s) => s.urgency === 'immediate')) return { label: 'URGENT', ...PALETTE.red };
  if (checklist.some((s) => s.urgency === 'this_week')) return { label: 'REVIEW', ...PALETTE.amber };
  return { label: 'INFO', ...PALETTE.blue };
}
function confPill(confidence) {
  if (confidence === 'high') return { label: t('confident'), ...PALETTE.green };
  if (confidence === 'medium') return { label: t('review_recommended'), ...PALETTE.amber };
  return { label: t('verify_expert'), ...PALETTE.red };
}
function urgencyLabel(u) {
  return u === 'immediate' ? t('immediate') : u === 'this_week' ? t('this_week') : t('no_deadline');
}
function countdown(checklist) {
  const d = checklist.find((s) => s.deadline);
  if (!d) return '';
  return d.deadline;
}

function buildResults(analysis, historyMeta) {
  lastAnalysis = analysis;
  lastDocumentType = analysis.document_type;
  lastHistoryMeta = historyMeta || null;
  const checklist = analysis.action_checklist || [];
  const resources = analysis.resources || [];

  const cp = confPill(analysis.confidence);
  const pill = el('conf-pill');
  pill.textContent = cp.label;
  pill.style.background = cp.bg;
  pill.style.color = cp.text;

  const theme = docTheme(analysis.document_type);
  const tag = urgencyTag(checklist);
  const cd = countdown(checklist);
  const parts = [];

  if (historyMeta && historyMeta.date_analyzed) {
    parts.push(`<div class="from-history-banner">${esc(t('analyzed_on').split('{date}').join(historyMeta.date_analyzed))}</div>`);
  }

  parts.push(`
    <div class="doc-card" style="background:${theme.bg};color:${theme.text}">
      <span class="doc-card__tag" style="background:rgba(255,255,255,0.55);color:${theme.text}">${tag.label}</span>
      <h2 class="doc-card__title">${esc(analysis.document_type)}</h2>
    </div>`);

  parts.push(`
    <div class="result-section">
      <div class="result-section__head"><span class="section-label">${esc(t('what_this_means'))}</span></div>
      <div class="meaning-card"><p class="meaning-card__body">${esc(analysis.plain_explanation)}</p></div>
    </div>`);

  if (checklist.length) {
    const steps = checklist
      .map((s, i) => {
        const u = ['immediate', 'this_week', 'no_deadline'].includes(s.urgency) ? s.urgency : 'no_deadline';
        return `
        <div class="step-card" data-step="${i}">
          <div class="step-num step-num--${u}">${esc(s.step || i + 1)}</div>
          <div class="step-main">
            <p class="step-action">${esc(s.action)}</p>
            ${s.detail ? `<p class="step-detail">${esc(s.detail)}</p>` : ''}
            <div class="step-tags">
              <span class="badge badge--${u}">${esc(urgencyLabel(u))}</span>
              ${s.deadline ? `<span class="step-deadline">${esc(s.deadline)}</span>` : ''}
            </div>
          </div>
          <div class="check"></div>
        </div>`;
      })
      .join('');
    parts.push(`
      <div class="result-section">
        <div class="result-section__head">
          <span class="section-label">${esc(t('what_to_do'))}</span>
          ${cd ? `<span class="countdown">${esc(cd)}</span>` : ''}
        </div>
        ${steps}
      </div>`);
  }

  if (resources.length) {
    const cards = resources
      .map((r, i) => {
        const tel = r.phone ? `tel:${String(r.phone).replace(/[^0-9+]/g, '')}` : null;
        return `
        <div class="resource-card">
          <p class="resource-card__name">${esc(r.name)}</p>
          ${r.what_they_do ? `<p class="resource-card__desc">${esc(r.what_they_do)}</p>` : ''}
          ${tel ? `<a class="resource-phone" href="${tel}">${esc(r.phone)}</a>` : ''}
          ${
            r.call_script
              ? `<button class="script-toggle" data-script="${i}" aria-expanded="false">
                   <span>${esc(t('what_to_say'))}</span><span class="script-toggle__chev">›</span>
                 </button>
                 <p class="script-body" id="script-${i}" hidden>“${esc(r.call_script)}”</p>`
              : ''
          }
        </div>`;
      })
      .join('');
    parts.push(`
      <div class="result-section">
        <div class="result-section__head"><span class="section-label">${esc(t('who_can_help'))}</span></div>
        ${cards}
      </div>`);
  }

  parts.push(`<p class="disclaimer">${esc(analysis.disclaimer)}</p>`);

  const root = el('results-content');
  root.innerHTML = parts.join('');
  root.querySelectorAll('.step-card').forEach((card) => {
    const key = 'step_' + (Number(card.dataset.step) + 1);
    if (historyMeta && historyMeta.checkedSteps && historyMeta.checkedSteps[key]) card.classList.add('is-done');
    card.addEventListener('click', () => {
      const done = card.classList.toggle('is-done');
      // Persist checked state back to this history item (Maria's court-date use case).
      if (lastHistoryMeta && window.CP_History) window.CP_History.setChecked(lastHistoryMeta.id, key, done);
    });
  });
  root.querySelectorAll('.script-toggle').forEach((btn) => {
    btn.addEventListener('click', () => {
      const body = el('script-' + btn.dataset.script);
      const open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!open));
      body.hidden = open;
    });
  });
}

function renderResults(analysis, historyMeta) {
  buildResults(analysis, historyMeta);
  show('results');
}

/* ---------------- escalation ---------------- */
async function openEscalation() {
  const overlay = el('escalation');
  const list = el('escalation-resources');
  overlay.hidden = false;
  list.innerHTML = '';
  let data;
  try {
    const res = await fetch('/escalation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ documentType: lastDocumentType }),
    });
    data = await res.json();
  } catch {
    data = { resources: [{ name: '211', what_they_do: '', phone: '211' }] };
  }
  list.innerHTML = (data.resources || [])
    .map((r, i) => {
      const tel = r.phone ? `tel:${String(r.phone).replace(/[^0-9+]/g, '')}` : r.website || '#';
      return `
      <a class="esc-row${i === 0 ? ' esc-row--amber' : ''}" href="${tel}">
        <span class="esc-row__main">
          <span class="esc-row__name">${esc(r.name)}</span>
          <span class="esc-row__desc">${esc(r.what_they_do || '')}</span>
        </span>
        <span class="esc-row__chev">›</span>
      </a>`;
    })
    .join('');
}

/* ---------------- files ---------------- */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
async function handleFile(file) {
  if (!file) return;
  try {
    const base64 = await fileToBase64(file);
    // Detect PDFs by MIME type, file extension, OR base64 magic bytes (%PDF →
    // "JVBER"). Mobile pickers often give a PDF an empty/octet-stream type, so
    // type alone is not enough — without this they'd be sent as a broken image.
    const isPdf =
      file.type === 'application/pdf' ||
      /\.pdf$/i.test(file.name || '') ||
      /^JVBER/.test(base64);
    if (isPdf) analyze({ pdfBase64: base64, inputMethod: 'pdf' });
    else analyze({ image: base64, mediaType: file.type || 'image/jpeg', inputMethod: 'camera' });
  } catch {
    showError(null);
  }
}

/* ---------------- history ---------------- */
function updateHistoryBadge() {
  const badge = el('history-badge');
  if (!badge) return;
  const n = window.CP_History ? window.CP_History.count() : 0;
  if (n > 0) { badge.hidden = false; badge.textContent = n > 9 ? '9+' : String(n); }
  else badge.hidden = true;
}

function confDotClass(c) { return c === 'high' ? 'conf-dot--high' : c === 'medium' ? 'conf-dot--medium' : 'conf-dot--low'; }
function histConfLabel(c) { return c === 'high' ? t('confident') : c === 'medium' ? t('review_recommended') : t('verify_expert'); }
function inputTypeLabel(it) { return it === 'camera' ? t('take_photo') : it === 'upload' ? t('upload_doc') : t('paste_text'); }

function renderHistory() {
  const root = el('history-content');
  if (!root) return;
  const items = window.CP_History ? window.CP_History.getHistory() : [];
  if (!items.length) {
    root.innerHTML = `
      <div class="history-empty">
        <div class="history-empty__icon" aria-hidden="true">▢</div>
        <h2 class="history-empty__title">${esc(t('history_empty_title'))}</h2>
        <p class="history-empty__body">${esc(t('history_empty_body'))}</p>
        <button class="btn btn--navy" data-action="home">${esc(t('history_empty_cta'))}</button>
      </div>`;
    return;
  }
  const cards = items
    .map(
      (it) => `
      <div class="history-card" data-history="${it.id}">
        <button class="history-card__swipebtn" data-history-del="${it.id}" aria-label="${esc(t('delete'))}">⋯</button>
        <div class="history-card__top">
          <span class="history-card__type">${esc(it.document_type)}</span>
          <span class="history-card__date">${esc(it.date_analyzed)}</span>
        </div>
        <p class="history-card__preview">${esc(it.plain_explanation)}</p>
        <div class="history-card__bottom">
          <span class="history-conf"><span class="conf-dot ${confDotClass(it.confidence)}"></span>${esc(histConfLabel(it.confidence))}</span>
          <span class="history-card__meta"><span>${esc(it.language)}</span><span>${esc(inputTypeLabel(it.input_type))}</span></span>
        </div>
        <button class="history-del" data-history-confirmdel="${it.id}">${esc(t('delete'))}</button>
      </div>`
    )
    .join('');
  root.innerHTML = `
    <div class="history-head">
      <span class="history-head__title">${esc(t('history_recent'))}</span>
      <button class="history-clear" data-action="history-clear">${esc(t('clear_all'))}</button>
    </div>
    <p class="history-sub"><span aria-hidden="true">🔒︎</span>${esc(t('history_stored_local'))}</p>
    ${cards}`;
}

function openHistoryItem(id) {
  const item = window.CP_History && window.CP_History.getHistoryItem(id);
  if (!item) return;
  resultLang = item.language || 'English';
  renderResults(item.full_result, { id: item.id, date_analyzed: item.date_analyzed, checkedSteps: item.checkedSteps || {} });
}
function toggleHistoryDelete(id) {
  const card = document.querySelector('.history-card[data-history="' + id + '"]');
  if (card) card.classList.toggle('is-open-del');
}
function confirmDeleteHistory(id) {
  if (window.confirm(t('remove_one'))) {
    window.CP_History.deleteHistoryItem(id);
    renderHistory();
    updateHistoryBadge();
  }
}
function confirmClearHistory() {
  const n = window.CP_History ? window.CP_History.count() : 0;
  if (!n) return;
  if (window.confirm(t('remove_all').split('{n}').join(n))) {
    window.CP_History.clearAllHistory();
    renderHistory();
    updateHistoryBadge();
  }
}

/* ---------------- dev checklist (passcode-gated) ---------------- */
let logoTaps = 0;
let logoTimer = null;
let devCode = '';

function onLogoTap() {
  logoTaps++;
  clearTimeout(logoTimer);
  logoTimer = setTimeout(() => { logoTaps = 0; }, 1500);
  if (logoTaps >= 5) { logoTaps = 0; openDevPass(); }
}
function openDevPass() {
  devCode = '';
  el('dev-pass').hidden = false;
  el('dev-check').hidden = true;
  el('dev-pass-msg').hidden = true;
  updateDevDots();
  el('dev-overlay').hidden = false;
}
function closeDev() { el('dev-overlay').hidden = true; devCode = ''; }
function updateDevDots() {
  const dots = el('dev-dots').children;
  for (let i = 0; i < dots.length; i++) dots[i].classList.toggle('is-filled', i < devCode.length);
}
function devAddDigit(d) {
  if (devCode.length >= 4) return;
  devCode += d;
  el('dev-pass-msg').hidden = true;
  updateDevDots();
  if (devCode.length === 4) setTimeout(checkDevCode, 150);
}
function devDelDigit() { devCode = devCode.slice(0, -1); updateDevDots(); }
function checkDevCode() {
  if (devCode === '2606') {
    el('dev-pass').hidden = true;
    el('dev-check').hidden = false;
    runDevChecks();
  } else {
    el('dev-pass-msg').hidden = false;
    devCode = '';
    updateDevDots();
    setTimeout(closeDev, 900); // show "Incorrect" then close
  }
}

function devRow(i, label) {
  return `<div class="dev-check-row" data-check="${i}"><span class="dev-check-row__icon dev-check-row__icon--wait">…</span><span class="dev-check-row__label">${esc(label)}</span></div>`;
}
async function checkDemos() {
  for (const dt of ['eviction', 'benefits', 'discharge', 'school', 'utility']) {
    const r = await fetch('/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ demoType: dt }) });
    if (!r.ok) return false;
    const d = await r.json();
    if (!d.document_type) return false;
  }
  return true;
}
async function checkCameraPerm() {
  try {
    if (!navigator.permissions || !navigator.permissions.query) return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    const st = await navigator.permissions.query({ name: 'camera' });
    return st.state === 'granted' || st.state === 'prompt';
  } catch { return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia); }
}
async function runDevChecks() {
  const checks = [
    { label: 'Backend server responding', run: async () => (await fetch('/health')).ok },
    { label: 'Claude API key present (live mode)', run: async () => (await (await fetch('/health')).json()).mode === 'live' },
    { label: 'All 5 demo documents returning', run: checkDemos },
    { label: 'Camera permission available', run: checkCameraPerm },
    { label: 'Language switching (Spanish)', run: async () => !!(STRINGS.es && STRINGS.es.home_headline && STRINGS.es.home_headline !== STRINGS.en.home_headline) },
    { label: '211 resource reachable', run: async () => { const d = await (await fetch('/escalation', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })).json(); return (d.resources || []).some((r) => /211/.test(r.name)); } },
    { label: 'Escalation panel present', run: async () => !!el('escalation') },
    { label: 'History screen accessible', run: async () => !!(window.CP_History && el('screen-history')) },
  ];
  const list = el('dev-check-list');
  list.innerHTML = checks.map((c, i) => devRow(i, c.label)).join('');
  for (let i = 0; i < checks.length; i++) {
    let ok = false;
    try { ok = await checks[i].run(); } catch { ok = false; }
    const icon = list.querySelector('[data-check="' + i + '"] .dev-check-row__icon');
    if (icon) { icon.className = 'dev-check-row__icon dev-check-row__icon--' + (ok ? 'pass' : 'fail'); icon.textContent = ok ? '✓' : '✕'; }
  }
}
function resetDemo() {
  if (window.CP_History) window.CP_History.clearAllHistory();
  setLanguage('en', true);
  updateHistoryBadge();
  closeDev();
  clearProcessing();
  show('home');
}

/* ---------------- camera ---------------- */
let camStream = null;
let camDataUrl = null;

async function openCamera() {
  const modal = el('camera-modal');
  const supported = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia) && window.isSecureContext;
  // No live camera available (e.g. insecure origin) — fall back to the OS picker.
  if (!supported) { el('file-camera').click(); return; }
  modal.hidden = false;
  el('cam-denied').hidden = true;
  el('cam-review').hidden = true;
  el('cam-preview').hidden = true;
  el('cam-live').hidden = false;
  el('cam-video').hidden = false;
  try {
    camStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
    el('cam-video').srcObject = camStream;
  } catch {
    showCameraDenied();
  }
}

function showCameraDenied() {
  stopCamStream();
  el('cam-live').hidden = true;
  el('cam-review').hidden = true;
  el('cam-video').hidden = true;
  el('cam-denied').hidden = false;
}

function capturePhoto() {
  const video = el('cam-video');
  if (!video.videoWidth) return;
  const canvas = el('cam-canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  canvas.getContext('2d').drawImage(video, 0, 0);
  camDataUrl = canvas.toDataURL('image/jpeg', 0.85);
  stopCamStream();
  el('cam-preview').src = camDataUrl;
  el('cam-preview').hidden = false;
  el('cam-video').hidden = true;
  el('cam-live').hidden = true;
  el('cam-review').hidden = false;
}

function retakePhoto() {
  camDataUrl = null;
  el('cam-preview').hidden = true;
  openCamera();
}

function useCapturedPhoto() {
  if (!camDataUrl) return;
  const base64 = camDataUrl.split(',')[1];
  closeCamera();
  analyze({ image: base64, mediaType: 'image/jpeg', inputMethod: 'camera' });
}

function stopCamStream() {
  if (camStream) { camStream.getTracks().forEach((track) => track.stop()); camStream = null; }
}

function closeCamera() {
  stopCamStream();
  el('camera-modal').hidden = true;
  el('cam-preview').hidden = true;
  camDataUrl = null;
}

/* ---------------- events ---------------- */
document.addEventListener('click', (e) => {
  const action = e.target.closest('[data-action]')?.dataset.action;
  const example = e.target.closest('[data-example]')?.dataset.example;
  const tab = e.target.closest('[data-tab]')?.dataset.tab;
  const langCode = e.target.closest('[data-lang-code]')?.dataset.langCode;
  const digit = e.target.closest('[data-digit]')?.dataset.digit;
  const histConfirm = e.target.closest('[data-history-confirmdel]')?.dataset.historyConfirmdel;
  const histReveal = e.target.closest('[data-history-del]')?.dataset.historyDel;
  const histOpen = e.target.closest('[data-history]')?.dataset.history;

  if (digit) { devAddDigit(digit); return; }
  if (langCode) {
    setLanguage(langCode, true);
    closeLangSheet();
    return;
  }
  if (example) {
    // English: instant pre-built demo (free, never fails). Other languages: run the
    // example through live Claude so the content is actually translated, not just the UI.
    const exText = window.CLEARPATH_EXAMPLES && window.CLEARPATH_EXAMPLES[example];
    if (lang === 'en' || !exText) analyze({ demoType: example, inputMethod: 'demo' });
    else analyze({ text: exText, inputMethod: 'text' });
    return;
  }
  if (histConfirm) { confirmDeleteHistory(histConfirm); return; }
  if (histReveal) { toggleHistoryDelete(histReveal); return; }
  if (histOpen) { openHistoryItem(histOpen); return; }
  if (tab) {
    show(tab);
    return;
  }
  switch (action) {
    case 'home': clearProcessing(); show('home'); break;
    case 'text': show('text', 'home'); break;
    case 'photo': openCamera(); break;
    case 'upload': el('file-upload').click(); break;
    case 'cam-capture': capturePhoto(); break;
    case 'cam-use': useCapturedPhoto(); break;
    case 'cam-retake': retakePhoto(); break;
    case 'cam-cancel': closeCamera(); break;
    case 'cam-upload': closeCamera(); el('file-upload').click(); break;
    case 'cam-paste': closeCamera(); show('text', 'home'); break;
    case 'analyze-text': {
      const text = el('text-input').value.trim();
      const location = el('location-input').value.trim();
      if (text) analyze({ text, location, inputMethod: 'text' });
      break;
    }
    case 'escalate': openEscalation(); break;
    case 'close-escalation': el('escalation').hidden = true; break;
    case 'lang': openLangSheet(); break;
    case 'close-lang': closeLangSheet(); break;
    case 'dismiss-legal': el('legal-banner').hidden = true; break;
    case 'history-clear': confirmClearHistory(); break;
    case 'dev-close': closeDev(); break;
    case 'dev-del': devDelDigit(); break;
    case 'dev-rerun': runDevChecks(); break;
    case 'dev-reset': resetDemo(); break;
  }
});

el('file-camera').addEventListener('change', (e) => handleFile(e.target.files[0]));
el('file-upload').addEventListener('change', (e) => handleFile(e.target.files[0]));
el('escalation').addEventListener('click', (e) => { if (e.target.id === 'escalation') e.target.hidden = true; });
el('lang-sheet').addEventListener('click', (e) => { if (e.target.id === 'lang-sheet') e.target.hidden = true; });
el('dev-overlay').addEventListener('click', (e) => { if (e.target.id === 'dev-overlay') closeDev(); });
// Hidden developer access: tap the ClearPath logo 5 times quickly.
const brandEl = document.querySelector('#screen-home .appbar__name');
if (brandEl) brandEl.addEventListener('click', onLogoTap);

/* ---------------- init ---------------- */
function init() {
  let saved = null;
  try { saved = localStorage.getItem(STORAGE_KEY); } catch {}
  const detected = detectDeviceLang();
  const initial = saved && BYCODE[saved] ? saved : detected || 'en';
  buildLangList();
  setLanguage(initial, true);
  show('home');
  updateHistoryBadge();
  maybeShowLegalBanner();
  if (!saved) maybeShowBanner(detected);

  // Deep link: /?example=eviction&lang=es
  const params = new URLSearchParams(location.search);
  const dl = params.get('lang');
  if (dl && BYCODE[dl]) setLanguage(dl, true);
  const ex = params.get('example');
  if (ex && window.CLEARPATH_EXAMPLES && window.CLEARPATH_EXAMPLES[ex]) {
    if (lang === 'en') analyze({ demoType: ex, inputMethod: 'demo' });
    else analyze({ text: window.CLEARPATH_EXAMPLES[ex], inputMethod: 'text' });
  }

  if (location.hash === '#lang') openLangSheet();
}

init();
