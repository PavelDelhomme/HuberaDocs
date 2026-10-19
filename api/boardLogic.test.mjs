import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { boardTaskIds, columnBoard } from '../web/boardLogic.mjs';

describe('tableau', () => {
  it('une tâche à faire apparaît dans À faire', () => {
    const tasks = [{ id: 'a', title: 'Écrire le cahier', column_id: 'todo', parent_id: null }];
    const ids = boardTaskIds(columnBoard(tasks, 'todo'));
    assert.deepEqual(ids, ['a']);
    assert.deepEqual(boardTaskIds(columnBoard(tasks, 'doing')), []);
    assert.deepEqual(boardTaskIds(columnBoard(tasks, 'done')), []);
  });

  it('une sous-tâche à faire apparaît dans À faire, y compris une sous-sous-tâche', () => {
    const tasks = [
      { id: 'p', title: 'Carte', column_id: 'todo', parent_id: null },
      { id: 'c', title: 'Sous-tâche', column_id: 'todo', parent_id: 'p' },
      { id: 'g', title: 'Sous-sous-tâche', column_id: 'todo', parent_id: 'c' },
    ];
    const tree = columnBoard(tasks, 'todo');
    assert.equal(tree.length, 1);
    assert.equal(tree[0].task.id, 'p');
    assert.equal(tree[0].children[0].task.id, 'c');
    assert.equal(tree[0].children[0].children[0].task.id, 'g');
    assert.deepEqual(boardTaskIds(tree), ['p', 'c', 'g']);
  });

  it('une faite ne masque pas les autres', () => {
    const tasks = [
      { id: 'fait', title: 'Déjà fait', column_id: 'done', parent_id: null },
      { id: 'encore', title: 'Encore à faire', column_id: 'todo', parent_id: null },
      { id: 'suite', title: 'Sous-tâche encore ouverte', column_id: 'todo', parent_id: 'fait' },
      { id: 'autre', title: 'Autre fait', column_id: 'done', parent_id: null },
    ];
    assert.deepEqual(boardTaskIds(columnBoard(tasks, 'todo')), ['encore', 'suite']);
    const done = boardTaskIds(columnBoard(tasks, 'done'));
    assert.deepEqual(done, ['fait', 'autre']);
    assert.ok(!done.includes('encore'));
    assert.ok(!done.includes('suite'));
  });

  it('créer une sous-tâche la montre', () => {
    const before = [{ id: 'p', title: 'Carte', column_id: 'todo', parent_id: null }];
    assert.deepEqual(boardTaskIds(columnBoard(before, 'todo')), ['p']);
    const created = {
      id: 'n',
      title: 'Nouvelle sous-tâche',
      column_id: 'todo',
      parent_id: 'p',
    };
    const after = [...before, created];
    const tree = columnBoard(after, 'todo');
    assert.deepEqual(boardTaskIds(tree), ['p', 'n']);
    assert.equal(tree[0].children[0].task.id, 'n');
  });

  it('une sous-tâche en cours reste dans En cours si le parent est à faire', () => {
    const tasks = [
      { id: 'p', title: 'Parent', column_id: 'todo', parent_id: '' },
      { id: 'c', title: 'En cours', column_id: 'doing', parent_id: 'p' },
    ];
    assert.deepEqual(boardTaskIds(columnBoard(tasks, 'todo')), ['p']);
    assert.deepEqual(boardTaskIds(columnBoard(tasks, 'doing')), ['c']);
  });
});
