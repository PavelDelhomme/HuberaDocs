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
    assert.equal(out.task.priority, 5);
    assert.equal(out.remark.criticality, 1);
    assert.equal(out.task.project, 'maps');
  });

  it('garde deux applications sur le même retour', () => {
    const out = buildRemarkCreate({
      app: 'music, maps',
      body: 'Le même souci sur les deux.',
      kind: 'retour',
      targets: ['mobile'],
      at: 30,
    });
    assert.equal(out.remark.app, 'music, maps');
    assert.equal(out.task.project, 'music, maps');
    assert.equal(out.task.title.startsWith('[retour music, maps]'), true);
  });

  it('enregistre la criticité du retour sans changer la priorité de la tâche', () => {
    const out = buildRemarkCreate({
      app: 'docs',
      body: 'Le tiroir se ferme mal.',
      kind: 'retour',
      targets: ['mobile'],
      criticality: 5,
      at: 20,
    });
    assert.equal(out.remark.criticality, 5);
    assert.equal(out.task.priority, 5);
    const chosen = buildRemarkCreate({
      app: 'docs',
      body: 'Priorité choisie.',
      kind: 'retour',
      targets: ['mobile'],
      criticality: 5,
      priority: 2,
      at: 22,
    });
    assert.equal(chosen.remark.criticality, 5);
    assert.equal(chosen.task.priority, 2);
    const clamped = buildRemarkCreate({
      app: 'docs',
      body: 'Trop haut.',
      kind: 'retour',
      targets: ['web'],
      criticality: 9,
      at: 21,
    });
    assert.equal(clamped.remark.criticality, 5);
    assert.equal(clamped.task.priority, 5);
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
    assert.equal(out.remark.criticality, 1);
    assert.deepEqual(out.task.targets, ['api', 'web', 'mobile']);
    const raised = buildRemarkPatch(cur, { criticality: 4 }, 6000);
    assert.equal(raised.remark.criticality, 4);
    assert.equal(raised.task.priority, undefined);
    const ranked = buildRemarkPatch(cur, { priority: 3 }, 7000);
    assert.equal(ranked.task.priority, 3);
    assert.equal(ranked.remark.created_at, 1000);
    assert.equal(out.task.body, 'nouveau texte');
  });
});
