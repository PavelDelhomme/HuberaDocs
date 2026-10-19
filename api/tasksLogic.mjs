import { parseTargets } from './targets.mjs';

export function clampPriority(value, fallback = 2) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  const i = Math.round(n);
  if (i < 1) return 1;
  if (i > 5) return 5;
  return i;
}

/**
 * parent_id vide = tâche racine.
 * exists(id) et parentOf(id) viennent de la base. Un parent absent ou une boucle est refusé.
 */
export function resolveParentId(parentId, { selfId = '', exists, parentOf } = {}) {
  if (parentId == null || parentId === '') return { parent_id: null };
  const id = String(parentId).trim();
  if (!id) return { parent_id: null };
  if (selfId && id === selfId) return { error: 'parent' };
  if (typeof exists === 'function' && !exists(id)) return { error: 'parent' };
  const seen = new Set();
  if (selfId) seen.add(selfId);
  let cur = id;
  let guard = 0;
  while (cur) {
    if (seen.has(cur)) return { error: 'cycle' };
    seen.add(cur);
    guard += 1;
    if (guard > 64) return { error: 'cycle' };
    const next = typeof parentOf === 'function' ? parentOf(cur) : null;
    cur = next ? String(next) : null;
  }
  return { parent_id: id };
}

function storedTargets(raw) {
  if (typeof raw === 'string') return raw;
  return JSON.stringify(parseTargets(raw));
}

/**
 * Création. Sans parent_id, la tâche est racine.
 * Si la cible est omise et qu’un parent est connu, on reprend la sienne.
 * Créé le et modifié le prennent `at`.
 */
export function nextTaskCreate(body, at, resolveParent) {
  const title = String(body?.title || '').trim();
  if (!title) return { error: 'title' };
  const when = Number(at);
  if (!Number.isFinite(when) || when <= 0) return { error: 'at' };
  const parent = typeof resolveParent === 'function' ? resolveParent(body?.parent_id) : { parent_id: null };
  if (parent?.error) return { error: parent.error };
  let targets = '[]';
  if (body?.targets != null) {
    const picked = parseTargets(body.targets);
    if (!picked.length) return { error: 'targets' };
    targets = JSON.stringify(picked);
  } else if (parent?.targets != null) {
    targets = storedTargets(parent.targets);
  }
  return {
    task: {
      title,
      body: String(body?.body || ''),
      project: String(body?.project || parent?.project || 'platform'),
      category: String(body?.category || parent?.category || 'feature'),
      column_id: String(body?.column_id || parent?.column_id || 'todo'),
      priority: clampPriority(body?.priority, 2),
      targets,
      parent_id: parent?.parent_id || null,
      created_at: when,
      updated_at: when,
    },
  };
}

/**
 * Modification. Créé le, la priorité, la cible et le parent restent
 * tant qu’ils ne sont pas dans le corps. Modifié le prend `at`.
 */
export function nextTaskPatch(cur, body, at, resolveParent) {
  if (!cur) return { error: 'missing' };
  const when = Number(at);
  if (!Number.isFinite(when) || when <= 0) return { error: 'at' };
  const title = body?.title != null ? String(body.title) : cur.title;
  if (!String(title || '').trim()) return { error: 'title' };
  let targets = cur.targets == null ? '[]' : storedTargets(cur.targets);
  if (body?.targets != null) {
    const picked = parseTargets(body.targets);
    if (!picked.length) return { error: 'targets' };
    targets = JSON.stringify(picked);
  }
  let parent_id = cur.parent_id ? String(cur.parent_id) : null;
  if (body && Object.prototype.hasOwnProperty.call(body, 'parent_id')) {
    const parent = typeof resolveParent === 'function' ? resolveParent(body.parent_id) : { parent_id: null };
    if (parent?.error) return { error: parent.error };
    parent_id = parent?.parent_id || null;
  }
  return {
    task: {
      id: cur.id,
      title: String(title),
      body: body?.body != null ? String(body.body) : String(cur.body || ''),
      project: body?.project ?? cur.project,
      category: body?.category ?? cur.category,
      column_id: body?.column_id ?? cur.column_id,
      priority: body?.priority != null ? clampPriority(body.priority, cur.priority) : clampPriority(cur.priority, 2),
      targets,
      parent_id,
      created_at: cur.created_at,
      updated_at: when,
    },
  };
}
