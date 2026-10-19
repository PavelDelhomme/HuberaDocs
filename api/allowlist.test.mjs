import assert from 'node:assert/strict';
import test from 'node:test';
import {
  allowlistFromEnv,
  emailFromValidatedProbe,
  isAllowlisted,
  sessionEmailForLogin,
} from './allowlist.mjs';

const allow = allowlistFromEnv('Owner@Example.com, other@example.com');

test('la config vide n’autorise personne', () => {
  assert.deepEqual(allowlistFromEnv(''), []);
  assert.equal(isAllowlisted('owner@example.com', allowlistFromEnv('')), false);
  assert.equal(isAllowlisted('owner@example.com', allowlistFromEnv('pas-une-adresse')), false);
});

test('un autre compte est refusé', () => {
  const got = sessionEmailForLogin({
    bodyEmail: 'lab@example.com',
    tokenEmail: 'lab@example.com',
    allow,
  });
  assert.equal(got.error, 'allowlist');
});

test('le client qui annonce une autre adresse est refusé', () => {
  const got = sessionEmailForLogin({
    bodyEmail: 'owner@example.com',
    tokenEmail: 'lab@example.com',
    allow,
  });
  assert.equal(got.error, 'allowlist');
});

test('un jeton absent est refusé', () => {
  const got = sessionEmailForLogin({
    bodyEmail: 'owner@example.com',
    tokenEmail: '',
    allow,
  });
  assert.equal(got.error, 'allowlist');
});

test('un jeton vérifié du compte autorisé ouvre la session', () => {
  const got = sessionEmailForLogin({
    bodyEmail: '',
    tokenEmail: 'Owner@Example.com',
    allow,
  });
  assert.equal(got.email, 'owner@example.com');
});

test('un probe sans valid:true ne donne pas d’adresse, même s’il en écrit une', () => {
  assert.equal(emailFromValidatedProbe({ email: 'owner@example.com' }), '');
  assert.equal(emailFromValidatedProbe({ valid: false, email: 'owner@example.com' }), '');
  assert.equal(emailFromValidatedProbe(null), '');
});

test('un probe vérifié retient l’adresse du jeton', () => {
  assert.equal(
    emailFromValidatedProbe({ valid: true, email: 'Owner@Example.com' }),
    'owner@example.com',
  );
});
