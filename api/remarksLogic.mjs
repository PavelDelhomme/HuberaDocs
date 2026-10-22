import { parseTargets } from './targets.mjs';

/** 1 la moins grave, 5 la plus grave. Distinct de la priorité des tâches. */
export function clampCriticality(value, fallback = 1) {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n)) return fallback;
  if (n < 1) return 1;
  if (n > 5) return 5;
  return n;
}

/**
 * Création d’un retour. `at` est l’horodatage d’enregistrement (ms),
 * posé à la fois sur créé le et modifié le.
 * La priorité de la tâche créée reste 1. La criticité reste sur le retour.
 */
export function buildRemarkCreate({ app, body, kind, targets, criticality, at }) {
  const text = String(body || '').trim();
  const appName = String(app || '').trim() || 'docs';
  const k = String(kind || 'retour').trim() === 'note' ? 'note' : 'retour';
  const picked = parseTargets(targets);
  const when = Number(at);
  if (!text) return { error: 'body' };
  if (!picked.length) return { error: 'targets' };
  if (!Number.isFinite(when) || when <= 0) return { error: 'at' };
  const level = k === 'retour' ? clampCriticality(criticality, 1) : 1;
  const task = {
    title: `[${k} ${appName}] ${text.slice(0, 72)}`,
    body: text,
    project: appName,
    category: k === 'note' ? 'docs' : 'bug',
    column_id: 'todo',
    priority: 1,
    targets: picked,
    created_at: when,
    updated_at: when,
  };
  const remark = {
    app: appName,
    body: text,
    kind: k,
    targets: picked,
    criticality: level,
    created_at: when,
    updated_at: when,
  };
  return { task, remark };
}

/**
 * Modification d’un retour. Créé le ne bouge pas. Modifié le prend `at`.
 * La priorité de la tâche liée n’est pas dans ce patch.
 */
export function buildRemarkPatch(cur, input, at) {
  const when = Number(at);
  if (!cur) return { error: 'missing' };
  if (!Number.isFinite(when) || when <= 0) return { error: 'at' };
  const appName = String(input?.app ?? cur.app).trim() || cur.app;
  const body = String(input?.body ?? cur.body).trim();
  if (!body) return { error: 'body' };
  const kind = String(input?.kind ?? cur.kind ?? 'retour').trim() === 'note' ? 'note' : 'retour';
  const targets = input?.targets == null ? parseTargets(cur.targets) : parseTargets(input.targets);
  if (input?.targets != null && !targets.length) return { error: 'targets' };
  const previous = clampCriticality(cur.criticality, 1);
  const level = kind === 'retour'
    ? (input?.criticality == null ? previous : clampCriticality(input.criticality, previous))
    : previous;
  return {
    remark: {
      app: appName,
      body,
      kind,
      targets,
      criticality: level,
      task_id: cur.task_id,
      created_at: cur.created_at,
      updated_at: when,
    },
    task: {
      title: `[${kind} ${appName}] ${body.slice(0, 72)}`,
      body,
      project: appName,
      category: kind === 'note' ? 'docs' : 'bug',
      targets,
      updated_at: when,
    },
  };
}
