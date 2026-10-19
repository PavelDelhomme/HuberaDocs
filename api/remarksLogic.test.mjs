import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildRemarkCreate, buildRemarkPatch } from './remarksLogic.mjs';

describe('retour → tâche', () => {
  it('pose créé le et modifié le sur l’instant d’enregistrement', () => {
    const at = 1_760_000_000_000;
    const out = buildRemarkCreate({
      app: 'maps',
      body: 'La recherche déborde.',
      kind: 'retour',
      targets: ['mobile', 'api'],
      at,
    });
    assert.equal(out.remark.created_at, at);
    assert.equal(out.remark.updated_at, at);
    assert.equal(out.task.created_at, at);
    assert.equal(out.task.updated_at, at);
    assert.deepEqual(out.remark.targets, ['api', 'mobile']);
    assert.deepEqual(out.task.targets, ['api', 'mobile']);
    assert.equal(out.task.priority, 1);
    assert.equal(out.task.project, 'maps');
  });

  it('refuse une cible vide', () => {
    assert.equal(buildRemarkCreate({ app: 'docs', body: 'x', targets: [], at: 10 }).error, 'targets');
  });

  it('un changement avance modifié le et laisse créé le', () => {
    const cur = {
      app: 'fuel',
      body: 'ancien',
      kind: 'retour',
      targets: ['web'],
      task_id: 't1',
      created_at: 1000,
      updated_at: 1000,
    };
    const out = buildRemarkPatch(cur, { body: 'nouveau texte', targets: ['api', 'web', 'mobile'] }, 5000);
    assert.equal(out.remark.created_at, 1000);
    assert.equal(out.remark.updated_at, 5000);
    assert.equal(out.task.updated_at, 5000);
    assert.equal(out.task.priority, undefined);
    assert.deepEqual(out.task.targets, ['api', 'web', 'mobile']);
    assert.equal(out.task.body, 'nouveau texte');
  });
});
