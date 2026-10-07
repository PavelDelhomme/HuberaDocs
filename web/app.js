import { renderPdfBytes, renderHtmlBlob, clearPdfStage } from './pdf-view.js';

const $ = (sel, el = document) => el.querySelector(sel);
const app = $('#app');
const views = ['dash', 'kanban', 'docs', 'reports', 'gantt', 'inbox'];
const labels = { dash: 'Home', kanban: 'Tâches', docs: 'Docs', reports: 'PDF', gantt: 'Avance', inbox: 'Noter' };
const projects = ['music','maps','fuel','contacts','mail','photos','calendar','pass','drive','cook','jobs','admin','docs','id','ops','platform'];
const THEME_KEY = 'hubera-docs-theme';
let route = 'dash';
let openFile = '';
let me = null;
let pendingEmail = '';

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
  if (meta) meta.content = t === 'dark' ? '#0b1519' : '#0e4d5c';
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
  return `
    <header class="top">
      <strong>HUBERA DOCS</strong>
      <span class="who">${me?.email || ''}</span>
      ${themeBtnHtml()}
      <button class="logout" id="noteFast" type="button">Noter</button>
      <button class="logout" id="out" type="button">Quitter</button>
    </header>
    <div class="view">${inner}</div>
    <nav class="bottom">
      ${views.map((v) => `<button data-go="${v}" class="${v === route ? 'on' : ''}">${labels[v]}</button>`).join('')}
    </nav>`;
}

function bindShell() {
  $('#out')?.addEventListener('click', async () => {
    await api('/api/auth/logout', { method: 'POST' });
    me = null;
    loginView();
  });
  $('#noteFast')?.addEventListener('click', () => {
    go('inbox');
  });
  document.querySelectorAll('nav.bottom button').forEach((b) => {
    b.onclick = () => {
      go(b.dataset.go);
    };
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

function loginView(err = '', twofa = false) {
  const existing = $('form.login');
  if (existing && Boolean(existing.dataset.twofa) === twofa) {
    setLoginErr(existing, err);
    bindLoginForm(existing, twofa);
    return;
  }
  const keepEmail = esc(pendingEmail || $('input[name="email"]')?.value || '');
  app.innerHTML = twofa
    ? `<div class="theme-bar">${themeBtnHtml()}</div>
      <form class="login card" data-twofa="1" autocomplete="on">
        <h1>Code 2FA</h1>
        <p class="lead">Hubera ID / Bitwarden Authenticator — le code à 6 chiffres, pas le mot de passe.</p>
        <label for="docs-code">Code</label>
        <input id="docs-code" name="code" inputmode="numeric" autocomplete="one-time-code" placeholder="123456" required autofocus />
        <button class="primary" type="submit">Valider</button>
        ${err ? `<p class="err">${esc(err)}</p>` : ''}
      </form>`
    : `<div class="theme-bar">${themeBtnHtml()}</div>
      <form class="login card" autocomplete="on">
        <h1>Connexion</h1>
        <p class="lead">Ton compte Hubera ID admin (le même e-mail et mot de passe que Music / Mail / Admin).</p>
        <label for="docs-email">E-mail</label>
        <input id="docs-email" name="email" type="email" autocomplete="username" autocapitalize="none" spellcheck="false" inputmode="email" placeholder="e-mail" required value="${keepEmail}" />
        <label for="docs-password">Mot de passe Hubera ID</label>
        <input id="docs-password" name="password" type="password" autocomplete="current-password" placeholder="mot de passe" required />
        <button class="primary" type="submit">Entrer</button>
        ${err ? `<p class="err">${esc(err)}</p>` : ''}
      </form>`;
  bindLoginForm($('form.login'), twofa);
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
    <h1>Tableau de bord</h1>
    <p class="lead">Les PDF des mails sont dans l’onglet PDF. Ce qui cloche → Noter (ça crée une tâche).</p>
    <div class="grid">
      <div class="card tap" data-go="kanban"><b>${count('todo')}</b><span>À faire</span></div>
      <div class="card tap" data-go="kanban"><b>${count('doing')}</b><span>En cours</span></div>
      <div class="card tap" data-go="kanban"><b>${count('done')}</b><span>Faits</span></div>
      <div class="card tap" data-go="inbox"><b>${d.remarks}</b><span>Notes / retours</span></div>
    </div>
    <h2>Derniers rapports / mails</h2>
    <ul class="list">${d.recentReports.map((r) => `<li class="tap" data-go="reports" data-f="${esc(r.filename || '')}"><strong>${esc(r.title)}</strong><br><small>${(r.sent_at || '').slice(0, 16)} · ${esc(r.kind)}</small><div class="lead">${esc(r.summary || '')}</div></li>`).join('') || '<li>Pas encore de PDF</li>'}</ul>
    <h2>Tâches récentes</h2>
    <ul class="list">${d.recentTasks.map((t) => `<li class="tap" data-go="kanban">${esc(t.title)}<small> ${esc(t.project)} · ${esc(t.column_id)}</small></li>`).join('')}</ul>
  `);
  app.querySelectorAll('[data-go]').forEach((el) => {
    el.onclick = () => {
      go(el.dataset.go, el.dataset.f || '');
    };
  });
}

async function viewKanban() {
  const { tasks } = await api('/api/tasks');
  const cols = [
    ['todo', 'À faire'],
    ['doing', 'En cours'],
    ['done', 'Fait'],
    ['later', 'Plus tard'],
  ];
  const cell = (id) =>
    tasks
      .filter((t) => t.column_id === id)
      .map(
        (t) =>
          `<div class="task p${t.priority}" data-id="${t.id}">
            ${esc(t.title)}<small>${t.project} · ${t.category}</small></div>`,
      )
      .join('');
  app.innerHTML = shell(`
    <h1>Kanban</h1>
    <p class="lead">Tape une carte pour écrire une note / la faire avancer. Ça, c’est le travail projet — pas Admin.</p>
    <div class="kanban">${cols.map(([id, lab]) => `<div class="col"><h3>${lab}</h3>${cell(id)}</div>`).join('')}</div>
    <form id="new" class="card" style="margin-top:12px">
      <input name="title" placeholder="Nouvelle tâche" required />
      <textarea name="body" rows="2" placeholder="Détail (optionnel)"></textarea>
      <select name="project">${projects.map((p) => `<option>${p}</option>`).join('')}</select>
      <select name="category">${['test','feature','bug','infra','docs','ops'].map((p) => `<option>${p}</option>`).join('')}</select>
      <button class="primary" type="submit">Ajouter</button>
    </form>
    <div id="sheet" hidden></div>
  `);
  const byId = Object.fromEntries(tasks.map((t) => [t.id, t]));
  app.querySelectorAll('.task').forEach((el) => {
    el.onclick = () => openTask(byId[el.dataset.id]);
  });
  $('#new').onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    await api('/api/tasks', {
      method: 'POST',
      body: JSON.stringify({
        title: fd.get('title'),
        body: fd.get('body'),
        project: fd.get('project'),
        category: fd.get('category'),
      }),
    });
    viewKanban();
  };
}

function openTask(t) {
  const sheet = $('#sheet');
  sheet.hidden = false;
  sheet.innerHTML = `<div class="card">
    <strong>${esc(t.title)}</strong>
    <p class="lead">${t.project} · ${t.category} · ${t.column_id}</p>
    <textarea id="tbody" rows="5">${esc(t.body || '')}</textarea>
    <select id="tcol">${['todo','doing','done','later'].map((c) => `<option ${c===t.column_id?'selected':''}>${c}</option>`).join('')}</select>
    <button class="primary" id="tsave" type="button">Enregistrer</button>
  </div>`;
  $('#tsave').onclick = async () => {
    await api('/api/tasks/' + t.id, {
      method: 'PATCH',
      body: JSON.stringify({ body: $('#tbody').value, column_id: $('#tcol').value }),
    });
    viewKanban();
  };
}

async function viewDocs() {
  const { files } = await api('/api/docs');
  app.innerHTML = shell(`
    <h1>Documentation .md</h1>
    <p class="lead">Fichiers du dépôt Docs. Tu peux les lire et les modifier. Les NOTES produits doivent pointer ici.</p>
    <input id="q" placeholder="Filtrer un fichier…" />
    <ul class="list" id="fl">${files.map((f) => `<li><a href="#" data-p="${esc(f.path)}">${esc(f.path)}</a></li>`).join('')}</ul>
    <textarea id="md" class="doc" rows="18" placeholder="Choisis un fichier."></textarea>
    <button class="primary" id="saveMd" type="button" hidden>Enregistrer le .md</button>
  `);
  let current = '';
  const refreshList = () => {
    const q = ($('#q').value || '').toLowerCase();
    app.querySelectorAll('#fl li').forEach((li) => {
      li.hidden = q && !li.textContent.toLowerCase().includes(q);
    });
  };
  $('#q').oninput = refreshList;
  app.querySelectorAll('#fl a').forEach((a) => {
    a.onclick = async (e) => {
      e.preventDefault();
      current = a.dataset.p;
      const j = await fetch('/api/docs/file?path=' + encodeURIComponent(current), { credentials: 'include' });
      $('#md').value = await j.text();
      $('#saveMd').hidden = false;
    };
  });
  $('#saveMd').onclick = async () => {
    if (!current) return;
    await api('/api/docs/file', {
      method: 'PUT',
      body: JSON.stringify({ path: current, markdown: $('#md').value }),
    });
  };
}

async function viewReports() {
  const { reports, files } = await api('/api/reports');
  const names = new Set(reports.map((r) => r.filename).filter(Boolean));
  const orphans = files.filter((f) => !names.has(f.filename));
  const titleOf = (filename) => reports.find((r) => r.filename === filename)?.title || filename;
  app.innerHTML = shell(`
    <h1>PDF des mails</h1>
    <p class="lead">Tape un fichier : il s’affiche ici, dans la page. Pas d’onglet, pas de téléchargement.</p>
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

async function viewGantt() {
  const g = await api('/api/gantt');
  app.innerHTML = shell(`
    <h1>Avancement</h1>
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
  const { remarks } = await api('/api/remarks');
  app.innerHTML = shell(`
    <h1>Noter</h1>
    <p class="lead">Ce qui ne va pas, à améliorer, à faire. Ça crée une tâche kanban priorité 1. Une app = un menu.</p>
    <form id="fb" class="card">
      <select name="app">${projects.map((p) => `<option>${p}</option>`).join('')}</select>
      <textarea name="body" rows="5" placeholder="Ex. Nothing : Flowers spinner 20 s. Ou : ajouter le budget unique Fuel dans Docs." required></textarea>
      <button class="primary" type="submit">Enregistrer → tâche</button>
    </form>
    <ul class="list">${remarks.map((r) => `<li><strong>${esc(r.app)}</strong> — ${esc(r.body)}</li>`).join('') || '<li>Aucun retour</li>'}</ul>
  `);
  $('#fb').onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    await api('/api/remarks', { method: 'POST', body: JSON.stringify({ app: fd.get('app'), body: fd.get('body') }) });
    viewInbox();
  };
}

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/"/g, '&quot;');
}

const renderers = { dash: viewDash, kanban: viewKanban, docs: viewDocs, reports: viewReports, gantt: viewGantt, inbox: viewInbox };

async function render() {
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
}

if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});
window.addEventListener('hashchange', () => {
  applyHash();
  render();
});
bindThemeBtn();
render();
