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

  it('crée une sous-tâche puis une sous-sous-tâche sans aplatir le parent', () => {
    const childParent = resolveParentId('root', lookup('enfant'));
    assert.equal(childParent.error, undefined);
    assert.equal(childParent.parent_id, 'root');
    const child = nextTaskCreate(
      { title: 'Sous-tâche', parent_id: 'root', column_id: 'todo', targets: ['web'], priority: 2 },
      100,
      () => ({
        ...childParent,
        project: 'docs',
        category: 'feature',
        column_id: 'todo',
        targets: '["web"]',
      }),
    );
    assert.equal(child.error, undefined);
    assert.equal(child.task.parent_id, 'root');
    assert.equal(child.task.column_id, 'todo');

    const grandParent = resolveParentId('child', lookup('petit'));
    assert.equal(grandParent.error, undefined);
    assert.equal(grandParent.parent_id, 'child');
    const grand = nextTaskCreate(
      { title: 'Sous-sous-tâche', parent_id: 'child', column_id: 'doing', targets: ['mobile'], priority: 3 },
      200,
      () => ({
        parent_id: grandParent.parent_id,
        project: 'docs',
        category: 'feature',
        column_id: 'doing',
        targets: '["mobile"]',
      }),
    );
    assert.equal(grand.error, undefined);
    assert.equal(grand.task.parent_id, 'child');
    assert.notEqual(grand.task.parent_id, 'root');
    assert.equal(grand.task.column_id, 'doing');

    const deeper = resolveParentId('grand', lookup('encore'));
    assert.equal(deeper.error, undefined);
    assert.equal(deeper.parent_id, 'grand');
  });

  it('un tag urgent ne change pas la priorité', () => {
    const out = nextTaskCreate(
      { title: 'Email à faire', tag: '  urgent  ', priority: 2 },
      10,
      () => ({ parent_id: null }),
    );
    assert.equal(out.task.tag, 'urgent');
    assert.equal(out.task.priority, 2);
    const kept = nextTaskPatch(
      { ...out.task, id: 't', created_at: 10, updated_at: 10 },
      { title: 'Email à faire encore' },
      20,
      () => ({ parent_id: null }),
    );
    assert.equal(kept.task.tag, 'urgent');
    assert.equal(kept.task.priority, 2);
    const cleared = nextTaskPatch(kept.task, { tag: '   ' }, 30, () => ({ parent_id: null }));
    assert.equal(cleared.task.tag, '');
    assert.equal(cleared.task.priority, 2);
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
