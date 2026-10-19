import { renderPdfBytes, renderHtmlBlob, clearPdfStage } from './pdf-view.js';

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
  dash: 'Docs',
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
const projects = ['music','maps','fuel','contacts','mail','photos','calendar','pass','drive','cook','jobs','admin','docs','id','ops','platform'];
const THEME_KEY = 'hubera-docs-theme';
const LAST_APP_KEY = 'hubera-docs-inbox-app';
const DRAFT_KEY = 'hubera-docs-inbox-draft';
const KIND_KEY = 'hubera-docs-inbox-kind';
const FILTER_KEY = 'hubera-docs-inbox-filter';
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
  const appSel = document.querySelector('#fb [name="app"]');
  const body = document.querySelector('#fb [name="body"]');
  const kind = document.querySelector('#fb [name="kind"]');
  if (appSel) writeLs(LAST_APP_KEY, appSel.value);
  if (body) writeLs(DRAFT_KEY, body.value);
  if (kind) writeLs(KIND_KEY, kind.value);
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
          <strong>Hubera Docs</strong>
          <small>${esc(me?.email || 'Compte Hubera')}</small>
        </div>
        <button type="button" data-go="dash" class="drawer-item ${route === 'dash' ? 'on' : ''}">${navIcons.dash}<span>Cahier unique</span></button>
        <button type="button" data-go="kanban" class="drawer-item ${route === 'kanban' ? 'on' : ''}">${navIcons.kanban}<span>Kanban</span></button>
        <button type="button" data-go="docs" class="drawer-item ${route === 'docs' ? 'on' : ''}">${navIcons.docs}<span>Docs</span></button>
        <button type="button" data-go="reports" class="drawer-item ${route === 'reports' ? 'on' : ''}">${navIcons.reports}<span>Rapports PDF</span></button>
        <button type="button" data-go="gantt" class="drawer-item ${route === 'gantt' ? 'on' : ''}">${navIcons.gantt}<span>Gantt</span></button>
        <button type="button" data-go="inbox" class="drawer-item ${route === 'inbox' ? 'on' : ''}">${navIcons.inbox}<span>Retours</span></button>
        <button type="button" data-go="account" class="drawer-item ${route === 'account' ? 'on' : ''}">${navIcons.account}<span>Compte / MAJ</span></button>
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
    b.onclick = () => {
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
        <h1>Hubera Docs</h1>
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
    <ul class="list">${d.recentTasks.map((t) => `<li class="tap" data-go="kanban"><b class="prio">${clampPrio(t.priority)}</b>${esc(t.title)}<small> ${esc(t.project)} · ${esc(t.column_id)}</small></li>`).join('')}</ul>
  `);
  app.querySelectorAll('[data-go]').forEach((el) => {
    el.onclick = () => {
      go(el.dataset.go, el.dataset.f || '');
    };
  });
}

let kanbanCols = [];

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

function readPriority(fallback = 2) {
  const row = document.querySelector('#modal .prio-row');
  return clampPrio(row?.dataset.value, fallback);
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
  kanbanCols = colsRes.columns?.length
    ? colsRes.columns
    : [
        { id: 'todo', label: 'À faire' },
        { id: 'doing', label: 'En cours' },
        { id: 'done', label: 'Fait' },
        { id: 'later', label: 'Plus tard' },
      ];
  const cell = (id) =>
    tasks
      .filter((t) => t.column_id === id)
      .map(
        (t) =>
          `<div class="task p${clampPrio(t.priority)}" data-id="${t.id}">
            <b class="prio">${clampPrio(t.priority)}</b>${esc(t.title)}<small>${esc(t.project)} · ${esc(t.category)}</small></div>`,
      )
      .join('');
  app.innerHTML = shell(`
    <p class="lead">Une carte = une tâche. Tape pour ouvrir la fiche — l’édition se fait depuis la popup.</p>
    <div class="kanban">${kanbanCols
      .map((c) => `<div class="col" data-col="${esc(c.id)}"><h3>${esc(c.label)}</h3>${cell(c.id)}</div>`)
      .join('')}
      <button type="button" class="col col-add" id="addCol">+ Colonne</button>
    </div>
  `);
  const byId = Object.fromEntries(tasks.map((t) => [t.id, t]));
  app.querySelectorAll('.task').forEach((el) => {
    el.onclick = () => openTaskCard(byId[el.dataset.id]);
  });
  $('#addCol').onclick = () => openNewColumn();
  if (pendingNewTask) {
    pendingNewTask = false;
    openNewTask();
  }
}

function openTaskCard(t) {
  openModal(`
    <h2>${esc(t.title)}</h2>
    <p class="meta">${esc(t.project)} · ${esc(t.category)}</p>
    <label>Priorité</label>
    ${priorityPicker(t.priority)}
    <div class="lead" id="tbody-ro">${esc(t.body || 'Pas encore de détail.')}</div>
    <div class="modal-actions">
      <button class="primary" type="button" id="tedit">Modifier</button>
      <button class="ghost" type="button" id="tclose">Fermer</button>
    </div>
  `);
  bindPriority($('#modal'));
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
        t.priority = priority;
      };
    });
  }
  $('#tclose').onclick = () => {
    closeModal();
    viewKanban();
  };
  $('#tedit').onclick = () => openTaskEdit(t);
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
  $('#tclose').onclick = () => openTaskCard(t);
  $('#tsave').onclick = async () => {
    await api('/api/tasks/' + t.id, {
      method: 'PATCH',
      body: JSON.stringify({
        title: $('#ttitle').value,
        body: $('#tbody').value,
        column_id: $('#tcol').value,
        project: $('#tproj').value,
        priority: readPriority(t.priority),
      }),
    });
    closeModal();
    viewKanban();
  };
}

function openNewTask() {
  const first = kanbanCols[0]?.id || 'todo';
  const lastApp = readLs(LAST_APP_KEY, 'docs');
  openModal(`
    <h2>Nouvelle tâche</h2>
    <input id="ntitle" placeholder="Titre" required />
    <textarea id="nbody" rows="4" placeholder="Détail (optionnel)"></textarea>
    <select id="nproj">${projects.map((p) => `<option ${p === lastApp ? 'selected' : ''}>${p}</option>`).join('')}</select>
    <select id="ncat">${['test','feature','bug','infra','docs','ops'].map((p) => `<option>${p}</option>`).join('')}</select>
    <select id="ncol">${colOptions(first)}</select>
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
          ? `Mise à jour v${esc(ver.version || '')} disponible — jamais forcée.`
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
  const lastApp = readLs(LAST_APP_KEY, 'docs');
  const draft = readLs(DRAFT_KEY, '');
  const kind = pendingInboxKind || readLs(KIND_KEY, 'retour');
  pendingInboxKind = '';
  writeLs(KIND_KEY, kind);
  const filter = readLs(FILTER_KEY, 'all');
  const { remarks } = await api('/api/remarks');
  const shown = remarks.filter((r) => {
    if (filter === 'note' || filter === 'retour') return (r.kind || 'retour') === filter;
    return true;
  });
  app.innerHTML = shell(`
    <p class="lead">Tape un retour pour le modifier (texte, type, application). Ça met aussi à jour la tâche.</p>
    <form id="fb" class="card">
      <select name="app">${projects.map((p) => `<option ${p === lastApp ? 'selected' : ''}>${p}</option>`).join('')}</select>
      <select name="kind">
        <option value="retour" ${kind === 'note' ? '' : 'selected'}>Retour</option>
        <option value="note" ${kind === 'note' ? 'selected' : ''}>Note</option>
      </select>
      <textarea name="body" rows="5" placeholder="Ex. Nothing : Flowers spinner 20 s. Ou : ajouter le budget unique Fuel dans Docs." required></textarea>
      <button class="primary" type="submit">Enregistrer → tâche</button>
    </form>
    <div class="chips" id="inboxFilter">
      <button type="button" class="chip ${filter === 'all' ? 'on' : ''}" data-filter="all">Tous</button>
      <button type="button" class="chip ${filter === 'retour' ? 'on' : ''}" data-filter="retour">Retours</button>
      <button type="button" class="chip ${filter === 'note' ? 'on' : ''}" data-filter="note">Notes</button>
    </div>
    <ul class="list">${shown.map((r) => `<li class="tap" data-edit="${esc(r.id)}"><strong>${esc(r.app)}</strong> · ${esc(r.kind || 'retour')} — ${esc(r.body)}</li>`).join('') || '<li>Aucun élément</li>'}</ul>
  `);
  const bodyEl = document.querySelector('#fb [name="body"]');
  if (bodyEl) bodyEl.value = draft;
  document.querySelector('#fb [name="app"]')?.addEventListener('change', persistInboxFields);
  document.querySelector('#fb [name="kind"]')?.addEventListener('change', persistInboxFields);
  bodyEl?.addEventListener('input', persistInboxFields);
  document.querySelectorAll('#inboxFilter [data-filter]').forEach((b) => {
    b.onclick = () => {
      persistInboxFields();
      writeLs(FILTER_KEY, b.dataset.filter);
      viewInbox();
    };
  });
  document.querySelectorAll('[data-edit]').forEach((li) => {
    li.onclick = () => {
      const r = remarks.find((x) => x.id === li.dataset.edit);
      if (!r) return;
      openModal(`
        <h2>Modifier</h2>
        <label>Application</label>
        <select id="eapp">${projects.map((p) => `<option ${p === r.app ? 'selected' : ''}>${p}</option>`).join('')}</select>
        <label>Type</label>
        <select id="ekind">
          <option value="retour" ${r.kind === 'note' ? '' : 'selected'}>Retour</option>
          <option value="note" ${r.kind === 'note' ? 'selected' : ''}>Note</option>
        </select>
        <label>Texte</label>
        <textarea id="ebody" rows="5">${esc(r.body)}</textarea>
        <div class="modal-actions">
          <button class="primary" type="button" id="esave">Enregistrer</button>
          <button class="ghost" type="button" id="eclose">Annuler</button>
        </div>
      `);
      $('#eclose').onclick = closeModal;
      $('#esave').onclick = async () => {
        const body = ($('#ebody').value || '').trim();
        if (!body) return;
        await api('/api/remarks/' + encodeURIComponent(r.id), {
          method: 'PATCH',
          body: JSON.stringify({
            app: $('#eapp').value,
            kind: $('#ekind').value === 'note' ? 'note' : 'retour',
            body,
          }),
        });
        closeModal();
        viewInbox();
      };
    };
  });
  $('#fb').onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const appName = String(fd.get('app') || 'docs');
    const k = String(fd.get('kind') || 'retour') === 'note' ? 'note' : 'retour';
    await api('/api/remarks', {
      method: 'POST',
      body: JSON.stringify({ app: appName, body: fd.get('body'), kind: k }),
    });
    writeLs(LAST_APP_KEY, appName);
    writeLs(KIND_KEY, k);
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
