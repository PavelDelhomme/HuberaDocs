import { renderPdfBytes, renderHtmlBlob, clearPdfStage } from './pdf-view.js';
import { columnBoard } from './boardLogic.mjs';
import { INBOX_GROUPS, inboxTextareaAttrs, splitRemarks, taskStateLabel } from './inboxLogic.mjs';

const $ = (sel, el = document) => el.querySelector(sel);
const app = $('#app');
const views = ['dash', 'kanban', 'docs', 'reports', 'gantt', 'inbox', 'account'];
const bottomNav = ['dash', 'kanban', 'docs', 'reports'];
const labels = {
  dash: 'Accueil',
  kanban: 'Tâches',
  docs: 'Docs',
  reports: 'Rapports',
  gantt: 'Avance',
  inbox: 'Retours',
  account: 'Compte',
};
const titles = {
  dash: 'Cockpit',
  kanban: 'Tâches',
  docs: 'Docs',
  reports: 'Rapports',
  gantt: 'Avance',
  inbox: 'Retours',
  account: 'Compte',
};
const navIcons = {
  dash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1z"/></svg>',
  kanban: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="6" height="16" rx="1"/><rect x="11" y="4" width="4" height="10" rx="1"/><rect x="17" y="4" width="4" height="13" rx="1"/></svg>',
  docs: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 3h8l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/><path d="M15 3v6h6"/></svg>',
  reports: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 3h8l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/><path d="M9 13h6M9 17h4"/></svg>',
  gantt: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h10M4 12h16M4 18h7"/></svg>',
  inbox: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 5h16v14H4z"/><path d="M8 9h8M8 13h5"/></svg>',
  account: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="3"/><path d="M5 19c1.5-3 4-5 7-5s5.5 2 7 5"/></svg>',
  apps: '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="6" cy="6" r="2"/><circle cx="12" cy="6" r="2"/><circle cx="18" cy="6" r="2"/><circle cx="6" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="18" cy="12" r="2"/><circle cx="6" cy="18" r="2"/><circle cx="12" cy="18" r="2"/><circle cx="18" cy="18" r="2"/></svg>',
};
const suiteLinks = [
  { title: 'Music', slug: 'music' },
  { title: 'Maps', slug: 'maps' },
  { title: 'Fuel', slug: 'fuel' },
  { title: 'Mail', slug: 'mail' },
  { title: 'Drive', slug: 'drive' },
  { title: 'Pass', slug: 'pass' },
  { title: 'Agenda', slug: 'calendar' },
  { title: 'ID', slug: 'id' },
];

function openHuberaApp(slug) {
  const https = `https://${slug}.hubera.cloud`;
  const scheme = `hubera-${slug}://open`;
  let left = false;
  const mark = () => { left = true; };
  document.addEventListener('visibilitychange', mark, { once: true });
  window.addEventListener('pagehide', mark, { once: true });
  try {
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = scheme;
    document.body.appendChild(iframe);
    setTimeout(() => {
      iframe.remove();
      if (!left && document.visibilityState === 'visible') {
        window.open(https, '_blank', 'noopener');
      }
    }, 800);
  } catch {
    window.open(https, '_blank', 'noopener');
  }
}
const hamburgerSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7h16M4 12h16M4 17h16"/></svg>';
const projects = [
  'music', 'maps', 'fuel', 'mail', 'drive', 'photos', 'contacts', 'calendar',
  'notes', 'tasks', 'pass', 'cook', 'id', 'docs', 'admin', 'jobs',
  'stream', 'budget', 'taskflow', 'cms', 'office', 'vtcbuilder',
  'ops', 'platform',
];
const THEME_KEY = 'hubera-docs-theme';
const LAST_APP_KEY = 'hubera-docs-inbox-app';
const DRAFT_KEY = 'hubera-docs-inbox-draft';
const KIND_KEY = 'hubera-docs-inbox-kind';
const FILTER_KEY = 'hubera-docs-inbox-filter';
const TARGETS_KEY = 'hubera-docs-inbox-targets';
const SURFACES = ['api', 'web', 'mobile'];
const SURFACE_LABEL = { api: 'API', web: 'Web', mobile: 'Mobile' };
let route = 'dash';
let openFile = '';
let me = null;
let pendingEmail = '';
let pendingNewTask = false;
let pendingInboxKind = '';

function readLs(k, fallback = '') {
  try { return localStorage.getItem(k) || fallback; } catch { return fallback; }
}
function writeLs(k, v) {
  try { localStorage.setItem(k, v); } catch { /* ignore */ }
}
function persistInboxFields() {
  const apps = document.querySelector('#fb .apps');
  const body = document.querySelector('#fb [name="body"]');
  const kind = document.querySelector('#fb [name="kind"]');
  const targets = document.querySelector('#fb .targets');
  if (apps) writeLs(LAST_APP_KEY, apps.dataset.value || 'docs');
  if (body) writeLs(DRAFT_KEY, body.value);
  if (kind) writeLs(KIND_KEY, kind.value);
  if (targets) writeLs(TARGETS_KEY, targets.dataset.value || '');
}

function parseApps(raw) {
  const parts = String(raw || '')
    .split(/\s*[,·+]\s*|\s+et\s+/)
    .map((item) => String(item || '').trim().toLowerCase())
    .filter(Boolean);
  const ordered = projects.filter((p) => parts.includes(p));
  return ordered.length ? ordered : ['docs'];
}

function appChips(selected) {
  const on = new Set(parseApps(selected));
  const buttons = projects
    .map(
      (p) =>
        `<button type="button" class="chip${on.has(p) ? ' on' : ''}" data-app="${p}" aria-pressed="${on.has(p) ? 'true' : 'false'}">${on.has(p) ? '✓ ' : ''}${p}</button>`,
    )
    .join('');
  return `<div class="chips apps" data-value="${[...on].join(',')}">${buttons}</div>`;
}

function bindApps(root) {
  const row = root.querySelector('.apps');
  if (!row) return;
  const paint = () => {
    row.querySelectorAll('[data-app]').forEach((b) => {
      const on = b.classList.contains('on');
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      b.textContent = `${on ? '✓ ' : ''}${b.dataset.app}`;
    });
    const picked = [...row.querySelectorAll('[data-app].on')].map((b) => b.dataset.app);
    row.dataset.value = parseApps(picked.join(',')).join(',');
    if (row.closest('#fb')) persistInboxFields();
  };
  /** Clic court = une seule app. Appui long / clic droit = ajouter / retirer. */
  row.querySelectorAll('[data-app]').forEach((btn) => {
    let timer = 0;
    let longFired = false;
    const selectOnly = () => {
      const app = btn.dataset.app;
      row.querySelectorAll('[data-app]').forEach((b) => {
        b.classList.toggle('on', b.dataset.app === app);
      });
      paint();
    };
    const toggleMulti = () => {
      const turningOff = btn.classList.contains('on');
      const onNow = [...row.querySelectorAll('[data-app].on')];
      if (turningOff && onNow.length <= 1) return;
      btn.classList.toggle('on', !turningOff);
      paint();
    };
    btn.onpointerdown = () => {
      longFired = false;
      clearTimeout(timer);
      timer = window.setTimeout(() => {
        longFired = true;
        toggleMulti();
      }, 420);
    };
    const cancelLong = () => clearTimeout(timer);
    btn.onpointerup = cancelLong;
    btn.onpointerleave = cancelLong;
    btn.onpointercancel = cancelLong;
    btn.onclick = (e) => {
      e.preventDefault();
      if (longFired) {
        longFired = false;
        return;
      }
      selectOnly();
    };
    btn.oncontextmenu = (e) => {
      e.preventDefault();
      toggleMulti();
    };
  });
}

function readApps(root) {
  const row = root.querySelector('.apps');
  return parseApps(row?.dataset.value || '');
}

function parseTargets(raw) {
  const list = Array.isArray(raw) ? raw : String(raw || '').split(/[,+\s]+/);
  const want = new Set(list.map((item) => String(item || '').trim().toLowerCase()));
  return SURFACES.filter((k) => want.has(k));
}

function fmtStamp(ms) {
  const n = Number(ms);
  if (!Number.isFinite(n) || n <= 0) return '';
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(n));
}

function stampLine(created, updated) {
  const c = fmtStamp(created);
  const u = fmtStamp(updated || created);
  if (!c) return '';
  return `créé le ${c} · modifié le ${u}`;
}

function targetLine(raw) {
  return parseTargets(raw).map((k) => SURFACE_LABEL[k]).join(' · ');
}

function targetChips(selected, opts) {
  const on = new Set(parseTargets(selected));
  const keep = opts && opts.keepOne ? '1' : '';
  const buttons = SURFACES.map(
    (k) =>
      `<button type="button" class="chip${on.has(k) ? ' on' : ''}" data-target="${k}" aria-pressed="${on.has(k) ? 'true' : 'false'}">${SURFACE_LABEL[k]}</button>`,
  ).join('');
  return `<div class="chips targets" data-keep="${keep}" data-value="${[...on].join(',')}">${buttons}</div>`;
}

function bindTargets(root, onChange) {
  const row = root.querySelector('.targets');
  if (!row) return;
  row.querySelectorAll('[data-target]').forEach((btn) => {
    btn.onclick = () => {
      const turningOff = btn.classList.contains('on');
      const onNow = [...row.querySelectorAll('[data-target].on')];
      if (turningOff && row.dataset.keep === '1' && onNow.length <= 1) return;
      const on = !turningOff;
      btn.classList.toggle('on', on);
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      const picked = [...row.querySelectorAll('[data-target].on')].map((b) => b.dataset.target);
      row.dataset.value = parseTargets(picked).join(',');
      if (row.closest('#fb')) persistInboxFields();
      if (typeof onChange === 'function') onChange(parseTargets(picked));
    };
  });
}

function readTargets(root) {
  const row = root.querySelector('.targets');
  return parseTargets(row?.dataset.value || '');
}

function parseHash() {
  const raw = decodeURIComponent((location.hash || '').replace(/^#/, '') || 'dash');
  const slash = raw.indexOf('/');
  if (slash < 0) return { view: raw || 'dash', file: '' };
  return { view: raw.slice(0, slash) || 'dash', file: raw.slice(slash + 1) };
}

function applyHash() {
  const h = parseHash();
  route = views.includes(h.view) ? h.view : 'dash';
  openFile = h.file || '';
}

function go(view, file = '') {
  persistInboxFields();
  route = view;
  openFile = file || '';
  const next = file ? `${view}/${encodeURIComponent(file)}` : view;
  const cur = (location.hash || '').replace(/^#/, '');
  if (cur === next) {
    render();
    return;
  }
  location.hash = next;
}

applyHash();

function themeNow() {
  const t = document.documentElement.getAttribute('data-theme');
  return t === 'dark' ? 'dark' : 'light';
}

function applyTheme(mode) {
  const t = mode === 'dark' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', t);
  try { localStorage.setItem(THEME_KEY, t); } catch { /* ignore */ }
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = t === 'dark' ? '#11181e' : '#ffffff';
  document.querySelectorAll('#themeBtn').forEach((b) => {
    b.textContent = t === 'dark' ? 'Mode clair' : 'Mode sombre';
  });
}

function toggleTheme() {
  applyTheme(themeNow() === 'dark' ? 'light' : 'dark');
}

function themeBtnHtml() {
  return `<button type="button" class="theme-toggle" id="themeBtn">${themeNow() === 'dark' ? 'Mode clair' : 'Mode sombre'}</button>`;
}

function bindThemeBtn() {
  $('#themeBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    toggleTheme();
  });
}

applyTheme(themeNow());

async function api(path, opts = {}) {
  const r = await fetch(path, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
    ...opts,
  });
  const authCall = path.startsWith('/api/auth/');
  if (r.status === 401 && !authCall) {
    me = null;
    throw new Error('auth');
  }
  if (opts.raw) return r;
  return r.json().catch(() => ({}));
}

function shell(inner) {
  const hideBottom = route === 'account';
  const hideFab = route === 'account';
  return `
    <aside class="drawer" id="drawer">
      <button type="button" class="drawer-scrim" data-close-drawer aria-label="Fermer le menu"></button>
      <div class="drawer-sheet" role="dialog" aria-label="Menu">
        <div class="drawer-accent"></div>
        <div class="drawer-head">
          <strong>Hubera Cockpit</strong>
          <small>${esc(me?.email || 'Compte Hubera')}</small>
        </div>
        <button type="button" data-go="dash" class="drawer-item ${route === 'dash' ? 'on' : ''}">${navIcons.dash}<span>Cahier unique</span></button>
        <button type="button" data-go="kanban" class="drawer-item ${route === 'kanban' ? 'on' : ''}">${navIcons.kanban}<span>Kanban</span></button>
        <button type="button" data-go="docs" class="drawer-item ${route === 'docs' ? 'on' : ''}">${navIcons.docs}<span>Docs</span></button>
        <button type="button" data-go="reports" class="drawer-item ${route === 'reports' ? 'on' : ''}">${navIcons.reports}<span>Rapports PDF</span></button>
        <button type="button" data-go="gantt" class="drawer-item ${route === 'gantt' ? 'on' : ''}">${navIcons.gantt}<span>Gantt</span></button>
        <button type="button" data-go="inbox" class="drawer-item ${route === 'inbox' ? 'on' : ''}">${navIcons.inbox}<span>Retours</span></button>
        <button type="button" data-go="account" class="drawer-item ${route === 'account' ? 'on' : ''}">${navIcons.account}<span>Compte / MAJ</span></button>
        <button type="button" data-go="report" class="drawer-item"><span>Signaler un problème</span></button>
      </div>
    </aside>
    <header class="top">
      <button type="button" class="icon-btn" id="menuBtn" aria-label="Menu">${hamburgerSvg}</button>
      <strong class="top-title">${esc(titles[route] || 'Docs')}</strong>
      <button type="button" class="icon-btn" id="waffleBtn" aria-label="Apps Hubera">${navIcons.apps || navIcons.dash}</button>
      <button type="button" class="avatar" id="accountBtn" aria-label="Compte">${navIcons.account}</button>
    </header>
    <div class="waffle" id="waffle" hidden>
      <button type="button" class="waffle-scrim" data-close-waffle aria-label="Fermer"></button>
      <div class="waffle-sheet" role="dialog" aria-label="Apps Hubera">
        <strong>Apps Hubera</strong>
        <div class="drawer-suite">
          ${suiteLinks.map((a) => `<button type="button" class="suite-chip" data-hubera-slug="${a.slug}">${esc(a.title)}</button>`).join('')}
        </div>
      </div>
    </div>
    <div class="view">${inner}</div>
    ${hideBottom ? '' : `<nav class="bottom">
      ${bottomNav.map((v) => `<button type="button" data-go="${v}" class="${v === route ? 'on' : ''}">${navIcons[v] || ''}<span>${labels[v]}</span></button>`).join('')}
    </nav>`}
    ${hideFab ? '' : `<button type="button" class="fab" id="fabBtn" aria-label="Ajouter">+</button>
    <div class="fab-menu" id="fabMenu">
      <button type="button" data-fab="task">Tâche</button>
      <button type="button" data-fab="retour">Retour</button>
      <button type="button" data-fab="note">Note</button>
    </div>`}`;
}

function closeDrawer() {
  $('#drawer')?.classList.remove('is-open');
}

function openAnonymousReport() {
  document.getElementById('anonReport')?.remove();
  const el = document.createElement('div');
  el.id = 'anonReport';
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-label', 'Signaler un problème');
  el.style.cssText = 'position:fixed;inset:0;z-index:90;background:rgba(0,0,0,.45);display:flex;align-items:flex-end;justify-content:center';
  el.innerHTML = `
    <div id="anonReportSheet" style="background:var(--surface,#fff);color:inherit;width:min(480px,100%);padding:20px 16px 28px;border-radius:16px 16px 0 0">
      <strong>Signaler un problème</strong>
      <p>Trace anonyme · Docs. Aucune adresse, aucun secret.</p>
      <p id="anonReportStatus"></p>
      <button type="button" id="anonReportSave">Enregistrer la trace</button>
      <button type="button" id="anonReportClose">Fermer</button>
    </div>`;
  document.body.appendChild(el);
  el.addEventListener('click', (e) => e.stopPropagation());
  el.querySelector('#anonReportClose').onclick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    el.remove();
  };
  el.querySelector('#anonReportSave').onclick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    try { localStorage.setItem('hubera-anon-trace', 'app=docs'); } catch { /* ignore */ }
    const s = el.querySelector('#anonReportStatus');
    if (s) s.textContent = 'Trace anonyme enregistrée';
  };
}

function closeFabMenu() {
  $('#fabMenu')?.classList.remove('is-open');
}

function bindShell() {
  $('#menuBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    closeFabMenu();
    $('#drawer')?.classList.toggle('is-open');
  });
  document.querySelectorAll('[data-close-drawer]').forEach((el) => {
    el.onclick = (e) => {
      e.preventDefault();
      closeDrawer();
    };
  });
  $('.drawer-sheet')?.addEventListener('click', (e) => e.stopPropagation());
  $('#accountBtn')?.addEventListener('click', () => go('account'));
  const waffle = $('#waffle');
  $('#waffleBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    waffle?.removeAttribute('hidden');
  });
  document.querySelectorAll('[data-close-waffle]').forEach((el) => {
    el.onclick = () => waffle?.setAttribute('hidden', '');
  });
  document.querySelectorAll('[data-go]').forEach((b) => {
    if (b.tagName === 'A') return;
    b.onclick = (e) => {
      if (b.dataset.go === 'report') {
        e.preventDefault();
        e.stopPropagation();
        closeDrawer();
        closeFabMenu();
        openAnonymousReport();
        return;
      }
      closeDrawer();
      closeFabMenu();
      go(b.dataset.go);
    };
  });
  document.querySelectorAll('[data-hubera-slug]').forEach((b) => {
    b.onclick = (e) => {
      e.preventDefault();
      persistInboxFields();
      closeDrawer();
      openHuberaApp(b.dataset.huberaSlug);
    };
  });
  $('#fabBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    closeDrawer();
    $('#fabMenu')?.classList.toggle('is-open');
  });
  $('#fabMenu')?.addEventListener('click', (e) => {
    e.stopPropagation();
    const btn = e.target.closest('[data-fab]');
    if (!btn) return;
    closeFabMenu();
    const k = btn.dataset.fab;
    if (k === 'task') {
      pendingNewTask = true;
      if (route === 'kanban') {
        openNewTask();
        pendingNewTask = false;
      } else {
        go('kanban');
      }
      return;
    }
    if (k === 'retour' || k === 'note') {
      writeLs(KIND_KEY, k);
      pendingInboxKind = k;
      go('inbox');
    }
  });
  bindThemeBtn();
}

function setLoginErr(form, msg) {
  let errEl = form.querySelector('.err');
  if (!msg) {
    errEl?.remove();
    return;
  }
  if (!errEl) {
    errEl = document.createElement('p');
    errEl.className = 'err';
    form.appendChild(errEl);
  }
  errEl.textContent = msg;
}

function bindDevicePicker() {
  document.querySelectorAll('[data-sso]').forEach((btn) => {
    btn.onclick = () => {
      const email = btn.getAttribute('data-sso') || '';
      pendingEmail = email;
      if (nativeSso(email)) return;
      document.querySelector('.cred')?.removeAttribute('hidden');
      const input = $('#docs-email');
      if (input) input.value = email;
      $('#docs-password')?.focus();
    };
  });
  $('#ssoOther')?.addEventListener('click', () => {
    document.querySelector('.cred')?.removeAttribute('hidden');
    const input = $('#docs-email');
    if (input) input.value = '';
    input?.focus();
  });
}

function bindLoginForm(form, twofa) {
  form.onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const btn = form.querySelector('button[type="submit"]');
    if (btn) btn.disabled = true;
    try {
      if (twofa) {
        const j = await api('/api/auth/login/2fa', {
          method: 'POST',
          body: JSON.stringify({ email: pendingEmail, code: fd.get('code') }),
        });
        if (!j.ok) {
          setLoginErr(form, 'Code refusé.');
          return;
        }
        me = { email: j.email };
        return render();
      }
      pendingEmail = String(fd.get('email') || '').trim().toLowerCase();
      const j = await api('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: pendingEmail, password: fd.get('password') }),
      });
      if (j.requires_2fa) return loginView('', true);
      if (j.error === 'allowlist') {
        setLoginErr(form, 'Cet e-mail n’est pas sur la liste Docs (compte admin Paul).');
        return;
      }
      if (j.error === 'rate') {
        setLoginErr(form, 'Trop d’essais — attends une minute.');
        return;
      }
      if (!j.ok) {
        setLoginErr(form, 'E-mail ou mot de passe Hubera ID refusé. Même compte que Music / Admin.');
        return;
      }
      me = { email: j.email };
      render();
    } catch {
      setLoginErr(form, twofa ? 'Code invalide.' : 'Hubera ID injoignable. Réessaie.');
    } finally {
      if (btn) btn.disabled = false;
    }
  };
}

function avatarColor(email) {
  const palette = ['#1A73E8', '#188038', '#E37400', '#9334E6', '#007B83', '#C5221F', '#1967D2', '#0D7377'];
  let hash = 0;
  const key = String(email || '').toLowerCase();
  for (let i = 0; i < key.length; i++) hash = (Math.imul(hash, 31) + key.charCodeAt(i)) >>> 0;
  return palette[hash % palette.length];
}

function deviceAccounts() {
  const raw = window.__huberaDeviceAccounts;
  if (!Array.isArray(raw)) return [];
  return raw
    .map((e) => (typeof e === 'string' ? e : e?.email || ''))
    .map((e) => String(e).trim().toLowerCase())
    .filter(Boolean);
}

function nativeSso(email) {
  try {
    if (window.HuberaId && typeof window.HuberaId.postMessage === 'function') {
      window.HuberaId.postMessage(email);
      return true;
    }
  } catch {
    /* hors app Android */
  }
  return false;
}

window.__huberaDeviceAccountsReady = function () {
  if (!me) loginView();
};

function loginView(err = '', twofa = false) {
  const existing = $('form.login');
  if (existing && Boolean(existing.dataset.twofa) === twofa) {
    setLoginErr(existing, err);
    bindLoginForm(existing, twofa);
    bindDevicePicker();
    return;
  }
  const keepEmail = esc(pendingEmail || $('input[name="email"]')?.value || '');
  const accounts = deviceAccounts();
  const picker = !twofa && accounts.length
    ? `<div class="sso-picker">
        <p class="lead">Choisir un compte</p>
        ${accounts.map((e) => {
          const local = String(e).split('@')[0] || e;
          const title = local ? local.charAt(0).toUpperCase() + local.slice(1) : e;
          const initial = (title[0] || '?').toUpperCase();
          return `<button type="button" class="sso-btn" data-sso="${esc(e)}"><span class="sso-avatar" style="background:${avatarColor(e)}">${esc(initial)}</span><span class="sso-meta"><b>${esc(title)}</b><small>${esc(e)}</small></span></button>`;
        }).join('')}
        <button type="button" class="sso-other" id="ssoOther"><span class="sso-avatar sso-avatar-add">+</span><span>Ajouter un compte</span></button>
      </div>`
    : '';
  app.innerHTML = twofa
    ? `<div class="theme-bar">${themeBtnHtml()}</div>
      <form class="login card" data-twofa="1" autocomplete="on">
        <img class="login-logo" src="/favicon.svg" width="56" height="56" alt="" />
        <h1>Code 2FA</h1>
        <label for="docs-code">Code</label>
        <input id="docs-code" name="code" inputmode="numeric" autocomplete="one-time-code" placeholder="123456" required autofocus />
        <button class="primary" type="submit">Valider</button>
        ${err ? `<p class="err">${esc(err)}</p>` : ''}
      </form>`
    : `<div class="theme-bar">${themeBtnHtml()}</div>
      <form class="login card" autocomplete="on">
        <img class="login-logo" src="/favicon.svg" width="56" height="56" alt="" />
        <h1>Hubera Cockpit</h1>
        ${picker}
        <div class="cred" ${accounts.length && !twofa ? 'hidden' : ''}>
        <label for="docs-email">E-mail</label>
        <input id="docs-email" name="email" type="email" autocomplete="username" autocapitalize="none" spellcheck="false" inputmode="email" placeholder="e-mail" ${accounts.length ? '' : 'required'} value="${accounts.length ? '' : keepEmail}" />
        <label for="docs-password">Mot de passe Hubera ID</label>
        <input id="docs-password" name="password" type="password" autocomplete="current-password" placeholder="mot de passe" ${accounts.length ? '' : 'required'} />
        <button class="primary" type="submit">Entrer</button>
        </div>
        ${err ? `<p class="err">${esc(err)}</p>` : ''}
      </form>`;
  bindLoginForm($('form.login'), twofa);
  bindDevicePicker();
  bindThemeBtn();
  queueMicrotask(() => {
    const el = twofa ? $('#docs-code') : keepEmail ? $('#docs-password') : $('#docs-email');
    el?.focus();
  });
}

async function viewDash() {
  const d = await api('/api/dashboard');
  const count = (id) => d.byCol.find((x) => x.column_id === id)?.c || 0;
  app.innerHTML = shell(`
    <p class="lead">${esc(d.subtitle || `Cockpit de ${me?.email || 'Paul'} — un seul endroit pour l’état, les tâches, les docs et les PDF.`)}</p>
    <div class="grid">
      <div class="card tap" data-go="kanban"><b>${count('todo')}</b><span>À faire</span></div>
      <div class="card tap" data-go="kanban"><b>${count('doing')}</b><span>En cours</span></div>
      <div class="card tap" data-go="kanban"><b>${count('done')}</b><span>Faits</span></div>
      <div class="card tap" data-go="inbox"><b>${d.remarks}</b><span>Notes / retours</span></div>
    </div>
    <h2>Labo DA</h2>
    <ul class="list">
      <li><a href="/labo/labo-da-vague1.html" target="_blank" rel="noopener">Vague 1 — Music Fuel Drive Mail Contacts Maps Photos</a><div class="lead">Keep / Gmail dense / Maps plein écran. Cases « vue validée ».</div></li>
      <li><a href="/labo/labo-da-vague2.html" target="_blank" rel="noopener">Vague 2 — Calendar Pass Jobs Budget Tasks Stream Office Notes Cook Docs Press ID</a><div class="lead">Même chrome. Pas de remplacement UI prod tant que tu n’as pas coché.</div></li>
    </ul>
    <h2>Tes derniers rapports / mails</h2>
    <ul class="list">${d.recentReports.map((r) => `<li class="tap" data-go="reports" data-f="${esc(r.filename || '')}"><strong>${esc(r.title)}</strong><br><small>${(r.sent_at || '').slice(0, 16)} · ${esc(r.kind)}</small><div class="lead">${esc(r.summary || '')}</div></li>`).join('') || '<li>Pas encore de PDF</li>'}</ul>
    <h2>Tâches récentes</h2>
    <ul class="list">${d.recentTasks.map((t) => `<li class="tap" data-go="kanban"><b class="prio">${clampPrio(t.priority)}</b>${esc(t.title)}<small> ${esc(t.project)} · ${esc(t.column_id)}</small><div class="lead">${esc(stampLine(t.created_at, t.updated_at))}${targetLine(t.targets) ? ` · ${esc(targetLine(t.targets))}` : ''}</div></li>`).join('')}</ul>
  `);
  app.querySelectorAll('[data-go]').forEach((el) => {
    el.onclick = () => {
      go(el.dataset.go, el.dataset.f || '');
    };
  });
}

let kanbanCols = [];
let kanbanTasks = [];

function taskById(id) {
  return kanbanTasks.find((t) => t.id === id) || null;
}

function childTasks(parentId) {
  if (!parentId) return [];
  return kanbanTasks
    .filter((t) => t.parent_id === parentId)
    .sort((a, b) => (a.created_at || 0) - (b.created_at || 0));
}

function subtaskListHtml(parentId) {
  const kids = childTasks(parentId);
  if (!kids.length) return '<p class="meta">Aucune sous-tâche pour l’instant.</p>';
  return `<ul class="subtasks">${kids
    .map((t) => {
      const cible = targetLine(t.targets);
      return `<li class="subtask" data-sub="${esc(t.id)}">
        <b class="prio">${clampPrio(t.priority)}</b>${esc(t.title)}
        <small>${esc(stampLine(t.created_at, t.updated_at))}${cible ? ` · ${esc(cible)}` : ''}</small>
      </li>`;
    })
    .join('')}</ul>`;
}

function bindSubtaskOpens(root, onMissing) {
  root.querySelectorAll('[data-sub]').forEach((el) => {
    el.onclick = (e) => {
      e.stopPropagation();
      const child = taskById(el.dataset.sub);
      if (child) openTaskCard(child);
      else if (onMissing) onMissing();
    };
  });
}

async function refreshTasks() {
  const { tasks } = await api('/api/tasks');
  kanbanTasks = tasks || [];
  return kanbanTasks;
}

function colOptions(selected) {
  return kanbanCols
    .map((c) => `<option value="${esc(c.id)}" ${c.id === selected ? 'selected' : ''}>${esc(c.label)}</option>`)
    .join('');
}

function clampPrio(value, fallback = 2) {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n)) return fallback;
  if (n < 1) return 1;
  if (n > 5) return 5;
  return n;
}

function clampCrit(value, fallback = 1) {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n)) return fallback;
  if (n < 1) return 1;
  if (n > 5) return 5;
  return n;
}

function criticalityPicker(selected) {
  const n = clampCrit(selected, 1);
  const chips = [1, 2, 3, 4, 5]
    .map(
      (i) =>
        `<button type="button" class="chip${i === n ? ' on' : ''}" data-crit="${i}" aria-pressed="${i === n ? 'true' : 'false'}">${i}</button>`,
    )
    .join('');
  return `<div class="crit-row" data-value="${n}"><span class="meta">Criticité</span>${chips}<span class="meta">5 la plus grave, 1 la moins grave</span></div>`;
}

function bindCriticality(root) {
  const row = root?.querySelector?.('.crit-row');
  if (!row) return;
  row.querySelectorAll('[data-crit]').forEach((btn) => {
    btn.onclick = () => {
      const v = clampCrit(btn.dataset.crit, 1);
      row.dataset.value = String(v);
      row.querySelectorAll('[data-crit]').forEach((b) => {
        const on = Number(b.dataset.crit) === v;
        b.classList.toggle('on', on);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
    };
  });
}

function readCriticality(root, fallback = 1) {
  const row = root?.querySelector?.('.crit-row');
  return clampCrit(row?.dataset.value, fallback);
}

function priorityPicker(selected) {
  const n = clampPrio(selected);
  const chips = [1, 2, 3, 4, 5]
    .map(
      (i) =>
        `<button type="button" class="chip${i === n ? ' on' : ''}" data-prio="${i}" aria-pressed="${i === n ? 'true' : 'false'}">${i}</button>`,
    )
    .join('');
  return `<div class="prio-row" data-value="${n}">${chips}<span class="meta">1 la plus importante</span></div>`;
}

function bindPriority(root) {
  const row = root.querySelector('.prio-row');
  if (!row) return;
  row.querySelectorAll('[data-prio]').forEach((btn) => {
    btn.onclick = () => {
      const v = clampPrio(btn.dataset.prio);
      row.dataset.value = String(v);
      row.querySelectorAll('[data-prio]').forEach((b) => {
        const on = Number(b.dataset.prio) === v;
        b.classList.toggle('on', on);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
    };
  });
}

function readPriorityIn(root, fallback = 5) {
  const row = root?.querySelector?.('.prio-row');
  return clampPrio(row?.dataset.value, fallback);
}

function readPriority(fallback = 2) {
  return readPriorityIn(document.querySelector('#modal'), fallback);
}

function closeModal() {
  $('#modal')?.remove();
}

function openModal(html) {
  closeModal();
  const wrap = document.createElement('div');
  wrap.id = 'modal';
  wrap.className = 'modal-back';
  wrap.innerHTML = `<div class="modal-card" role="dialog" aria-modal="true">${html}</div>`;
  wrap.addEventListener('click', (e) => {
    if (e.target === wrap) closeModal();
  });
  document.body.appendChild(wrap);
}

async function viewKanban() {
  const [{ tasks }, colsRes] = await Promise.all([api('/api/tasks'), api('/api/columns')]);
  kanbanTasks = tasks || [];
  kanbanCols = colsRes.columns?.length
    ? colsRes.columns
    : [
        { id: 'todo', label: 'À faire' },
        { id: 'doing', label: 'En cours' },
        { id: 'done', label: 'Fait' },
        { id: 'later', label: 'Plus tard' },
      ];
  const parentElsewhere = (t) => {
    const parent = t.parent_id ? taskById(t.parent_id) : null;
    if (!parent || parent.column_id === t.column_id) return '';
    return `<small>Sous ${esc(parent.title)}</small>`;
  };
  const nestedHtml = (node) => {
    const t = node.task;
    const cible = targetLine(t.targets);
    const inner = (node.children || []).map(nestedHtml).join('');
    return `<div class="subtask" data-id="${esc(t.id)}">
      <b class="prio">${clampPrio(t.priority)}</b>${esc(t.title)}
      <small>${esc(stampLine(t.created_at, t.updated_at))}${cible ? ` · ${esc(cible)}` : ''}</small>
      ${inner}
    </div>`;
  };
  const cell = (id) =>
    columnBoard(kanbanTasks, id)
      .map((node) => {
        const t = node.task;
        const cible = targetLine(t.targets);
        const kids = (node.children || []).map(nestedHtml).join('');
        return `<div class="task p${clampPrio(t.priority)}" data-id="${t.id}">
            <b class="prio">${clampPrio(t.priority)}</b>${esc(t.title)}<small>${esc(t.project)} · ${esc(t.category)}</small>
            ${t.tag ? `<small>Tag ${esc(t.tag)}</small>` : ''}
            ${parentElsewhere(t)}
            <small class="when">${esc(stampLine(t.created_at, t.updated_at))}${cible ? ` · ${esc(cible)}` : ''}</small>
            ${kids}
          </div>`;
      })
      .join('');
  app.innerHTML = shell(`
    <p class="lead">Colonnes À faire, En cours, Fait. Une sous-tâche reste dans sa colonne, groupée sous son parent. La fiche permet d’en ajouter.</p>
    <div class="kanban">${kanbanCols
      .map((c) => `<div class="col" data-col="${esc(c.id)}"><h3>${esc(c.label)}</h3>${cell(c.id)}</div>`)
      .join('')}
      <button type="button" class="col col-add" id="addCol">+ Colonne</button>
    </div>
  `);
  const byId = Object.fromEntries(kanbanTasks.map((t) => [t.id, t]));
  app.querySelectorAll('.task').forEach((el) => {
    el.onclick = () => openTaskCard(byId[el.dataset.id]);
  });
  app.querySelectorAll('.task .subtask').forEach((el) => {
    el.onclick = (e) => {
      e.stopPropagation();
      const child = byId[el.dataset.id];
      if (child) openTaskCard(child);
    };
  });
  $('#addCol').onclick = () => openNewColumn();
  if (pendingNewTask) {
    pendingNewTask = false;
    openNewTask();
  }
}

function openTaskCard(t) {
  const parent = t.parent_id ? taskById(t.parent_id) : null;
  const cible = targetLine(t.targets);
  openModal(`
    <h2>${esc(t.title)}</h2>
    ${parent ? `<p class="meta">Sous-tâche de <button type="button" class="linkish" id="tparent">${esc(parent.title)}</button></p>` : ''}
    <p class="meta">${esc(t.project)} · ${esc(t.category)}</p>
    <p class="meta">${esc(stampLine(t.created_at, t.updated_at))}${cible ? ` · ${esc(cible)}` : ''}</p>
    <label>Priorité</label>
    ${priorityPicker(t.priority)}
    <label>Cible</label>
    ${targetChips(t.targets, { keepOne: true })}
    <p class="lead">API, web ou mobile. Au moins une reste active.</p>
    <div class="lead" id="tbody-ro">${esc(t.body || 'Pas encore de détail.')}</div>
    <h3>Sous-tâches</h3>
    ${subtaskListHtml(t.id)}
    <div class="modal-actions">
      <button class="primary" type="button" id="tsub">Sous-tâche</button>
      <button class="primary" type="button" id="tedit">Modifier</button>
      <button class="ghost" type="button" id="tclose">Fermer</button>
    </div>
  `);
  bindPriority($('#modal'));
  bindTargets($('#modal'), async (picked) => {
    const prev = parseTargets(t.targets).join(',');
    if (!picked.length || picked.join(',') === prev) return;
    await api('/api/tasks/' + t.id, {
      method: 'PATCH',
      body: JSON.stringify({ targets: picked }),
    });
    await refreshTasks();
    const fresh = taskById(t.id);
    if (fresh) openTaskCard(fresh);
  });
  bindSubtaskOpens($('#modal'));
  const row = $('#modal .prio-row');
  if (row) {
    row.querySelectorAll('[data-prio]').forEach((btn) => {
      const pick = btn.onclick;
      btn.onclick = async () => {
        pick();
        const priority = readPriority(t.priority);
        if (priority === clampPrio(t.priority)) return;
        await api('/api/tasks/' + t.id, {
          method: 'PATCH',
          body: JSON.stringify({ priority }),
        });
        await refreshTasks();
        const fresh = taskById(t.id);
        if (fresh) openTaskCard(fresh);
      };
    });
  }
  if (parent) {
    $('#tparent').onclick = () => openTaskCard(parent);
  }
  $('#tclose').onclick = () => {
    closeModal();
    viewKanban();
  };
  $('#tedit').onclick = () => openTaskEdit(t);
  $('#tsub').onclick = () => openSubtaskForm(t);
}

function openTaskEdit(t) {
  openModal(`
    <h2>Modifier la carte</h2>
    <label>Titre</label>
    <input id="ttitle" value="${esc(t.title)}" />
    <label>Détail</label>
    <textarea id="tbody" rows="6">${esc(t.body || '')}</textarea>
    <label>Priorité</label>
    ${priorityPicker(t.priority)}
    <label>Cible</label>
    ${targetChips(t.targets, { keepOne: true })}
    <p class="lead">API, web ou mobile. Au moins une reste active.</p>
    <p class="meta">${esc(stampLine(t.created_at, t.updated_at))}</p>
    <label>Colonne</label>
    <select id="tcol">${colOptions(t.column_id)}</select>
    <label>Projet</label>
    <select id="tproj">${projects.map((p) => `<option ${p === t.project ? 'selected' : ''}>${p}</option>`).join('')}</select>
    <div class="modal-actions">
      <button class="primary" type="button" id="tsave">Enregistrer</button>
      <button class="ghost" type="button" id="tclose">Annuler</button>
    </div>
  `);
  bindPriority($('#modal'));
  bindTargets($('#modal'));
  $('#tclose').onclick = () => openTaskCard(t);
  $('#tsave').onclick = async () => {
    const title = ($('#ttitle').value || '').trim();
    if (!title) return;
    const targets = readTargets($('#modal'));
    const payload = {
      title,
      body: $('#tbody').value,
      column_id: $('#tcol').value,
      project: $('#tproj').value,
      priority: readPriority(t.priority),
    };
    if (targets.length) payload.targets = targets;
    await api('/api/tasks/' + t.id, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    await refreshTasks();
    const fresh = taskById(t.id);
    if (fresh) openTaskCard(fresh);
    else viewKanban();
  };
}

function openSubtaskForm(parent, onDone) {
  const back = async () => {
    await refreshTasks();
    if (onDone) onDone();
    else {
      const fresh = taskById(parent.id);
      if (fresh) openTaskCard(fresh);
      else closeModal();
    }
  };
  openModal(`
    <h2>Sous-tâche</h2>
    <p class="meta">De ${esc(parent.title)}</p>
    <label>Titre</label>
    <input id="stitle" placeholder="Titre" />
    <label>Détail</label>
    <textarea id="sbody" rows="4" placeholder="Détail (optionnel)"></textarea>
    <label>Priorité</label>
    ${priorityPicker(2)}
    <label>Colonne</label>
    <select id="scol">${colOptions(parent.column_id || kanbanCols[0]?.id || 'todo')}</select>
    <label>Cible</label>
    ${targetChips(parent.targets)}
    <p class="lead">API, web, mobile, ou une combinaison.</p>
    <p class="err" id="serr" hidden></p>
    <div class="modal-actions">
      <button class="primary" type="button" id="ssave">Créer</button>
      <button class="ghost" type="button" id="sclose">Annuler</button>
    </div>
  `);
  bindPriority($('#modal'));
  bindTargets($('#modal'));
  queueMicrotask(() => $('#stitle')?.focus());
  $('#sclose').onclick = () => back();
  $('#ssave').onclick = async () => {
    const title = ($('#stitle').value || '').trim();
    const targets = readTargets($('#modal'));
    const err = $('#serr');
    if (!title) return;
    if (!targets.length) {
      if (err) {
        err.hidden = false;
        err.textContent = 'Choisis au moins une cible : API, web ou mobile.';
      }
      return;
    }
    if (err) err.hidden = true;
    const created = await api('/api/tasks', {
      method: 'POST',
      body: JSON.stringify({
        title,
        body: $('#sbody').value,
        project: parent.project || 'docs',
        category: parent.category || 'feature',
        column_id: $('#scol').value,
        priority: readPriority(2),
        targets,
        parent_id: parent.id,
      }),
    });
    if (created?.error) {
      if (err) {
        err.hidden = false;
        err.textContent = 'La sous-tâche n’a pas été créée.';
      }
      return;
    }
    await back();
  };
}

function openNewTask() {
  const first = kanbanCols[0]?.id || 'todo';
  const lastApp = parseApps(readLs(LAST_APP_KEY, 'docs'))[0] || 'docs';
  openModal(`
    <h2>Nouvelle tâche</h2>
    <input id="ntitle" placeholder="Titre" required />
    <textarea id="nbody" rows="4" placeholder="Détail (optionnel)"></textarea>
    <select id="nproj">${projects.map((p) => `<option ${p === lastApp ? 'selected' : ''}>${p}</option>`).join('')}</select>
    <select id="ncat">${['test','feature','bug','infra','docs','ops'].map((p) => `<option>${p}</option>`).join('')}</select>
    <select id="ncol">${colOptions(first)}</select>
    <input id="ntag" placeholder="Tag (ex. urgent)" maxlength="40" />
    <label>Priorité</label>
    ${priorityPicker(2)}
    <div class="modal-actions">
      <button class="primary" type="button" id="nsave">Créer</button>
      <button class="ghost" type="button" id="nclose">Annuler</button>
    </div>
  `);
  $('#nclose').onclick = closeModal;
  bindPriority($('#modal'));
  queueMicrotask(() => $('#ntitle')?.focus());
  $('#nsave').onclick = async () => {
    const title = ($('#ntitle').value || '').trim();
    if (!title) return;
    writeLs(LAST_APP_KEY, $('#nproj').value);
    await api('/api/tasks', {
      method: 'POST',
      body: JSON.stringify({
        title,
        body: $('#nbody').value,
        project: $('#nproj').value,
        category: $('#ncat').value,
        column_id: $('#ncol').value,
        tag: ($('#ntag').value || '').trim(),
        priority: readPriority(2),
      }),
    });
    closeModal();
    viewKanban();
  };
}

function openNewColumn() {
  openModal(`
    <h2>Nouvelle colonne</h2>
    <input id="clabel" placeholder="Nom de la colonne (ex. Bloqué)" />
    <div class="modal-actions">
      <button class="primary" type="button" id="csave">Ajouter</button>
      <button class="ghost" type="button" id="cclose">Annuler</button>
    </div>
  `);
  $('#cclose').onclick = closeModal;
  queueMicrotask(() => $('#clabel')?.focus());
  $('#csave').onclick = async () => {
    const label = ($('#clabel').value || '').trim();
    if (!label) return;
    await api('/api/columns', { method: 'POST', body: JSON.stringify({ label }) });
    closeModal();
    viewKanban();
  };
}

async function viewDocs() {
  const { files } = await api('/api/docs');
  app.innerHTML = shell(`
    <p class="lead">Fichiers du dépôt. Aperçu rendu, puis Modifier si besoin.</p>
    <input id="q" placeholder="Filtrer un fichier…" />
    <ul class="list" id="fl">${files.map((f) => `<li><a href="#" data-p="${esc(f.path)}">${esc(f.path)}</a></li>`).join('')}</ul>
    <div id="mdToolbar" hidden>
      <div class="chips">
        <button type="button" class="chip on" id="mdPreviewBtn">Aperçu</button>
        <button type="button" class="chip" id="mdEditBtn">Modifier</button>
      </div>
    </div>
    <article class="md-html" id="mdPreview" hidden></article>
    <textarea id="md" class="doc" rows="18" placeholder="Choisis un fichier." hidden></textarea>
    <button class="primary" id="saveMd" type="button" hidden>Enregistrer le .md</button>
  `);
  let current = '';
  let editing = false;
  const refreshList = () => {
    const q = ($('#q').value || '').toLowerCase();
    app.querySelectorAll('#fl li').forEach((li) => {
      li.hidden = q && !li.textContent.toLowerCase().includes(q);
    });
  };
  const showMode = () => {
    const ta = $('#md');
    const prev = $('#mdPreview');
    $('#mdPreviewBtn')?.classList.toggle('on', !editing);
    $('#mdEditBtn')?.classList.toggle('on', editing);
    if (ta) ta.hidden = !editing;
    if (prev) {
      prev.hidden = editing;
      if (!editing) prev.innerHTML = renderMarkdown(ta?.value || '');
    }
    $('#saveMd').hidden = !editing;
  };
  $('#q').oninput = refreshList;
  $('#mdPreviewBtn')?.addEventListener('click', () => { editing = false; showMode(); });
  $('#mdEditBtn')?.addEventListener('click', () => { editing = true; showMode(); });
  app.querySelectorAll('#fl a').forEach((a) => {
    a.onclick = async (e) => {
      e.preventDefault();
      current = a.dataset.p;
      const j = await fetch('/api/docs/file?path=' + encodeURIComponent(current), { credentials: 'include' });
      $('#md').value = await j.text();
      $('#mdToolbar').hidden = false;
      editing = false;
      showMode();
    };
  });
  $('#saveMd').onclick = async () => {
    if (!current) return;
    await api('/api/docs/file', {
      method: 'PUT',
      body: JSON.stringify({ path: current, markdown: $('#md').value }),
    });
    editing = false;
    showMode();
  };
}

async function viewReports() {
  const { reports, files } = await api('/api/reports');
  const names = new Set(reports.map((r) => r.filename).filter(Boolean));
  const orphans = files.filter((f) => !names.has(f.filename));
  const titleOf = (filename) => reports.find((r) => r.filename === filename)?.title || filename;
  app.innerHTML = shell(`
    <p class="lead">PDF et notes markdown de ${esc(me?.email || 'ton compte')} — pas un dump anonyme. Tape un fichier : il s’affiche ici.</p>
    <div class="pdf-layout${openFile ? ' is-open' : ''}" id="pdfLayout">
      <div class="pdf-list" id="pdfList">
        <ul class="list" id="rl">${reports
          .map(
            (r) =>
              `<li class="${openFile === r.filename ? 'on' : ''}"><a href="#reports/${encodeURIComponent(r.filename || '')}" data-f="${esc(r.filename || '')}"><strong>${esc(r.title)}</strong></a>
              <div class="lead">${esc(r.summary || '')}</div>
              <small>${esc((r.sent_at || '').slice(0, 16))} · ${esc(r.filename || '')}</small></li>`,
          )
          .join('')}</ul>
        ${orphans.length ? `<h2>Autres fichiers</h2><ul class="list">${orphans.map((f) => `<li class="${openFile === f.filename ? 'on' : ''}"><a href="#reports/${encodeURIComponent(f.filename)}" data-f="${esc(f.filename)}">${esc(f.filename)}</a></li>`).join('')}</ul>` : ''}
      </div>
      <div class="pdf-pane" id="pdfPane" ${openFile ? '' : 'hidden'}>
        <div class="pdf-toolbar">
          <button type="button" class="theme-toggle" id="pdfBack">Liste</button>
          <strong id="pdfTitle">${esc(openFile ? titleOf(openFile) : '')}</strong>
        </div>
        <div class="pdf-scroll" id="pdfStage"></div>
      </div>
    </div>
  `);

  async function showInApp(filename) {
    if (!filename) return;
    openFile = filename;
    const layout = $('#pdfLayout');
    const pane = $('#pdfPane');
    const stage = $('#pdfStage');
    const titleEl = $('#pdfTitle');
    layout?.classList.add('is-open');
    if (pane) pane.hidden = false;
    if (titleEl) titleEl.textContent = titleOf(filename);
    app.querySelectorAll('#pdfList li').forEach((li) => {
      li.classList.toggle('on', li.querySelector('a')?.dataset.f === filename);
    });
    if (!stage) return;
    stage.innerHTML = '<p class="lead">Chargement…</p>';
    try {
      const r = await fetch('/api/reports/file/' + encodeURIComponent(filename), { credentials: 'include' });
      if (!r.ok) {
        stage.innerHTML = `<p class="err">Impossible de lire ${esc(filename)} (${r.status}).</p>`;
        return;
      }
      const buf = new Uint8Array(await r.arrayBuffer());
      if (filename.toLowerCase().endsWith('.html')) {
        renderHtmlBlob(stage, buf);
      } else if (filename.toLowerCase().endsWith('.md')) {
        const text = new TextDecoder('utf-8').decode(buf);
        stage.innerHTML = `<article class="md-html">${renderMarkdown(text)}</article>`;
      } else {
        await renderPdfBytes(stage, buf);
      }
      stage.scrollTop = 0;
    } catch (err) {
      stage.innerHTML = `<p class="err">Aperçu impossible. ${esc(err?.message || err)}</p>`;
    }
  }

  $('#pdfBack')?.addEventListener('click', () => {
    clearPdfStage($('#pdfStage'));
    openFile = '';
    $('#pdfLayout')?.classList.remove('is-open');
    const pane = $('#pdfPane');
    if (pane) pane.hidden = true;
    history.replaceState(null, '', '#reports');
  });

  app.querySelectorAll('a[data-f]').forEach((a) => {
    a.onclick = (e) => {
      e.preventDefault();
      if (!a.dataset.f) return;
      history.replaceState(null, '', '#reports/' + encodeURIComponent(a.dataset.f));
      showInApp(a.dataset.f);
    };
  });

  if (openFile) showInApp(openFile);
}

async function viewAccount() {
  const [ver, notes] = await Promise.all([
    api('/api/version?clientVersion=web').catch(() => ({})),
    api('/api/version-notes').catch(() => ({ versions: [] })),
  ]);
  const list = notes.versions || [];
  app.innerHTML = shell(`
    <p class="lead">${esc(me?.email || '')}</p>
    <div class="card">
      <strong>Version serveur ${esc(ver.version || '')}</strong>
      <p class="lead">${
        ver.apkAvailable
          ? `Mise à jour v${esc(ver.version || '')} disponible.`
          : 'Application à jour — aucune mise à jour disponible.'
      }</p>
      <p class="lead">forceUpdate=${esc(String(ver.forceUpdate))} · mandatory=${esc(String(ver.mandatory))}</p>
    </div>
    <h2>Notes</h2>
    <ul class="list">${list.map((n) => `<li><strong>${esc(n.version)} — ${esc(n.title)}</strong><div class="lead">${(n.notes || []).map((x) => esc(x)).join('<br>')}</div></li>`).join('') || '<li>Pas de notes</li>'}</ul>
    ${themeBtnHtml()}
    <button class="logout-page" id="out" type="button">Quitter</button>
  `);
  $('#out')?.addEventListener('click', async () => {
    await api('/api/auth/logout', { method: 'POST' });
    me = null;
    loginView();
  });
}

async function viewGantt() {
  const g = await api('/api/gantt');
  app.innerHTML = shell(`
    <p class="lead">${esc(g.objective)}</p>
    ${g.bars
      .map(
        (b) => `<div class="card" style="margin-bottom:8px">
          <strong>${esc(b.label)}</strong> · ${b.pct}%
          <div class="bar"><i style="width:${b.pct}%"></i></div>
          <small>${b.start} → ${b.end}</small>
        </div>`,
      )
      .join('')}
  `);
}

async function viewInbox() {
  const lastApp = parseApps(readLs(LAST_APP_KEY, 'docs'))[0] || 'docs';
  const draft = readLs(DRAFT_KEY, '');
  const kind = pendingInboxKind || readLs(KIND_KEY, 'retour');
  const savedTargets = readLs(TARGETS_KEY, '');
  pendingInboxKind = '';
  writeLs(KIND_KEY, kind);
  const filter = readLs(FILTER_KEY, 'all');
  const [{ remarks }, taskRes, colsRes] = await Promise.all([
    api('/api/remarks'),
    api('/api/tasks'),
    api('/api/columns'),
  ]);
  kanbanTasks = taskRes.tasks || [];
  if (colsRes.columns?.length) kanbanCols = colsRes.columns;
  const shown = remarks.filter((r) => {
    if (filter === 'note' || filter === 'retour') return (r.kind || 'retour') === filter;
    return true;
  });
  const sections = splitRemarks(shown, kanbanTasks, kanbanCols);
  const remarkItems = (rows) =>
    rows
      .map((row) => {
        const r = row.remark;
        const cible = targetLine(r.targets);
        const when = stampLine(r.created_at, r.updated_at);
        const crit = (r.kind || 'retour') === 'note' ? '' : `<div class="lead">Criticité ${clampCrit(r.criticality, 1)}</div>`;
        return `<li class="tap" data-edit="${esc(r.id)}"><strong>${esc(r.app)}</strong> · ${esc(r.kind || 'retour')}${cible ? ` · ${esc(cible)}` : ''}<div class="lead">${esc(when)}</div>${crit}<div class="task-state">${esc(taskStateLabel(row))}</div>${esc(r.body)}</li>`;
      })
      .join('') || '<li>Aucun élément</li>';
  app.innerHTML = shell(`
    <form id="fb" class="card">
      <label>Application</label>
      ${appChips(lastApp)}
      <p class="lead">Clic = une app. Appui long (ou clic droit) = en ajouter / retirer.</p>
      <label>Cible</label>
      ${targetChips(savedTargets)}
      <p class="lead">API, web, mobile, ou une combinaison.</p>
      <label>Type</label>
      <select name="kind">
        <option value="retour" ${kind === 'note' ? '' : 'selected'}>Retour</option>
        <option value="note" ${kind === 'note' ? 'selected' : ''}>Note</option>
      </select>
      ${criticalityPicker(1)}
      <label>Priorité</label>
      ${priorityPicker(5)}
      <p class="lead">5 est la plus basse. C’est le choix de départ.</p>
      <label>Texte</label>
      <textarea name="body" rows="5"${inboxTextareaAttrs()} required></textarea>
      <p class="err" id="fbErr" hidden></p>
      <button class="primary" type="submit">Enregistrer → tâche</button>
    </form>
    <div class="chips" id="inboxFilter">
      <button type="button" class="chip ${filter === 'all' ? 'on' : ''}" data-filter="all">Tous</button>
      <button type="button" class="chip ${filter === 'retour' ? 'on' : ''}" data-filter="retour">Retours</button>
      <button type="button" class="chip ${filter === 'note' ? 'on' : ''}" data-filter="note">Notes</button>
    </div>
    <h2>${esc(INBOX_GROUPS.openTitle)}</h2>
    <p class="lead">${esc(INBOX_GROUPS.openSubtitle)}</p>
    <ul class="list">${remarkItems(sections.open)}</ul>
    <div class="inbox-split">
      <h2>${esc(INBOX_GROUPS.doneTitle)}</h2>
      <p>${esc(INBOX_GROUPS.doneSubtitle)}</p>
    </div>
    <ul class="list">${remarkItems(sections.done)}</ul>
  `);
  bindApps($('#fb'));
  bindTargets($('#fb'));
  bindCriticality($('#fb'));
  bindPriority($('#fb'));
  const syncCrit = () => {
    const row = document.querySelector('#fb .crit-row');
    if (row) row.hidden = document.querySelector('#fb [name="kind"]')?.value === 'note';
  };
  syncCrit();
  document.querySelector('#fb [name="kind"]')?.addEventListener('change', syncCrit);
  const bodyEl = document.querySelector('#fb [name="body"]');
  if (bodyEl) bodyEl.value = draft;
  document.querySelector('#fb .apps')?.addEventListener('click', persistInboxFields);
  document.querySelector('#fb [name="kind"]')?.addEventListener('change', persistInboxFields);
  bodyEl?.addEventListener('input', persistInboxFields);
  document.querySelectorAll('#inboxFilter [data-filter]').forEach((b) => {
    b.onclick = () => {
      persistInboxFields();
      writeLs(FILTER_KEY, b.dataset.filter);
      viewInbox();
    };
  });
  function openRemarkEditor(r) {
    const linked = r.task_id ? taskById(r.task_id) : null;
    openModal(`
      <h2>Modifier</h2>
      <p class="meta">${esc(stampLine(r.created_at, r.updated_at))}</p>
      <label>Application</label>
      ${appChips(r.app)}
      <p class="lead">Clic = une app. Appui long (ou clic droit) = en ajouter / retirer.</p>
      <label>Cible</label>
      ${targetChips(r.targets)}
      <label>Type</label>
      <select id="ekind">
        <option value="retour" ${r.kind === 'note' ? '' : 'selected'}>Retour</option>
        <option value="note" ${r.kind === 'note' ? 'selected' : ''}>Note</option>
      </select>
      ${(r.kind || 'retour') === 'note' ? '' : criticalityPicker(r.criticality)}
      <label>Priorité</label>
      ${priorityPicker(linked?.priority ?? 5)}
      <p class="lead">1 la plus importante, 5 la plus basse.</p>
      <label>Texte</label>
      <textarea id="ebody" rows="5">${esc(r.body)}</textarea>
      <p class="err" id="eerr" hidden></p>
      ${r.task_id ? `<h3>Sous-tâches</h3>${subtaskListHtml(r.task_id)}` : ''}
      <div class="modal-actions">
        ${r.task_id ? '<button class="primary" type="button" id="rsub">Sous-tâche</button>' : ''}
        <button class="primary" type="button" id="esave">Enregistrer</button>
        <button class="ghost" type="button" id="eclose">Annuler</button>
      </div>
    `);
    bindApps($('#modal'));
    bindTargets($('#modal'));
    bindCriticality($('#modal'));
    bindPriority($('#modal'));
    bindSubtaskOpens($('#modal'));
    $('#eclose').onclick = closeModal;
    if (r.task_id) {
      $('#rsub').onclick = () => {
        const parent = linked || taskById(r.task_id) || {
          id: r.task_id,
          title: r.app,
          project: r.app,
          category: r.kind === 'note' ? 'docs' : 'bug',
          column_id: 'todo',
          targets: r.targets,
        };
        openSubtaskForm(parent, () => openRemarkEditor(r));
      };
    }
    $('#esave').onclick = async () => {
      const body = ($('#ebody').value || '').trim();
      const targets = readTargets($('#modal'));
      const err = $('#eerr');
      if (!body) return;
      if (!targets.length) {
        if (err) {
          err.hidden = false;
          err.textContent = 'Choisis au moins une cible : API, web ou mobile.';
        }
        return;
      }
      await api('/api/remarks/' + encodeURIComponent(r.id), {
        method: 'PATCH',
        body: JSON.stringify({
          app: readApps($('#modal')).join(', '),
          kind: $('#ekind').value === 'note' ? 'note' : 'retour',
          body,
          targets,
          criticality: readCriticality($('#modal'), r.criticality),
          priority: readPriorityIn($('#modal'), linked?.priority ?? 5),
        }),
      });
      closeModal();
      viewInbox();
    };
  }
  document.querySelectorAll('[data-edit]').forEach((li) => {
    li.onclick = () => {
      const r = remarks.find((x) => x.id === li.dataset.edit);
      if (r) openRemarkEditor(r);
    };
  });
  $('#fb').onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const appName = readApps($('#fb')).join(', ');
    const k = String(fd.get('kind') || 'retour') === 'note' ? 'note' : 'retour';
    const targets = readTargets($('#fb'));
    const err = $('#fbErr');
    if (!targets.length) {
      if (err) {
        err.hidden = false;
        err.textContent = 'Choisis au moins une cible : API, web ou mobile.';
      }
      return;
    }
    if (err) err.hidden = true;
    await api('/api/remarks', {
      method: 'POST',
      body: JSON.stringify({
        app: appName,
        body: fd.get('body'),
        kind: k,
        targets,
        criticality: k === 'retour' ? readCriticality($('#fb'), 1) : 1,
        priority: readPriorityIn($('#fb'), 5),
      }),
    });
    writeLs(LAST_APP_KEY, appName);
    writeLs(KIND_KEY, k);
    writeLs(TARGETS_KEY, targets.join(','));
    writeLs(DRAFT_KEY, '');
    viewInbox();
  };
}

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/"/g, '&quot;');
}

function inlineMd(s) {
  return esc(s)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\[([^\]]+)]\(([^)]+)\)/g, '<a href="$2" rel="noopener">$1</a>');
}

function renderMarkdown(src) {
  const lines = String(src || '').replace(/\r\n/g, '\n').split('\n');
  const html = [];
  let i = 0;
  const flushList = (items, ordered) => {
    if (!items.length) return;
    const tag = ordered ? 'ol' : 'ul';
    html.push(`<${tag}>${items.map((t) => `<li>${inlineMd(t)}</li>`).join('')}</${tag}>`);
    items.length = 0;
  };
  const ul = [];
  const ol = [];
  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith('```')) {
      flushList(ul, false); flushList(ol, true);
      const buf = [];
      i += 1;
      while (i < lines.length && !lines[i].startsWith('```')) {
        buf.push(lines[i]);
        i += 1;
      }
      i += 1;
      html.push(`<pre><code>${esc(buf.join('\n'))}</code></pre>`);
      continue;
    }
    if (/^\s*$/.test(line)) {
      flushList(ul, false); flushList(ol, true);
      i += 1;
      continue;
    }
    if (/^---+$/.test(line.trim()) || /^\*\*\*+$/.test(line.trim())) {
      flushList(ul, false); flushList(ol, true);
      html.push('<hr/>');
      i += 1;
      continue;
    }
    const h = line.match(/^(#{1,3})\s+(.*)$/);
    if (h) {
      flushList(ul, false); flushList(ol, true);
      html.push(`<h${h[1].length}>${inlineMd(h[2])}</h${h[1].length}>`);
      i += 1;
      continue;
    }
    if (line.startsWith('> ')) {
      flushList(ul, false); flushList(ol, true);
      html.push(`<blockquote>${inlineMd(line.slice(2))}</blockquote>`);
      i += 1;
      continue;
    }
    const bullet = line.match(/^[-*]\s+(.*)$/);
    if (bullet) {
      flushList(ol, true);
      ul.push(bullet[1]);
      i += 1;
      continue;
    }
    const num = line.match(/^\d+\.\s+(.*)$/);
    if (num) {
      flushList(ul, false);
      ol.push(num[1]);
      i += 1;
      continue;
    }
    flushList(ul, false); flushList(ol, true);
    html.push(`<p>${inlineMd(line)}</p>`);
    i += 1;
  }
  flushList(ul, false); flushList(ol, true);
  return html.join('') || '<p class="lead">Document vide.</p>';
}

const renderers = { dash: viewDash, kanban: viewKanban, docs: viewDocs, reports: viewReports, gantt: viewGantt, inbox: viewInbox, account: viewAccount };

async function render() {
  closeModal();
  if (!me) {
    const j = await api('/api/auth/me');
    if (!j?.email) {
      loginView();
      return;
    }
    me = j;
  }
  applyHash();
  if (!views.includes(route)) route = 'dash';
  await renderers[route]();
  bindShell();
  app.classList.toggle('wide', route === 'kanban');
}

if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});
window.addEventListener('hashchange', () => {
  persistInboxFields();
  applyHash();
  render();
});
window.addEventListener('pagehide', persistInboxFields);
document.addEventListener('click', () => {
  closeDrawer();
  closeFabMenu();
});
bindThemeBtn();
render();
