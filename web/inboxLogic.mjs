/** Page Retours : pas de phrase d’exemple dans le champ texte. */
export const INBOX_BODY_PLACEHOLDER = '';

export const INBOX_GROUPS = {
  openTitle: 'À traiter',
  openSubtitle: 'La tâche liée n’est pas en Fait.',
  doneTitle: 'Traités',
  doneSubtitle: 'La tâche liée est en Fait.',
};

const COLUMN_LABEL = {
  todo: 'À faire',
  doing: 'En cours',
  done: 'Fait',
  later: 'Plus tard',
};

export function inboxTextareaAttrs() {
  const ph = String(INBOX_BODY_PLACEHOLDER || '');
  if (/tape un retour/i.test(ph) || !ph) return '';
  return ` placeholder="${ph.replace(/"/g, '')}"`;
}

export function shortTaskTitle(title, max = 72) {
  const t = String(title || '').replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trimEnd()}…`;
}

export function columnLabel(columnId, columns = []) {
  const id = String(columnId || '');
  const found = (columns || []).find((c) => c && c.id === id);
  const label = found?.label != null ? String(found.label).trim() : '';
  if (label) return label;
  return COLUMN_LABEL[id] || id;
}

/**
 * À traiter : pas de tâche liée, ou tâche dont la colonne n’est pas done.
 * Traités : la tâche liée est dans la colonne done.
 * L’ordre d’arrivée est gardé dans chaque groupe. Les tâches ne sont pas modifiées.
 */
export function splitRemarks(remarks, tasks, columns = []) {
  const byId = new Map();
  for (const t of tasks || []) {
    if (t?.id) byId.set(t.id, t);
  }
  const open = [];
  const done = [];
  for (const remark of remarks || []) {
    const task = remark?.task_id ? byId.get(remark.task_id) : null;
    const columnId = task ? String(task.column_id || '') : '';
    const treated = Boolean(task) && columnId === 'done';
    const row = {
      remark,
      treated,
      taskTitle: task ? shortTaskTitle(task.title) : '',
      columnId: task ? columnId : '',
      columnLabel: task ? columnLabel(columnId, columns) : '',
    };
    (treated ? done : open).push(row);
  }
  return { open, done };
}

export function taskStateLabel(row) {
  if (!row?.taskTitle && !row?.columnId) return 'Pas de tâche liée';
  const title = row.taskTitle || 'Tâche';
  if (!row.columnLabel) return title;
  return `${title} · ${row.columnLabel}`;
}
