import { createHash, randomBytes } from 'node:crypto';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DATA_DIR = process.env.DATA_DIR || join(ROOT, 'data');
const SESSION_SECRET = process.env.SESSION_SECRET || 'dev-only-change-me';
const EMAIL = (process.env.DOCS_CLAIM_EMAIL || 'paul@delhomme.ovh').toLowerCase();
const BASE = (process.env.DOCS_PUBLIC_URL || 'https://docs.hubera.cloud').replace(/\/$/, '');

const db = new Database(join(DATA_DIR, 'docs.sqlite'));
db.exec(`CREATE TABLE IF NOT EXISTS claims (
  token TEXT PRIMARY KEY, email TEXT NOT NULL, created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL, used INTEGER NOT NULL DEFAULT 0
)`);
const raw = randomBytes(24).toString('hex');
const hashed = createHash('sha256').update(SESSION_SECRET + ':' + raw).digest('hex');
const t = Date.now();
db.prepare('INSERT INTO claims (token,email,created_at,expires_at,used) VALUES (?,?,?,?,0)').run(
  hashed,
  EMAIL,
  t,
  t + 20 * 60 * 1000,
);
process.stdout.write(`${BASE}/go?t=${raw}\n`);
