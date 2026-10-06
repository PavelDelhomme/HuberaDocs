import { createHash, randomBytes } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import cookieParser from 'cookie-parser';
import express from 'express';
import Database from 'better-sqlite3';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DATA_DIR = process.env.DATA_DIR || join(ROOT, 'data');
const CONTENT_DIR = process.env.CONTENT_DIR || join(ROOT, 'content');
const REPORTS_DIR = process.env.REPORTS_DIR || join(CONTENT_DIR, 'reports');
const WEB_DIR = join(ROOT, 'web');
const PORT = Number(process.env.PORT || 8780);
const ID_URL = (process.env.ID_URL || 'https://id.hubera.cloud').replace(/\/$/, '');
const ADMINS = (process.env.DOCS_ADMIN_EMAILS || 'paul@delhomme.ovh')
  .split(',')
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);
const SESSION_SECRET = process.env.SESSION_SECRET || 'dev-only-change-me';

mkdirSync(DATA_DIR, { recursive: true });
mkdirSync(REPORTS_DIR, { recursive: true });

const db = new Database(join(DATA_DIR, 'docs.sqlite'));
db.pragma('journal_mode = WAL');
db.exec(`
CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT DEFAULT '',
  project TEXT NOT NULL,
  category TEXT NOT NULL,
  column_id TEXT NOT NULL,
  priority INTEGER DEFAULT 2,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS remarks (
  id TEXT PRIMARY KEY,
  app TEXT NOT NULL,
  body TEXT NOT NULL,
  task_id TEXT,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  kind TEXT NOT NULL,
  sent_at TEXT,
  filename TEXT,
  summary TEXT DEFAULT ''
);
CREATE TABLE IF NOT EXISTS claims (
  token TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  used INTEGER NOT NULL DEFAULT 0
);
`);

function nid() {
  return randomBytes(8).toString('hex');
}
function now() {
  return Date.now();
}
function hashSession(token) {
  return createHash('sha256').update(SESSION_SECRET + ':' + token).digest('hex');
}

function seed() {
  const n = db.prepare('SELECT COUNT(*) AS c FROM tasks').get().c;
  if (n === 0) {
    const ins = db.prepare(
      `INSERT INTO tasks (id,title,body,project,category,column_id,priority,created_at,updated_at)
       VALUES (@id,@title,@body,@project,@category,@column_id,@priority,@created_at,@updated_at)`,
    );
    const t = now();
    const rows = [
      { title: 'Music Nothing : 5 titres chauds + 2 froids + skip', body: 'Vérifier <2s sur déjà écoutés. APK 1.3.352.', project: 'music', category: 'test', column_id: 'todo', priority: 1 },
      { title: 'Maps 0.1.72 : croix recherche + véhicules Fuel + lieux', body: 'Nothing / Samsung. Hors-ligne tuiles.', project: 'maps', category: 'test', column_id: 'todo', priority: 1 },
      { title: 'Fuel : un budget global (APK 1.4.166 encore à overlay)', body: 'Source 166, téléphones 165.', project: 'fuel', category: 'feature', column_id: 'doing', priority: 1 },
      { title: 'OTA tronc commun type Music sur Maps / Mail / …', body: 'GET /api/version + dual APK + apkAvailable. Maps encore updates.json.', project: 'platform', category: 'feature', column_id: 'todo', priority: 2 },
      { title: '10 proxies résidentiels sticky (gvWinners)', body: 'Titres froids YouTube <2s. Pas le PC maison.', project: 'music', category: 'infra', column_id: 'todo', priority: 2 },
      { title: 'Extraire idle 377 mp4 → m4a', body: 'ffmpeg hors GET live.', project: 'music', category: 'infra', column_id: 'todo', priority: 2 },
      { title: 'Contacts façon Google', body: 'Noté — pas ce sprint.', project: 'contacts', category: 'feature', column_id: 'later', priority: 3 },
      { title: 'Calendar lieu + invitations', body: 'Noté — pas ce sprint.', project: 'calendar', category: 'feature', column_id: 'later', priority: 3 },
      { title: 'Hubera Hub compte / confidentialité', body: 'Noté — pas ce sprint.', project: 'hub', category: 'feature', column_id: 'later', priority: 3 },
      { title: 'Package commun hors-ligne + mesh ADB', body: 'Noté — pas ce sprint.', project: 'platform', category: 'feature', column_id: 'later', priority: 3 },
      { title: 'Watchtower : rester OFF tant que Music overlay manuel', body: 'Arrêté 6 oct. Label ytmusic.enable=true était dangereux.', project: 'ops', category: 'infra', column_id: 'done', priority: 1 },
      { title: 'Ne pas stopper Cloudity (backends Mail/Drive encore live)', body: 'hubera-*-web = nginx. Cutover plus tard.', project: 'ops', category: 'infra', column_id: 'doing', priority: 1 },
      { title: 'cooking-recipes : stopper après smoke Cook', body: 'Garder volumes.', project: 'cook', category: 'ops', column_id: 'todo', priority: 3 },
      { title: 'budgetai → hubera-budget (cutover, pas delete volumes)', body: 'Pas de stack hubera-budget live.', project: 'budget', category: 'ops', column_id: 'later', priority: 3 },
      { title: 'Porter NOTES.md produits vers content/', body: 'Jobs 323 md, Cloudity archive 206, Music 67…', project: 'docs', category: 'docs', column_id: 'doing', priority: 2 },
      { title: 'DA couleurs / logos / icônes suite', body: 'Noté — pas maintenant.', project: 'platform', category: 'design', column_id: 'later', priority: 4 },
      { title: 'Veille yt-dlp / YouTube / CVE → tâche + mail', body: 'Pas Watchtower sur Music. Informer Paul des MAJ à faire dans le compte / le serveur.', project: 'docs', category: 'infra', column_id: 'todo', priority: 2 },
    ];
    const tx = db.transaction(() => {
      for (const r of rows) {
        ins.run({ id: nid(), ...r, created_at: t, updated_at: t });
      }
    });
    tx();
  }
  const extra = [
    { title: 'Hubera Admin : proxy /admin sur id.hubera.cloud', body: 'Sans ça l’app mobile reçoit le HTML Hubera ID (FormatException doctype). Fallback API cloudity.delhomme.ovh.', project: 'admin', category: 'bug', column_id: 'doing', priority: 1 },
    { title: 'Hubera Docs PWA Nothing + login Hubera ID', body: 'Chrome → écran d’accueil. Tâches projet ici, pas dans Admin.', project: 'docs', category: 'feature', column_id: 'doing', priority: 1 },
    { title: 'Admin web /4dm1n (cloudity.delhomme.ovh) — TLS admin.hubera.cloud plus tard', body: 'admin.hubera.cloud unrecognized name. Utiliser la console Cloudity.', project: 'admin', category: 'infra', column_id: 'later', priority: 3 },
  ];
  const existsTitle = db.prepare('SELECT id FROM tasks WHERE title = ?');
  const insExtra = db.prepare(
    `INSERT INTO tasks (id,title,body,project,category,column_id,priority,created_at,updated_at)
     VALUES (@id,@title,@body,@project,@category,@column_id,@priority,@created_at,@updated_at)`,
  );
  const tExtra = now();
  for (const r of extra) {
    if (existsTitle.get(r.title)) continue;
    insExtra.run({ id: nid(), ...r, created_at: tExtra, updated_at: tExtra });
  }
  db.prepare(`UPDATE tasks SET column_id='done', updated_at=? WHERE title=? AND column_id != 'done'`).run(
    now(),
    'Hubera Admin : proxy /admin sur id.hubera.cloud',
  );
  db.prepare(`UPDATE tasks SET column_id='done', updated_at=? WHERE title=? AND column_id != 'done'`).run(
    now(),
    'Hubera Docs PWA Nothing + login Hubera ID',
  );
  syncReportsFromDisk();
}
function prettyReportTitle(filename) {
  return filename
    .replace(/\.pdf$/i, '')
    .replace(/\.html$/i, '')
    .replace(/[-_]/g, ' ');
}
function syncReportsFromDisk() {
  if (!existsSync(REPORTS_DIR)) return;
  const ins = db.prepare(
    `INSERT INTO reports (id,title,kind,sent_at,filename,summary) VALUES (@id,@title,@kind,@sent_at,@filename,@summary)`,
  );
  const has = db.prepare('SELECT id FROM reports WHERE filename = ?');
  const known = {
    'tests-manuels-hubera-2026-10-06.pdf': { title: 'Tests manuels par app (6 oct)', sent_at: '2026-10-06T16:50:00+02:00', summary: 'Checklist Music→Cook. OTA 352.' },
    'architecture-stream-proxy-music-2026-10-06.pdf': { title: 'Architecture stream / proxy YouTube', sent_at: '2026-10-06T16:50:00+02:00', summary: 'Pas le PC maison. Proxies HTTP.' },
    'hubera-docs-portainer-2026-10-06.pdf': { title: 'Cockpit Docs + stacks Portainer', sent_at: '2026-10-06T17:20:00+02:00', summary: 'Docs, Watchtower OFF, backlog.' },
    'hubera-cahier-unique-2026-10-06.pdf': { title: 'Cahier unique (6 oct)', sent_at: '2026-10-06T18:15:00+02:00', summary: 'Questions stream + jargon, un seul PDF.' },
    'Hubera-Recap-2026-09-28-maps035-fuel-suite.pdf': { title: 'Récap 28 sept Maps/Fuel', sent_at: '2026-09-28T21:13:00+02:00', summary: 'Maps 0.1.35 + Fuel + suite.' },
    'recap-hubera-2026-09-27-maps030-music311.pdf': { title: 'Récap 27 sept Maps/Music', sent_at: '2026-09-27T20:30:00+02:00', summary: 'Maps 0.1.30 + Music 1.3.311.' },
    'recap-hubera-2026-09-25-maps-music-pass.pdf': { title: 'Récap 25 sept Maps/Music/Pass', sent_at: '2026-09-25T21:29:00+02:00', summary: 'Trois apps.' },
    'synthese-hubera-2026-09-21-recap.pdf': { title: 'Synthèse 21 sept', sent_at: '2026-09-21T18:00:00+02:00', summary: 'État suite.' },
    'synthese-hubera-2026-09-20-recap.pdf': { title: 'Synthèse 20 sept', sent_at: '2026-09-20T10:38:00+02:00', summary: 'Récap journée.' },
    'synthese-hubera-2026-09-19.pdf': { title: 'Synthèse 19 sept', sent_at: '2026-09-19T16:33:00+02:00', summary: 'Restructuration Hubera.' },
    'plan-produits-hubera-2026-09-20.pdf': { title: 'Plan produits Hubera', sent_at: '2026-09-20T16:52:00+02:00', summary: 'Cartographie produits.' },
    'recap-ameliorations-music-fuel-2026-09-20.pdf': { title: 'Améliorations Music/Fuel 20 sept', sent_at: '2026-09-20T18:26:00+02:00', summary: 'Correctifs.' },
    'restructuration-hubera-2026-09-19.pdf': { title: 'Restructuration 19 sept', sent_at: '2026-09-19T16:00:00+02:00', summary: 'Organisation repos / stacks.' },
  };
  for (const name of readdirSync(REPORTS_DIR)) {
    if (!name.endsWith('.pdf')) continue;
    if (has.get(name)) continue;
    const meta = known[name] || {
      title: prettyReportTitle(name),
      sent_at: new Date(statSync(join(REPORTS_DIR, name)).mtimeMs).toISOString(),
      summary: 'PDF agent / mail.',
    };
    ins.run({ id: nid(), kind: 'pdf', filename: name, ...meta });
  }
}
seed();

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

const loginHits = new Map();
function tooMany(ip) {
  const nowMs = Date.now();
  const row = loginHits.get(ip) || [];
  const fresh = row.filter((t) => nowMs - t < 60_000);
  fresh.push(nowMs);
  loginHits.set(ip, fresh);
  return fresh.length > 12;
}

function readSession(req) {
  const raw = req.cookies?.docs_session || '';
  if (!raw) return null;
  const row = db.prepare('SELECT email, expires_at FROM sessions WHERE token = ?').get(hashSession(raw));
  if (!row || row.expires_at < Date.now()) return null;
  return { email: row.email };
}

function issueSession(res, email) {
  const token = randomBytes(24).toString('hex');
  const ttl = 14 * 24 * 3600 * 1000;
  db.prepare('INSERT INTO sessions (token, email, created_at, expires_at) VALUES (?,?,?,?)').run(
    hashSession(token),
    email,
    Date.now(),
    Date.now() + ttl,
  );
  res.cookie('docs_session', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: ttl,
    path: '/',
  });
}

function requireAuth(req, res, next) {
  const s = readSession(req);
  if (!s) return res.status(401).json({ error: 'auth' });
  req.admin = s;
  next();
}

function isAdminEmail(email) {
  return ADMINS.includes(String(email || '').trim().toLowerCase());
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, app: 'hubera-docs', version: '0.1.0' });
});

app.get('/api/auth/me', (req, res) => {
  const s = readSession(req);
  if (!s) return res.status(401).json({ error: 'auth' });
  res.json({ email: s.email, admins: ADMINS.length });
});

app.post('/api/auth/login', async (req, res) => {
  const ip = req.ip || 'x';
  if (tooMany(ip)) return res.status(429).json({ error: 'rate' });
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');
  if (!email || !password) return res.status(400).json({ error: 'champs' });
  if (!isAdminEmail(email)) return res.status(403).json({ error: 'allowlist' });
  try {
    const r = await fetch(`${ID_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await r.json().catch(() => ({}));
    if (data.requires_2fa) return res.status(200).json({ requires_2fa: true });
    if (!r.ok || !data.access_token) return res.status(401).json({ error: 'invalid' });
    issueSession(res, email);
    res.json({ ok: true, email });
  } catch {
    res.status(502).json({ error: 'id' });
  }
});

app.post('/api/auth/login/2fa', async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const code = String(req.body?.code || '').trim();
  if (!email || !code) return res.status(400).json({ error: 'champs' });
  if (!isAdminEmail(email)) return res.status(403).json({ error: 'allowlist' });
  try {
    const r = await fetch(`${ID_URL}/auth/2fa/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code }),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok || !data.access_token) return res.status(401).json({ error: 'invalid' });
    issueSession(res, email);
    res.json({ ok: true, email });
  } catch {
    res.status(502).json({ error: 'id' });
  }
});

app.get('/go', (req, res) => {
  const raw = String(req.query.t || '');
  if (!raw || raw.length < 16) return res.status(404).send('lien invalide');
  const row = db.prepare('SELECT email, expires_at, used FROM claims WHERE token = ?').get(hashSession(raw));
  if (!row || row.used || row.expires_at < Date.now()) {
    return res.status(410).send('Lien expiré. Rouvre Hubera Docs.');
  }
  db.prepare('UPDATE claims SET used = 1 WHERE token = ?').run(hashSession(raw));
  issueSession(res, row.email);
  res.redirect(302, '/#dash');
});

app.post('/api/auth/logout', (req, res) => {
  const raw = req.cookies?.docs_session || '';
  if (raw) db.prepare('DELETE FROM sessions WHERE token = ?').run(hashSession(raw));
  res.clearCookie('docs_session', { path: '/' });
  res.json({ ok: true });
});

app.get('/api/dashboard', requireAuth, (_req, res) => {
  const byCol = db.prepare('SELECT column_id, COUNT(*) AS c FROM tasks GROUP BY column_id').all();
  const byProj = db.prepare('SELECT project, COUNT(*) AS c FROM tasks GROUP BY project ORDER BY c DESC').all();
  const recentTasks = db.prepare('SELECT * FROM tasks ORDER BY updated_at DESC LIMIT 8').all();
  const recentReports = db.prepare('SELECT * FROM reports ORDER BY sent_at DESC LIMIT 6').all();
  const remarks = db.prepare('SELECT COUNT(*) AS c FROM remarks').get().c;
  res.json({
    byCol,
    byProj,
    recentTasks,
    recentReports,
    remarks,
    stacksNote: 'Voir documentation /ops/portainer',
  });
});

app.get('/api/tasks', requireAuth, (req, res) => {
  const project = String(req.query.project || '');
  const rows = project
    ? db.prepare('SELECT * FROM tasks WHERE project = ? ORDER BY priority, updated_at DESC').all(project)
    : db.prepare('SELECT * FROM tasks ORDER BY priority, updated_at DESC').all();
  res.json({ tasks: rows });
});

app.post('/api/tasks', requireAuth, (req, res) => {
  const title = String(req.body?.title || '').trim();
  if (!title) return res.status(400).json({ error: 'title' });
  const t = now();
  const row = {
    id: nid(),
    title,
    body: String(req.body?.body || ''),
    project: String(req.body?.project || 'platform'),
    category: String(req.body?.category || 'feature'),
    column_id: String(req.body?.column_id || 'todo'),
    priority: Number(req.body?.priority || 2),
    created_at: t,
    updated_at: t,
  };
  db.prepare(
    `INSERT INTO tasks (id,title,body,project,category,column_id,priority,created_at,updated_at)
     VALUES (@id,@title,@body,@project,@category,@column_id,@priority,@created_at,@updated_at)`,
  ).run(row);
  res.json(row);
});

app.patch('/api/tasks/:id', requireAuth, (req, res) => {
  const cur = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  if (!cur) return res.status(404).json({ error: 'missing' });
  const next = {
    ...cur,
    title: req.body?.title ?? cur.title,
    body: req.body?.body ?? cur.body,
    project: req.body?.project ?? cur.project,
    category: req.body?.category ?? cur.category,
    column_id: req.body?.column_id ?? cur.column_id,
    priority: req.body?.priority ?? cur.priority,
    updated_at: now(),
  };
  db.prepare(
    `UPDATE tasks SET title=@title, body=@body, project=@project, category=@category,
     column_id=@column_id, priority=@priority, updated_at=@updated_at WHERE id=@id`,
  ).run(next);
  res.json(next);
});

app.get('/api/docs', requireAuth, (_req, res) => {
  const files = [];
  const walk = (dir, prefix = '') => {
    if (!existsSync(dir)) return;
    for (const name of readdirSync(dir)) {
      if (name.startsWith('.')) continue;
      const p = join(dir, name);
      const st = statSync(p);
      const rel = prefix ? `${prefix}/${name}` : name;
      if (st.isDirectory()) walk(p, rel);
      else if (extname(name) === '.md') files.push({ path: rel, bytes: st.size });
    }
  };
  walk(CONTENT_DIR);
  res.json({ files });
});

app.get('/api/docs/file', requireAuth, (req, res) => {
  const rel = String(req.query.path || '').replace(/^\/+/, '');
  if (!rel || rel.includes('..')) return res.status(400).json({ error: 'path' });
  const abs = resolve(join(CONTENT_DIR, rel));
  if (!abs.startsWith(resolve(CONTENT_DIR))) return res.status(400).json({ error: 'path' });
  if (!existsSync(abs) || extname(abs) !== '.md') return res.status(404).json({ error: 'missing' });
  res.type('text/markdown').send(readFileSync(abs, 'utf8'));
});

app.put('/api/docs/file', requireAuth, (req, res) => {
  const rel = String(req.body?.path || '').replace(/^\/+/, '');
  if (!rel.endsWith('.md') || rel.includes('..')) return res.status(400).json({ error: 'path' });
  const abs = resolve(join(CONTENT_DIR, rel));
  if (!abs.startsWith(resolve(CONTENT_DIR))) return res.status(400).json({ error: 'path' });
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, String(req.body?.markdown || ''), 'utf8');
  res.json({ ok: true, path: rel });
});

app.get('/api/reports', requireAuth, (_req, res) => {
  const dbRows = db.prepare('SELECT * FROM reports ORDER BY sent_at DESC').all();
  let files = [];
  if (existsSync(REPORTS_DIR)) {
    files = readdirSync(REPORTS_DIR)
      .filter((n) => n.endsWith('.pdf') || n.endsWith('.html'))
      .map((n) => ({ filename: n, bytes: statSync(join(REPORTS_DIR, n)).size }));
  }
  res.json({ reports: dbRows, files });
});

app.get('/api/reports/file/:name', requireAuth, (req, res) => {
  const name = String(req.params.name || '');
  if (name.includes('..') || name.includes('/')) return res.status(400).end();
  const abs = join(REPORTS_DIR, name);
  if (!existsSync(abs)) return res.status(404).end();
  res.sendFile(abs);
});

app.get('/api/gantt', requireAuth, (_req, res) => {
  res.json({
    objective: 'Suite Hubera interconnectée, déployable unitairement, Music/Maps/Fuel d’abord.',
    bars: [
      { id: 'music', label: 'Music lecture + OTA', start: '2026-09-01', end: '2026-10-20', pct: 72 },
      { id: 'maps', label: 'Maps + Fuel in-Maps', start: '2026-09-15', end: '2026-10-25', pct: 58 },
      { id: 'fuel', label: 'Fuel budget unique', start: '2026-09-01', end: '2026-10-30', pct: 55 },
      { id: 'id', label: 'Hubera ID partout', start: '2026-09-19', end: '2026-12-01', pct: 35 },
      { id: 'cloud', label: 'Mail/Drive/Pass cutover hors Cloudity', start: '2026-10-15', end: '2027-01-15', pct: 15 },
      { id: 'docs', label: 'Hubera Docs cockpit', start: '2026-10-06', end: '2026-11-01', pct: 55 },
      { id: 'da', label: 'DA couleurs / icônes', start: '2026-11-01', end: '2026-12-15', pct: 0 },
    ],
  });
});

app.get('/api/remarks', requireAuth, (_req, res) => {
  res.json({ remarks: db.prepare('SELECT * FROM remarks ORDER BY created_at DESC LIMIT 50').all() });
});

app.post('/api/remarks', requireAuth, (req, res) => {
  const appName = String(req.body?.app || 'music').trim();
  const body = String(req.body?.body || '').trim();
  if (!body) return res.status(400).json({ error: 'body' });
  const t = now();
  const task = {
    id: nid(),
    title: `[retour ${appName}] ${body.slice(0, 72)}`,
    body,
    project: appName,
    category: 'bug',
    column_id: 'todo',
    priority: 1,
    created_at: t,
    updated_at: t,
  };
  db.prepare(
    `INSERT INTO tasks (id,title,body,project,category,column_id,priority,created_at,updated_at)
     VALUES (@id,@title,@body,@project,@category,@column_id,@priority,@created_at,@updated_at)`,
  ).run(task);
  const remark = { id: nid(), app: appName, body, task_id: task.id, created_at: t };
  db.prepare('INSERT INTO remarks (id,app,body,task_id,created_at) VALUES (@id,@app,@body,@task_id,@created_at)').run(
    remark,
  );
  res.json({ remark, task });
});

app.use(express.static(WEB_DIR, {
  maxAge: 0,
  etag: true,
  index: false,
  setHeaders(res, filePath) {
    if (filePath.endsWith('.html') || filePath.endsWith('.js') || filePath.endsWith('.css')) {
      res.setHeader('Cache-Control', 'no-store');
    }
  },
}));
app.get(/^(?!\/api).*/, (_req, res) => {
  res.sendFile(join(WEB_DIR, 'index.html'));
});

app.listen(PORT, () => {
  console.info(`[hubera-docs] http://127.0.0.1:${PORT}`);
});
