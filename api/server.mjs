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
CREATE TABLE IF NOT EXISTS columns (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0
);
`);

function hasColumn(table, col) {
  return db.prepare(`PRAGMA table_info(${table})`).all().some((c) => c.name === col);
}
if (!hasColumn('reports', 'owner_email')) {
  db.exec('ALTER TABLE reports ADD COLUMN owner_email TEXT');
}
if (!hasColumn('remarks', 'kind')) {
  db.exec("ALTER TABLE remarks ADD COLUMN kind TEXT NOT NULL DEFAULT 'retour'");
}
const WORKSPACE_EMAIL = ADMINS[0] || 'paul@delhomme.ovh';
db.prepare(`UPDATE reports SET owner_email = ? WHERE owner_email IS NULL OR owner_email = ''`).run(WORKSPACE_EMAIL);

function versionCodeFromSemver(semver) {
  const parts = String(semver || '0.0.0').split('.').map((n) => parseInt(n, 10) || 0);
  return (parts[0] || 0) * 10_000 + (parts[1] || 0) * 100 + (parts[2] || 0);
}
function readAppVersion() {
  try {
    return readFileSync(join(ROOT, 'VERSION'), 'utf8').trim() || '0.2.0';
  } catch {
    return process.env.APP_VERSION || '0.2.0';
  }
}
const APP_VERSION = readAppVersion();
const APK_DIR = process.env.APK_DIR || join(DATA_DIR, 'apk');
mkdirSync(APK_DIR, { recursive: true });
const PKG_HUBERA = 'cloud.hubera.docs';
const PKG_LEGACY = 'ovh.delhomme.hubera.docs';

function normalizeDocsPackage(pkg) {
  const p = String(pkg || '').trim();
  if (p === PKG_LEGACY) return PKG_LEGACY;
  if (p === PKG_HUBERA || p.startsWith(`${PKG_HUBERA}.`)) return PKG_HUBERA;
  return null;
}

function apkSlotForPackage(pkg) {
  const norm = normalizeDocsPackage(pkg);
  if (norm === PKG_LEGACY) {
    return {
      path: join(APK_DIR, 'ovh.delhomme.hubera.docs.apk'),
      manifestPath: join(APK_DIR, 'ovh.delhomme.hubera.docs.json'),
      pkg: PKG_LEGACY,
      file: 'ovh.delhomme.hubera.docs.apk',
    };
  }
  return {
    path: join(APK_DIR, 'cloud.hubera.docs.apk'),
    manifestPath: join(APK_DIR, 'cloud.hubera.docs.json'),
    pkg: PKG_HUBERA,
    file: 'cloud.hubera.docs.apk',
  };
}

function readApkManifest(file) {
  if (!existsSync(file)) return null;
  try {
    return JSON.parse(readFileSync(file, 'utf8'));
  } catch {
    return null;
  }
}

function seedColumns() {
  const n = db.prepare('SELECT COUNT(*) AS c FROM columns').get().c;
  if (n > 0) return;
  const ins = db.prepare('INSERT INTO columns (id, label, position) VALUES (?, ?, ?)');
  [
    ['todo', 'À faire', 0],
    ['doing', 'En cours', 1],
    ['done', 'Fait', 2],
    ['later', 'Plus tard', 3],
  ].forEach((row) => ins.run(...row));
}
seedColumns();

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
    { title: 'chrome Google-like — suite mobile', body: 'Module Compose HuberaScaffold + Flutter HuberaScaffold. P0 : Music Maps Fuel Docs Calendar Mail Pass Jobs ID. Drive exclu (autre agent). Overlay Samsung -r. OTA jamais forcée. Voir content/guides/hubera-chrome-google-like.md', project: 'platform', category: 'feature', column_id: 'doing', priority: 1 },
    { title: 'Maps crash Overpass XML JSONException (0.1.75)', body: 'Crash ouverture Overpass XML/HTML. Corrigé 0.1.76 509c2bd. Tests daa8d5e0.', project: 'maps', category: 'bug', column_id: 'done', priority: 1 },
    { title: 'Maps 0.1.76 overlay Blackview', body: 'Samsung déjà 0.1.76 cloud+legacy. ADB BV absent 7 oct soir. SHA APK 7eca83f0. Pas Nothing. Remplacé par overlay 0.1.77.', project: 'maps', category: 'test', column_id: 'done', priority: 2 },
    { title: 'Maps 0.1.77 menu infos trajet sous limite', body: 'Jauge Fuel live, km restants hors suivi libre, ETA, conso/plein. Overlay Samsung cloud+legacy 0.1.77 vc 78. SHA 477f351a. HUD 0.1.75/76 inchangé. OTA mandatory false.', project: 'maps', category: 'feature', column_id: 'done', priority: 1 },
    { title: 'Maps 0.1.77 overlay Blackview', body: 'Samsung 0.1.77. ADB BV si présent. Pas Nothing.', project: 'maps', category: 'test', column_id: 'todo', priority: 1 },
    { title: 'Fuel jauge → modèle conso IA (1.4.167)', body: 'Save jauge recalibre L/100 + consumptionLearnFactor par voiture. Dual APK 1.4.167 vc 191 overlay Samsung 8 oct. SHA baf7c860. OTA forceUpdate false. Pas de budget. Pas Nothing.', project: 'fuel', category: 'feature', column_id: 'done', priority: 1 },
    { title: 'Maps 0.1.75 overlay Blackview', body: 'Remplacé par overlay 0.1.76. ADB toujours absent.', project: 'maps', category: 'test', column_id: 'done', priority: 2 },
    { title: 'Music 1.3.357 overlay Blackview + verif paroles', body: 'Samsung déjà p+1.3.357. Offset perso, next karaoké, local online. ADB BV absent.', project: 'music', category: 'test', column_id: 'todo', priority: 1 },
    { title: 'Music 1.3.356 overlay Blackview + verif paroles 8s', body: 'Samsung déjà p+1.3.356 puis 357. Liste paroles scrollable, retour auto 8 s.', project: 'music', category: 'test', column_id: 'done', priority: 2 },
    { title: 'Sélecteur de compte Hubera ID inter-apps Android', body: 'AccountManager cloud.hubera.id + ContentProvider. Music picker, Docs SSO cookie, hook Maps/Fuel/Pass. Pas d’injection paul@ Nothing.', project: 'id', category: 'feature', column_id: 'done', priority: 1 },
    { title: 'Pass Autofill Android : build APK + overlay + activer le service', body: '009ceb8 + 0e03acd bouton settings. APK téléphone encore 0.1.2 overlay Samsung.', project: 'pass', category: 'feature', column_id: 'doing', priority: 1 },
    { title: 'Drive 6d25a47 share HEAD — déploiement Cloudity', body: 'Liens partage HEAD public, plus de 401 aperçu. Code en HEAD, pas déployé Cloudity.', project: 'drive', category: 'feature', column_id: 'todo', priority: 2 },
    { title: 'Fuel 1.4.166+ overlay Samsung (encore 1.4.165)', body: 'Budget unique toujours ouvert. Pas de 166 overlay 7 oct soir. Smoke accueil OK.', project: 'fuel', category: 'feature', column_id: 'doing', priority: 1 },
    { title: 'Hubera Admin : proxy /admin sur id.hubera.cloud', body: 'Sans ça l’app mobile reçoit le HTML Hubera ID (FormatException doctype). Fallback API cloudity.delhomme.ovh.', project: 'admin', category: 'bug', column_id: 'doing', priority: 1 },
    { title: 'Hubera Docs PWA Nothing + login Hubera ID', body: 'Chrome → écran d’accueil. Tâches projet ici, pas dans Admin.', project: 'docs', category: 'feature', column_id: 'doing', priority: 1 },
    { title: 'Hubera Docs app Android native Compose (pas WebView)', body: 'Login ID, dashboard, kanban popup+FAB+colonnes, docs, PDF natif, Gantt, retours. Dual APK cloud.hubera.docs 0.2.0 vc 200. OTA non forcée. Overlay Samsung -r USB R5CT7263YJL. Pas Nothing.', project: 'docs', category: 'feature', column_id: 'done', priority: 1 },
    { title: 'Hubera Docs web prod cutover 0.2.0', body: 'docs.hubera.cloud : front cahier unique, colonnes, rapports MD+PDF 7 oct, dual APK OTA. Rebuild/docker cp sans down -v. Volume sqlite intact.', project: 'docs', category: 'ops', column_id: 'done', priority: 1 },
    { title: 'Admin web /4dm1n (cloudity.delhomme.ovh) — TLS admin.hubera.cloud plus tard', body: 'admin.hubera.cloud unrecognized name. Utiliser la console Cloudity.', project: 'admin', category: 'infra', column_id: 'later', priority: 3 },
    { title: 'Calendar grille utilisable mois/semaine/jour', body: 'Override backlog 8 oct. Web SPA /app/ + Flutter 0.1.5 vc 6. CRUD événements, liste du jour, login Hubera ID. Dual APK. Overlay Samsung R5CT7263YJL -r cloud.hubera.calendar. Pas Nothing. API encore Cloudity calendar-service.', project: 'calendar', category: 'feature', column_id: 'done', priority: 1 },
    { title: 'Calendar invitations RSVP + salles + Meet', body: 'Pas ce lot. Champ invités e-mail (Contacts) déjà dans l’éditeur mobile.', project: 'calendar', category: 'feature', column_id: 'later', priority: 3 },
    { title: 'Calendar lieux Maps (picker)', body: 'Lieu reste un texte libre. Branche Maps plus tard.', project: 'calendar', category: 'feature', column_id: 'later', priority: 3 },
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
  db.prepare(`UPDATE tasks SET column_id='done', updated_at=? WHERE title=? AND column_id != 'done'`).run(
    now(),
    'Maps crash Overpass XML JSONException (0.1.75)',
  );
  db.prepare(`UPDATE tasks SET column_id='done', updated_at=? WHERE title=? AND column_id != 'done'`).run(
    now(),
    'Maps 0.1.75 overlay Blackview',
  );
  db.prepare(`UPDATE tasks SET column_id='done', updated_at=? WHERE title=? AND column_id != 'done'`).run(
    now(),
    'Music 1.3.356 overlay Blackview + verif paroles 8s',
  );
  db.prepare(`UPDATE tasks SET column_id='done', updated_at=? WHERE title=? AND column_id != 'done'`).run(
    now(),
    'Maps 0.1.77 menu infos trajet sous limite',
  );
  db.prepare(`UPDATE tasks SET column_id='done', updated_at=? WHERE title=? AND column_id != 'done'`).run(
    now(),
    'Maps 0.1.76 overlay Blackview',
  );
  db.prepare(`UPDATE tasks SET column_id='done', body=?, updated_at=? WHERE title=? AND column_id != 'done'`).run(
    'Save jauge recalibre L/100 + consumptionLearnFactor par voiture. Dual APK 1.4.167 vc 191 overlay Samsung 8 oct. SHA baf7c860. OTA forceUpdate false. Pas de budget. Pas Nothing.',
    now(),
    'Fuel jauge → modèle conso IA (1.4.167)',
  );
  db.prepare(`UPDATE tasks SET column_id='done', updated_at=? WHERE title=? AND column_id != 'done'`).run(
    now(),
    'Hubera Docs app Android native Compose (pas WebView)',
  );
  db.prepare(`UPDATE tasks SET column_id='done', updated_at=? WHERE title=? AND column_id != 'done'`).run(
    now(),
    'Hubera Docs web prod cutover 0.2.0',
  );
  db.prepare(`UPDATE tasks SET column_id='done', updated_at=? WHERE title=? AND column_id != 'done'`).run(
    now(),
    'Calendar grille utilisable mois/semaine/jour',
  );
  syncReportsFromDisk();
}
function prettyReportTitle(filename) {
  return filename
    .replace(/\.pdf$/i, '')
    .replace(/\.html$/i, '')
    .replace(/\.md$/i, '')
    .replace(/[-_]/g, ' ');
}
function kindOfReport(name) {
  const ext = extname(name).toLowerCase();
  if (ext === '.pdf') return 'pdf';
  if (ext === '.html') return 'html';
  if (ext === '.md') return 'md';
  return '';
}
function summaryFromMarkdown(abs) {
  try {
    const text = readFileSync(abs, 'utf8');
    const title = (text.match(/^#\s+(.+)/m) || [])[1] || '';
    const para = text
      .replace(/^#.+\n+/m, '')
      .split(/\n\n+/)
      .map((s) => s.replace(/\n/g, ' ').trim())
      .find((s) => s && !s.startsWith('#')) || '';
    return { title: title.trim(), summary: para.slice(0, 220) };
  } catch {
    return { title: '', summary: '' };
  }
}
function reportVisibleTo(email) {
  const e = String(email || '').trim().toLowerCase();
  return isAdminEmail(e);
}
function syncReportsFromDisk() {
  if (!existsSync(REPORTS_DIR)) return;
  const ins = db.prepare(
    `INSERT INTO reports (id,title,kind,sent_at,filename,summary,owner_email)
     VALUES (@id,@title,@kind,@sent_at,@filename,@summary,@owner_email)`,
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
    'Hubera-2026-10-07-soir-lyrics-suite.pdf': {
      title: 'Soir 7 oct — paroles + suite',
      sent_at: '2026-10-07T17:11:00+02:00',
      summary: 'Music 1.3.357, Maps 0.1.76, overlay Samsung. Cahier Paul.',
    },
    'Hubera-2026-10-07-apres-midi-maps-music-pass.pdf': {
      title: 'Après-midi 7 oct — Maps / Music / Pass',
      sent_at: '2026-10-07T16:24:00+02:00',
      summary: 'Récap après-midi.',
    },
    '2026-10-07-soir-lyrics.md': {
      title: 'Soir 7 oct — notes paroles',
      sent_at: '2026-10-07T17:10:00+02:00',
      summary: 'Compte-rendu markdown (même lot que le PDF lyrics).',
    },
  };
  for (const name of readdirSync(REPORTS_DIR)) {
    const kind = kindOfReport(name);
    if (!kind) continue;
    if (has.get(name)) continue;
    const abs = join(REPORTS_DIR, name);
    const mdMeta = kind === 'md' ? summaryFromMarkdown(abs) : { title: '', summary: '' };
    const meta = known[name] || {
      title: mdMeta.title || prettyReportTitle(name),
      sent_at: new Date(statSync(abs).mtimeMs).toISOString(),
      summary: mdMeta.summary || (kind === 'md' ? 'Note markdown du cahier.' : 'PDF / mail du cahier Paul.'),
    };
    ins.run({
      id: nid(),
      kind,
      filename: name,
      owner_email: WORKSPACE_EMAIL,
      ...meta,
    });
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

function bearerToken(req) {
  const h = String(req.get('authorization') || '');
  if (h.toLowerCase().startsWith('bearer ')) return h.slice(7).trim();
  return String(req.get('x-docs-token') || '').trim();
}

function readSession(req) {
  const raw = req.cookies?.docs_session || bearerToken(req) || '';
  if (!raw) return null;
  const row = db.prepare('SELECT email, expires_at FROM sessions WHERE token = ?').get(hashSession(raw));
  if (!row || row.expires_at < Date.now()) return null;
  return { email: row.email, token: raw };
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
  return token;
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
  res.json({ ok: true, app: 'hubera-docs', version: APP_VERSION });
});

function apkPublicInfo(pkg) {
  const slot = apkSlotForPackage(pkg);
  let path = slot.path;
  if (!existsSync(path) && existsSync(APK_DIR)) {
    const files = readdirSync(APK_DIR).filter((n) => n.endsWith('.apk'));
    const fallback =
      slot.pkg === PKG_LEGACY
        ? files.find((n) => n.includes('legacy') || n.includes('ovh.delhomme'))
        : files.find((n) => n.includes('cloud.hubera.docs') && !n.includes('legacy')) || files[0];
    if (fallback) path = join(APK_DIR, fallback);
  }
  const ready = existsSync(path);
  const st = ready ? statSync(path) : null;
  const manifest = readApkManifest(slot.manifestPath);
  const versionName = String(manifest?.versionName || APP_VERSION).replace(/^[pbd]\+/, '');
  const versionCode = Number(manifest?.versionCode) || versionCodeFromSemver(versionName);
  const q = slot.pkg === PKG_LEGACY ? '?package=ovh.delhomme.hubera.docs' : '?package=cloud.hubera.docs';
  return {
    ready,
    versionName,
    versionCode,
    filename: ready ? path.split('/').pop() : slot.file,
    path: ready ? path : null,
    package: manifest?.package || slot.pkg,
    sizeBytes: st?.size ?? manifest?.sizeBytes ?? null,
    downloadPath: `/api/apk${q}`,
  };
}

app.get('/api/version', (req, res) => {
  const clientVer = String(req.query.clientVersion || '')
    .replace(/^[pbd]\+/, '')
    .trim();
  const clientCode = Number(req.query.clientVersionCode || 0) || 0;
  const clientPkg = String(req.query.clientPackage || req.query.package || '');
  const apk = apkPublicInfo(clientPkg);
  const apkName = String(apk.versionName || '')
    .replace(/^[pbd]\+/, '')
    .trim();
  const apkCode = Number(apk.versionCode || 0) || 0;
  const cmp = (a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
  // Jamais proposer une APK plus vieille que le téléphone.
  const apkNewerThanPhone =
    Boolean(apk.ready) &&
    apkCode > 0 &&
    (clientCode <= 0 || apkCode >= clientCode) &&
    (!clientVer || cmp(apkName || APP_VERSION, clientVer) >= 0);
  let advertised = APP_VERSION;
  if (apkNewerThanPhone && apkName && cmp(apkName, advertised) > 0) advertised = apkName;
  if (clientVer && cmp(clientVer, advertised) > 0) advertised = clientVer;
  res.json({
    version: advertised,
    appVersion: `p+${advertised}`,
    minVersion: '0.1.0',
    forceUpdate: false,
    mandatory: false,
    apkAvailable: apkNewerThanPhone && cmp(apkName || APP_VERSION, clientVer || '0') > 0,
    apkUrl: apkNewerThanPhone ? apk.downloadPath : null,
    apkVersion: apkNewerThanPhone ? apk.versionName : null,
    apkVersionCode: apkNewerThanPhone ? apkCode : null,
    webUrl: 'https://docs.hubera.cloud',
  });
});

app.get('/api/version-notes', (_req, res) => {
  const p = join(ROOT, 'VERSION_NOTES.json');
  if (!existsSync(p)) return res.json({ versions: [] });
  try {
    const data = JSON.parse(readFileSync(p, 'utf8'));
    res.setHeader('Cache-Control', 'public, max-age=60');
    return res.json(data);
  } catch {
    return res.json({ versions: [] });
  }
});

app.get('/api/apk', requireAuth, (req, res) => {
  const apk = apkPublicInfo(String(req.query.package || req.query.clientPackage || ''));
  if (!apk.ready || !apk.path) return res.status(404).json({ error: 'apk' });
  res.setHeader('Content-Type', 'application/vnd.android.package-archive');
  res.setHeader('Content-Disposition', `attachment; filename="${apk.filename}"`);
  res.sendFile(apk.path);
});

app.get('/api/auth/me', (req, res) => {
  const s = readSession(req);
  if (!s) return res.status(401).json({ error: 'auth' });
  res.json({
    email: s.email,
    admins: ADMINS.length,
    workspace: 'cahier-unique',
    title: 'Hubera Docs — cahier unique',
  });
});

function emailFromProbe(data) {
  if (!data || typeof data !== 'object') return '';
  const direct = String(data.email || '').trim().toLowerCase();
  if (direct) return direct;
  const user = data.user && typeof data.user === 'object' ? data.user : null;
  return String(user?.email || '').trim().toLowerCase();
}

async function emailFromHuberaToken(accessToken) {
  const token = String(accessToken || '').trim();
  if (!token) return '';
  const probes = [
    `${ID_URL}/auth/validate`,
    'https://music.hubera.cloud/api/auth/me',
    'https://api.cloudity.delhomme.ovh/auth/validate',
    'https://mail.hubera.cloud/auth/validate',
  ];
  for (const url of probes) {
    try {
      const r = await fetch(url, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        signal: AbortSignal.timeout(8000),
      });
      if (!r.ok) continue;
      const email = emailFromProbe(await r.json().catch(() => ({})));
      if (email) return email;
    } catch {
      /* hôte suivant */
    }
  }
  return '';
}

app.post('/api/auth/login/sso', async (req, res) => {
  const ip = req.ip || 'x';
  if (tooMany(ip)) return res.status(429).json({ error: 'rate' });
  const token = String(req.body?.access_token || req.body?.accessToken || '').trim();
  if (!token) return res.status(400).json({ error: 'champs' });
  try {
    const email = await emailFromHuberaToken(token);
    if (!email) return res.status(401).json({ error: 'invalid' });
    if (!isAdminEmail(email)) return res.status(403).json({ error: 'allowlist' });
    const session = issueSession(res, email);
    res.json({ ok: true, email, token: session });
  } catch {
    res.status(502).json({ error: 'id' });
  }
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
    const token = issueSession(res, email);
    res.json({ ok: true, email, token });
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
    const token = issueSession(res, email);
    res.json({ ok: true, email, token });
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

app.get('/api/dashboard', requireAuth, (req, res) => {
  syncReportsFromDisk();
  const byCol = db.prepare('SELECT column_id, COUNT(*) AS c FROM tasks GROUP BY column_id').all();
  const byProj = db.prepare('SELECT project, COUNT(*) AS c FROM tasks GROUP BY project ORDER BY c DESC').all();
  const recentTasks = db.prepare('SELECT * FROM tasks ORDER BY updated_at DESC LIMIT 8').all();
  const recentReports = db
    .prepare(
      `SELECT * FROM reports
       WHERE owner_email IS NULL OR owner_email = '' OR owner_email = ? OR owner_email = ?
       ORDER BY sent_at DESC LIMIT 8`,
    )
    .all(req.admin.email, WORKSPACE_EMAIL);
  const remarks = db.prepare('SELECT COUNT(*) AS c FROM remarks').get().c;
  res.json({
    title: 'Cahier unique',
    subtitle: `Cockpit de ${req.admin.email} — tâches, docs, PDF et retours au même endroit.`,
    email: req.admin.email,
    byCol,
    byProj,
    recentTasks,
    recentReports,
    remarks,
    stacksNote: 'Voir documentation /guides/portainer-stacks.md',
  });
});

function slugCol(label) {
  const s = String(label || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return s || `col-${nid()}`;
}

app.get('/api/columns', requireAuth, (_req, res) => {
  seedColumns();
  res.json({ columns: db.prepare('SELECT * FROM columns ORDER BY position, label').all() });
});

app.post('/api/columns', requireAuth, (req, res) => {
  const label = String(req.body?.label || '').trim();
  if (!label) return res.status(400).json({ error: 'label' });
  let id = String(req.body?.id || slugCol(label));
  if (db.prepare('SELECT id FROM columns WHERE id = ?').get(id)) id = `${id}-${nid().slice(0, 4)}`;
  const max = db.prepare('SELECT COALESCE(MAX(position), -1) AS m FROM columns').get().m;
  const row = { id, label, position: max + 1 };
  db.prepare('INSERT INTO columns (id, label, position) VALUES (@id, @label, @position)').run(row);
  res.json(row);
});

app.patch('/api/columns/:id', requireAuth, (req, res) => {
  const cur = db.prepare('SELECT * FROM columns WHERE id = ?').get(req.params.id);
  if (!cur) return res.status(404).json({ error: 'missing' });
  const next = {
    ...cur,
    label: req.body?.label != null ? String(req.body.label).trim() || cur.label : cur.label,
    position: req.body?.position != null ? Number(req.body.position) : cur.position,
  };
  db.prepare('UPDATE columns SET label=@label, position=@position WHERE id=@id').run(next);
  res.json(next);
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

app.get('/api/reports', requireAuth, (req, res) => {
  syncReportsFromDisk();
  const email = req.admin.email;
  const dbRows = db
    .prepare(
      `SELECT * FROM reports
       WHERE owner_email IS NULL OR owner_email = '' OR owner_email = ? OR owner_email = ?
       ORDER BY sent_at DESC`,
    )
    .all(email, WORKSPACE_EMAIL);
  let files = [];
  if (existsSync(REPORTS_DIR)) {
    files = readdirSync(REPORTS_DIR)
      .filter((n) => ['.pdf', '.html', '.md'].includes(extname(n).toLowerCase()))
      .map((n) => ({ filename: n, bytes: statSync(join(REPORTS_DIR, n)).size, kind: kindOfReport(n) }));
  }
  res.json({
    reports: dbRows,
    files,
    forUser: email,
    workspace: 'cahier-unique',
  });
});

app.get('/api/reports/file/:name', requireAuth, (req, res) => {
  const name = String(req.params.name || '');
  if (name.includes('..') || name.includes('/')) return res.status(400).end();
  const abs = join(REPORTS_DIR, name);
  if (!existsSync(abs)) return res.status(404).end();
  const ext = extname(name).toLowerCase();
  if (ext === '.pdf') res.type('application/pdf');
  else if (ext === '.html') res.type('text/html; charset=utf-8');
  else if (ext === '.md') res.type('text/markdown; charset=utf-8');
  res.setHeader('Content-Disposition', `inline; filename="${name.replace(/"/g, '')}"`);
  res.setHeader('X-Content-Type-Options', 'nosniff');
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

app.get('/api/remarks', requireAuth, (req, res) => {
  const kind = String(req.query.kind || '').trim();
  const rows =
    kind === 'note' || kind === 'retour'
      ? db.prepare('SELECT * FROM remarks WHERE kind = ? ORDER BY created_at DESC LIMIT 80').all(kind)
      : db.prepare('SELECT * FROM remarks ORDER BY created_at DESC LIMIT 80').all();
  res.json({ remarks: rows });
});

app.post('/api/remarks', requireAuth, (req, res) => {
  const appName = String(req.body?.app || 'music').trim();
  const body = String(req.body?.body || '').trim();
  const kind = String(req.body?.kind || 'retour').trim() === 'note' ? 'note' : 'retour';
  if (!body) return res.status(400).json({ error: 'body' });
  const t = now();
  const task = {
    id: nid(),
    title: `[${kind} ${appName}] ${body.slice(0, 72)}`,
    body,
    project: appName,
    category: kind === 'note' ? 'docs' : 'bug',
    column_id: 'todo',
    priority: 1,
    created_at: t,
    updated_at: t,
  };
  db.prepare(
    `INSERT INTO tasks (id,title,body,project,category,column_id,priority,created_at,updated_at)
     VALUES (@id,@title,@body,@project,@category,@column_id,@priority,@created_at,@updated_at)`,
  ).run(task);
  const remark = { id: nid(), app: appName, body, kind, task_id: task.id, created_at: t };
  db.prepare(
    'INSERT INTO remarks (id,app,body,kind,task_id,created_at) VALUES (@id,@app,@body,@kind,@task_id,@created_at)',
  ).run(remark);
  res.json({ remark, task });
});

app.patch('/api/remarks/:id', requireAuth, (req, res) => {
  const cur = db.prepare('SELECT * FROM remarks WHERE id = ?').get(req.params.id);
  if (!cur) return res.status(404).json({ error: 'missing' });
  const appName = String(req.body?.app ?? cur.app).trim() || cur.app;
  const body = String(req.body?.body ?? cur.body).trim();
  if (!body) return res.status(400).json({ error: 'body' });
  const kind = String(req.body?.kind ?? cur.kind ?? 'retour').trim() === 'note' ? 'note' : 'retour';
  db.prepare('UPDATE remarks SET app = ?, body = ?, kind = ? WHERE id = ?').run(appName, body, kind, cur.id);
  if (cur.task_id) {
    db.prepare(
      `UPDATE tasks SET title = ?, body = ?, project = ?, category = ?, updated_at = ? WHERE id = ?`,
    ).run(
      `[${kind} ${appName}] ${body.slice(0, 72)}`,
      body,
      appName,
      kind === 'note' ? 'docs' : 'bug',
      now(),
      cur.task_id,
    );
  }
  res.json({ remark: { ...cur, app: appName, body, kind } });
});

app.use(express.static(WEB_DIR, {
  maxAge: 0,
  etag: true,
  index: false,
  setHeaders(res, filePath) {
    if (filePath.endsWith('.mjs')) {
      res.setHeader('Content-Type', 'text/javascript; charset=utf-8');
    }
    if (filePath.endsWith('.html') || filePath.endsWith('.js') || filePath.endsWith('.css') || filePath.endsWith('.mjs')) {
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
