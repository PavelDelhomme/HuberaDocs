const $ = (sel, el = document) => el.querySelector(sel);
const app = $('#app');
const views = ['dash', 'kanban', 'docs', 'reports', 'gantt', 'inbox'];
const labels = { dash: 'Home', kanban: 'Tâches', docs: 'Docs', reports: 'PDF', gantt: 'Avance', inbox: 'Noter' };
const projects = ['music','maps','fuel','contacts','mail','photos','calendar','pass','drive','cook','jobs','admin','docs','id','ops','platform'];
let route = location.hash.replace('#', '') || 'dash';
let me = null;
let pendingEmail = '';

async function api(path, opts = {}) {
  const r = await fetch(path, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
    ...opts,
  });
  if (r.status === 401) {
    me = null;
    render();
    throw new Error('auth');
  }
  if (opts.raw) return r;
  return r.json();
}

function shell(inner) {
  return `
    <header class="top">
      <strong>HUBERA DOCS</strong>
      <span class="who">${me?.email || ''}</span>
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
    route = 'inbox';
    location.hash = 'inbox';
    render();
  });
  document.querySelectorAll('nav.bottom button').forEach((b) => {
    b.onclick = () => {
      route = b.dataset.go;
      location.hash = route;
      render();
    };
  });
}

function loginView(err = '', twofa = false) {
  app.innerHTML = twofa
    ? `<form class="login card">
        <h1>Code 2FA</h1>
        <p class="lead">Hubera ID / Bitwarden Authenticator.</p>
        <input name="code" inputmode="numeric" autocomplete="one-time-code" placeholder="123456" required />
        <button class="primary" type="submit">Valider</button>
        ${err ? `<p class="err">${err}</p>` : ''}
      </form>`
    : `<form class="login card">
        <h1>Connexion</h1>
        <p class="lead">Cockpit Paul — tâches, PDF des mails, docs .md, notes. Pas Hubera Admin.</p>
        <p class="lead">Brave / Chrome → menu → Ajouter à l’écran d’accueil. Bitwarden peut remplir Hubera ID.</p>
        <input name="email" type="email" autocomplete="username" placeholder="e-mail" required />
        <input name="password" type="password" autocomplete="current-password" placeholder="mot de passe" required />
        <button class="primary" type="submit">Entrer</button>
        ${err ? `<p class="err">${err}</p>` : ''}
      </form>`;
  $('form').onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    try {
      if (twofa) {
        const j = await api('/api/auth/login/2fa', {
          method: 'POST',
          body: JSON.stringify({ email: pendingEmail, code: fd.get('code') }),
        });
        if (!j.ok) return loginView('Code refusé.', true);
        me = { email: j.email };
        return render();
      }
      pendingEmail = String(fd.get('email') || '').trim().toLowerCase();
      const j = await api('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: pendingEmail, password: fd.get('password') }),
      });
      if (j.requires_2fa) return loginView('', true);
      if (!j.ok) return loginView('Refusé (allowlist ou identifiants).');
      me = { email: j.email };
      render();
    } catch {
      loginView(twofa ? 'Code invalide.' : 'Hubera ID injoignable ou identifiants invalides.', twofa);
    }
  };
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
    <ul class="list">${d.recentReports.map((r) => `<li class="tap" data-go="reports"><strong>${r.title}</strong><br><small>${(r.sent_at || '').slice(0, 16)} · ${r.kind}</small><div class="lead">${r.summary || ''}</div></li>`).join('') || '<li>Pas encore de PDF</li>'}</ul>
    <h2>Tâches récentes</h2>
    <ul class="list">${d.recentTasks.map((t) => `<li class="tap" data-go="kanban">${t.title}<small> ${t.project} · ${t.column_id}</small></li>`).join('')}</ul>
  `);
  app.querySelectorAll('[data-go]').forEach((el) => {
    el.onclick = () => {
      route = el.dataset.go;
      location.hash = route;
      render();
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
  app.innerHTML = shell(`
    <h1>PDF des mails</h1>
    <p class="lead">Aujourd’hui et les jours précédents. Tape pour ouvrir ici (pas seulement Gmail).</p>
    <ul class="list" id="rl">${reports
      .map(
        (r) =>
          `<li><a href="#" data-f="${esc(r.filename || '')}"><strong>${esc(r.title)}</strong></a>
          <div class="lead">${esc(r.summary || '')}</div>
          <small>${esc((r.sent_at || '').slice(0, 16))} · ${esc(r.filename || '')}</small></li>`,
      )
      .join('')}</ul>
    ${orphans.length ? `<h2>Autres fichiers</h2><ul class="list">${orphans.map((f) => `<li><a href="#" data-f="${esc(f.filename)}">${esc(f.filename)}</a></li>`).join('')}</ul>` : ''}
    <iframe class="pdf" id="pdf" hidden></iframe>
  `);
  app.querySelectorAll('a[data-f]').forEach((a) => {
    a.onclick = (e) => {
      e.preventDefault();
      if (!a.dataset.f) return;
      const url = '/api/reports/file/' + encodeURIComponent(a.dataset.f);
      const pdf = $('#pdf');
      pdf.hidden = false;
      pdf.src = url;
      window.open(url, '_blank');
    };
  });
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
    try {
      me = await api('/api/auth/me');
    } catch {
      loginView();
      return;
    }
  }
  if (!views.includes(route)) route = 'dash';
  await renderers[route]();
  bindShell();
}

if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});
window.addEventListener('hashchange', () => {
  route = location.hash.replace('#', '') || 'dash';
  render();
});
render();
