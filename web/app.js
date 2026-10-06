const $ = (sel, el = document) => el.querySelector(sel);
const app = $('#app');
const views = ['dash', 'kanban', 'docs', 'reports', 'gantt', 'inbox'];
const labels = { dash: 'Home', kanban: 'Tâches', docs: 'Docs', reports: 'PDF', gantt: 'Avance', inbox: 'Retours' };
let route = location.hash.replace('#', '') || 'dash';
let me = null;

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
  return r.json();
}

function shell(inner) {
  return `
    <header class="top">
      <strong>HUBERA DOCS</strong>
      <button class="logout" id="out">Quitter</button>
    </header>
    <div class="view">${inner}</div>
    <nav class="bottom">
      ${views.map((v) => `<button data-go="${v}" class="${v === route ? 'on' : ''}">${labels[v]}</button>`).join('')}
    </nav>`;
}

function loginView(err = '') {
  app.innerHTML = `
    <form class="login card">
      <h1>Connexion</h1>
      <p class="lead">Cockpit Paul. Hubera ID, allowlist uniquement. Pas Hubera Admin.</p>
      <input name="email" type="email" autocomplete="username" placeholder="e-mail" required />
      <input name="password" type="password" autocomplete="current-password" placeholder="mot de passe" required />
      <button class="primary" type="submit">Entrer</button>
      ${err ? `<p class="err">${err}</p>` : ''}
    </form>`;
  $('form').onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    try {
      const j = await api('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: fd.get('email'), password: fd.get('password') }),
      });
      if (j.requires_2fa) return loginView('2FA Hubera ID : pas encore dans ce cockpit — désactive temporairement ou on branche l’étape.');
      if (!j.ok) return loginView('Refusé (allowlist ou identifiants).');
      me = { email: j.email };
      render();
    } catch {
      loginView('Hubera ID injoignable ou identifiants invalides.');
    }
  };
}

async function viewDash() {
  const d = await api('/api/dashboard');
  const count = (id) => d.byCol.find((x) => x.column_id === id)?.c || 0;
  app.innerHTML = shell(`
    <h1>Tableau de bord</h1>
    <p class="lead">Où on en est, ce qui a été envoyé, ce qui t’attend. Music / Maps / Fuel d’abord.</p>
    <div class="grid">
      <div class="card"><b>${count('todo')}</b><span>À faire</span></div>
      <div class="card"><b>${count('doing')}</b><span>En cours</span></div>
      <div class="card"><b>${count('done')}</b><span>Faits</span></div>
      <div class="card"><b>${d.remarks}</b><span>Retours</span></div>
    </div>
    <h2>Derniers rapports / mails</h2>
    <ul class="list">${d.recentReports.map((r) => `<li><strong>${r.title}</strong><br><small>${r.sent_at || ''} · ${r.kind}</small><div class="lead">${r.summary || ''}</div></li>`).join('')}</ul>
    <h2>Tâches touchées récemment</h2>
    <ul class="list">${d.recentTasks.map((t) => `<li>${t.title}<small> ${t.project} · ${t.column_id}</small></li>`).join('')}</ul>
  `);
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
          `<div class="task p${t.priority}" data-id="${t.id}" data-col="${id}">
            ${t.title}<small>${t.project} · ${t.category}</small></div>`,
      )
      .join('');
  app.innerHTML = shell(`
    <h1>Kanban</h1>
    <p class="lead">Catégories : test, feature, infra, bug, docs, ops, design. Tape une carte pour la faire avancer.</p>
    <div class="kanban">${cols.map(([id, lab]) => `<div class="col"><h3>${lab}</h3>${cell(id)}</div>`).join('')}</div>
    <form id="new" class="card" style="margin-top:12px">
      <input name="title" placeholder="Nouvelle tâche" required />
      <select name="project">
        ${['music','maps','fuel','contacts','mail','photos','calendar','id','docs','ops','platform'].map((p) => `<option>${p}</option>`).join('')}
      </select>
      <select name="category">
        ${['test','feature','bug','infra','docs','ops'].map((p) => `<option>${p}</option>`).join('')}
      </select>
      <button class="primary" type="submit">Ajouter</button>
    </form>
  `);
  app.querySelectorAll('.task').forEach((el) => {
    el.onclick = async () => {
      const order = ['todo', 'doing', 'done', 'later'];
      const cur = el.dataset.col;
      const next = order[(order.indexOf(cur) + 1) % order.length];
      await api('/api/tasks/' + el.dataset.id, { method: 'PATCH', body: JSON.stringify({ column_id: next }) });
      viewKanban();
    };
  });
  $('#new').onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    await api('/api/tasks', {
      method: 'POST',
      body: JSON.stringify({
        title: fd.get('title'),
        project: fd.get('project'),
        category: fd.get('category'),
      }),
    });
    viewKanban();
  };
}

async function viewDocs() {
  const { files } = await api('/api/docs');
  app.innerHTML = shell(`
    <h1>Documentation</h1>
    <p class="lead">Canonique ici. Les NOTES.md des produits doivent pointer vers ce dépôt.</p>
    <ul class="list" id="fl">${files.map((f) => `<li><a href="#" data-p="${f.path}">${f.path}</a></li>`).join('')}</ul>
    <div id="md" class="doc">Choisis un fichier.</div>
  `);
  app.querySelectorAll('#fl a').forEach((a) => {
    a.onclick = async (e) => {
      e.preventDefault();
      const j = await fetch('/api/docs/file?path=' + encodeURIComponent(a.dataset.p), { credentials: 'include' });
      $('#md').textContent = await j.text();
    };
  });
}

async function viewReports() {
  const { reports, files } = await api('/api/reports');
  app.innerHTML = shell(`
    <h1>Rapports & e-mails</h1>
    <p class="lead">Les PDF envoyés par l’agent. Lisibles ici, pas seulement dans Gmail.</p>
    <ul class="list">${reports.map((r) => `<li><strong>${r.title}</strong><div class="lead">${r.summary}</div>
      ${r.filename ? `<a href="/api/reports/file/${encodeURIComponent(r.filename)}" target="_blank">Ouvrir ${r.filename}</a>` : ''}</li>`).join('')}</ul>
    <h2>Fichiers</h2>
    <ul class="list">${files.map((f) => `<li><a href="/api/reports/file/${encodeURIComponent(f.filename)}" target="_blank">${f.filename}</a></li>`).join('') || '<li>Aucun PDF monté pour l’instant</li>'}</ul>
    <iframe class="pdf" id="pdf" hidden></iframe>
  `);
}

async function viewGantt() {
  const g = await api('/api/gantt');
  app.innerHTML = shell(`
    <h1>Avancement</h1>
    <p class="lead">${g.objective}</p>
    ${g.bars
      .map(
        (b) => `<div class="card" style="margin-bottom:8px">
          <strong>${b.label}</strong> · ${b.pct}%
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
    <h1>Retours d’usage</h1>
    <p class="lead">Ce qui cloche dans une app. Ça crée une tâche kanban priorité 1 pour l’agent au retour sur le PC.</p>
    <form id="fb" class="card">
      <select name="app">${['music','maps','fuel','contacts','mail','photos','calendar','pass','drive','cook','jobs'].map((p) => `<option>${p}</option>`).join('')}</select>
      <textarea name="body" rows="4" placeholder="Ex. Nothing : Flowers spinner 20 s…" required></textarea>
      <button class="primary" type="submit">Créer la tâche</button>
    </form>
    <ul class="list">${remarks.map((r) => `<li>${r.app} — ${r.body}</li>`).join('') || '<li>Aucun retour</li>'}</ul>
  `);
  $('#fb').onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    await api('/api/remarks', { method: 'POST', body: JSON.stringify({ app: fd.get('app'), body: fd.get('body') }) });
    viewInbox();
  };
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
  $('#out')?.addEventListener('click', async () => {
    await api('/api/auth/logout', { method: 'POST' });
    me = null;
    loginView();
  });
  document.querySelectorAll('nav.bottom button').forEach((b) => {
    b.onclick = () => {
      route = b.dataset.go;
      location.hash = route;
      render();
    };
  });
}

if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});
window.addEventListener('hashchange', () => {
  route = location.hash.replace('#', '') || 'dash';
  render();
});
render();
