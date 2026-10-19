import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseTargets } from './targets.mjs';

describe('cible retour', () => {
  it('garde api, web, mobile et l’ordre', () => {
    assert.deepEqual(parseTargets(['mobile', 'api', 'nope', 'web']), ['api', 'web', 'mobile']);
    assert.deepEqual(parseTargets('web'), ['web']);
    assert.deepEqual(parseTargets('mobile,api'), ['api', 'mobile']);
  });

  it('lit le JSON stocké et refuse le vide', () => {
    assert.deepEqual(parseTargets('["web","api"]'), ['api', 'web']);
    assert.deepEqual(parseTargets(''), []);
    assert.deepEqual(parseTargets([]), []);
    assert.deepEqual(parseTargets('bureau'), []);
  });
});
