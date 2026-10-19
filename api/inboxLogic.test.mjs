import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  INBOX_BODY_PLACEHOLDER,
  INBOX_GROUPS,
  inboxTextareaAttrs,
  splitRemarks,
  taskStateLabel,
} from '../web/inboxLogic.mjs';

const remarks = [
  { id: 'a', kind: 'retour', task_id: 'done1', body: 'ancien' },
  { id: 'b', kind: 'note', task_id: '', body: 'sans tâche' },
  { id: 'c', kind: 'retour', task_id: 'todo1', body: 'ouvert' },
  { id: 'd', kind: 'retour', task_id: 'missing', body: 'orphelin' },
  { id: 'e', kind: 'note', task_id: 'done2', body: 'fini' },
];

function tasks() {
  return [
    { id: 'done1', title: 'Déjà classé', column_id: 'done', priority: 1 },
    { id: 'todo1', title: 'Encore là', column_id: 'doing', priority: 4 },
    { id: 'done2', title: 'Second fait avec un titre qui reste entier', column_id: 'done', priority: 2 },
  ];
}

describe('liste des retours', () => {
  it('sépare non traité puis traité, sans réécrire les tâches', () => {
    const list = tasks();
    const { open, done } = splitRemarks(remarks, list);
    assert.deepEqual(open.map((r) => r.remark.id), ['b', 'c', 'd']);
    assert.deepEqual(done.map((r) => r.remark.id), ['a', 'e']);
    assert.equal(open.length + done.length, remarks.length);
    assert.equal(taskStateLabel(open[0]), 'Pas de tâche liée');
    assert.equal(taskStateLabel(open[1]), 'Encore là · En cours');
    assert.equal(taskStateLabel(open[2]), 'Pas de tâche liée');
    assert.equal(taskStateLabel(done[0]), 'Déjà classé · Fait');
    assert.equal(list[1].title, 'Encore là');
    assert.equal(list[1].priority, 4);
    assert.equal(list[1].column_id, 'doing');
  });

  it('bascule dans Traités dès que la tâche liée passe en done', () => {
    const list = tasks();
    list[1] = { ...list[1], column_id: 'done' };
    const { open, done } = splitRemarks(remarks, list);
    assert.deepEqual(open.map((r) => r.remark.id), ['b', 'd']);
    assert.deepEqual(done.map((r) => r.remark.id), ['a', 'c', 'e']);
    assert.equal(taskStateLabel(done[1]), 'Encore là · Fait');
    assert.equal(list[1].title, 'Encore là');
    assert.equal(list[1].priority, 4);
  });

  it('raccourcit le titre affiché sans modifier la tâche', () => {
    const title = 'A'.repeat(80);
    const task = { id: 't', title, column_id: 'todo', priority: 1 };
    const { open } = splitRemarks([{ id: 'r', task_id: 't' }], [task]);
    assert.equal(open[0].taskTitle.endsWith('…'), true);
    assert.equal(open[0].taskTitle.length, 72);
    assert.equal(task.title, title);
    assert.equal(task.priority, 1);
    assert.equal(task.column_id, 'todo');
  });

  it('une colonne autre que done reste à traiter, avec le libellé de la colonne', () => {
    const { open, done } = splitRemarks(
      [{ id: 'r', task_id: 't' }],
      [{ id: 't', title: 'Plus tard', column_id: 'later', priority: 3 }],
      [{ id: 'later', label: 'Plus tard' }],
    );
    assert.equal(done.length, 0);
    assert.equal(taskStateLabel(open[0]), 'Plus tard · Plus tard');
  });

  it('ne propose pas le placeholder Tape un retour', () => {
    assert.equal(INBOX_BODY_PLACEHOLDER, '');
    assert.equal(inboxTextareaAttrs(), '');
    assert.equal(/tape un retour/i.test(inboxTextareaAttrs()), false);
    assert.equal(/tape un retour/i.test(INBOX_GROUPS.openTitle + INBOX_GROUPS.doneTitle), false);
    assert.equal(INBOX_GROUPS.openTitle, 'À traiter');
    assert.equal(INBOX_GROUPS.doneTitle, 'Traités');
    assert.match(INBOX_GROUPS.doneSubtitle, /Fait/);
  });

  it('la page Retours web et Android n’affichent pas ce placeholder', () => {
    const app = readFileSync(new URL('../web/app.js', import.meta.url), 'utf8');
    const start = app.indexOf('async function viewInbox');
    const end = app.indexOf('\nfunction esc');
    assert.ok(start > 0 && end > start);
    const inbox = app.slice(start, end);
    assert.equal(/tape un retour/i.test(inbox), false);
    assert.equal(/placeholder\s*=/.test(inbox), false);
    assert.match(inbox, /splitRemarks\(shown/);
    assert.match(inbox, /INBOX_GROUPS\.openTitle/);
    assert.match(inbox, /INBOX_GROUPS\.doneTitle/);
    assert.match(inbox, /inbox-split/);

    const kt = readFileSync(
      new URL('../android/app/src/main/java/cloud/hubera/docs/ui/inbox/InboxScreen.kt', import.meta.url),
      'utf8',
    );
    assert.equal(/tape un retour/i.test(kt), false);
    assert.equal(kt.includes('Ce qui cloche'), false);
    assert.equal(kt.includes('Choisis d’abord'), false);
    assert.match(kt, /remarkSections\(shown/);
    assert.match(kt, /InboxCopy\.openTitle/);
    assert.match(kt, /InboxCopy\.doneTitle/);
    assert.match(kt, /HorizontalDivider/);
  });
});
