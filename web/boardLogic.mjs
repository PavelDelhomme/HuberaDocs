/**
 * Tableau : une tâche est dans la colonne de son column_id.
 * Elle est groupée sous son parent seulement si le parent est dans la même colonne.
 * Sinon elle reste une carte de sa colonne, pour qu’un parent fait ne la cache pas.
 */
export function parentKey(task) {
  const id = task?.parent_id;
  if (id == null) return '';
  return String(id).trim();
}

export function columnBoard(tasks, columnId) {
  const list = Array.isArray(tasks) ? tasks : [];
  const col = String(columnId || '');
  const inCol = new Set(
    list.filter((t) => String(t?.column_id || '') === col && t?.id).map((t) => t.id),
  );
  const kids = new Map();
  for (const t of list) {
    const p = parentKey(t);
    if (!kids.has(p)) kids.set(p, []);
    kids.get(p).push(t);
  }
  function nest(parentId) {
    return (kids.get(parentId) || [])
      .filter((t) => String(t?.column_id || '') === col)
      .map((t) => ({ task: t, children: nest(t.id) }));
  }
  return list
    .filter((t) => {
      if (String(t?.column_id || '') !== col || !t?.id) return false;
      const p = parentKey(t);
      if (!p) return true;
      return !inCol.has(p);
    })
    .map((t) => ({ task: t, children: nest(t.id) }));
}

export function boardTaskIds(nodes) {
  const ids = [];
  const walk = (list) => {
    for (const n of list || []) {
      if (n?.task?.id) ids.push(n.task.id);
      walk(n.children);
    }
  };
  walk(nodes);
  return ids;
}
