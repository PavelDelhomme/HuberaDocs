import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { nextTaskCreate, nextTaskPatch, resolveParentId } from './tasksLogic.mjs';

const tree = {
  root: null,
  child: 'root',
  grand: 'child',
};

function lookup(selfId) {
  return {
    selfId,
    exists: (id) => Object.prototype.hasOwnProperty.call(tree, id),
    parentOf: (id) => tree[id] || null,
  };
}

describe('sous-tâche', () => {
  it('accepte un parent, refuse une boucle et un parent absent', () => {
    assert.equal(resolveParentId(null, lookup('')).parent_id, null);
    assert.equal(resolveParentId('root', lookup('child')).parent_id, 'root');
    assert.equal(resolveParentId('missing', lookup('x')).error, 'parent');
    assert.equal(resolveParentId('child', lookup('child')).error, 'parent');
    tree.loop = 'loop';
    assert.equal(resolveParentId('loop', lookup('other')).error, 'cycle');
    delete tree.loop;
  });

  it('une sous-tâche reprend la cible du parent si on n’en envoie pas', () => {
    const at = 1_792_417_281_273;
    const out = nextTaskCreate(
      { title: 'Découper', body: 'premier élément', parent_id: 'root', priority: 3 },
      at,
      () => ({
        parent_id: 'root',
        project: 'ops',
        category: 'bug',
        column_id: 'todo',
        targets: '["api","web","mobile"]',
      }),
    );
    assert.equal(out.task.parent_id, 'root');
    assert.equal(out.task.project, 'ops');
    assert.equal(out.task.priority, 3);
    assert.equal(out.task.targets, '["api","web","mobile"]');
    assert.equal(out.task.created_at, at);
    assert.equal(out.task.updated_at, at);
  });

  it('une cible vide est refusée quand elle est envoyée', () => {
    const out = nextTaskCreate({ title: 'x', targets: [] }, 10, () => ({ parent_id: null }));
    assert.equal(out.error, 'targets');
  });

  it('modifier le titre garde priorité, cible, parent et créé le', () => {
    const cur = {
      id: 'child',
      title: 'ancien',
      body: 'détail',
      project: 'ops',
      category: 'bug',
      column_id: 'todo',
      priority: 1,
      targets: '["api","web","mobile"]',
      parent_id: 'root',
      created_at: 1000,
      updated_at: 1000,
    };
    const out = nextTaskPatch(cur, { title: 'nouveau titre', body: 'autre détail' }, 5000, () => {
      throw new Error('le parent ne doit pas être recalculé');
    });
    assert.equal(out.task.title, 'nouveau titre');
    assert.equal(out.task.body, 'autre détail');
    assert.equal(out.task.priority, 1);
    assert.equal(out.task.targets, '["api","web","mobile"]');
    assert.equal(out.task.parent_id, 'root');
    assert.equal(out.task.created_at, 1000);
    assert.equal(out.task.updated_at, 5000);
  });
});
