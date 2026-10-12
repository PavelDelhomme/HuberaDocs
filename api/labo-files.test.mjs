import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isAllowedLaboFile } from './labo-files.mjs';

describe('labo DA files', () => {
  it('autorise vague 1 et 2', () => {
    assert.equal(isAllowedLaboFile('labo-da-vague1.html'), true);
    assert.equal(isAllowedLaboFile('labo-da-vague2.html'), true);
    assert.equal(isAllowedLaboFile('README.md'), true);
  });

  it('refuse le path traversal et les autres fichiers', () => {
    assert.equal(isAllowedLaboFile('../server.mjs'), false);
    assert.equal(isAllowedLaboFile('labo-da-vague1.html.bak'), false);
    assert.equal(isAllowedLaboFile('labo-da-vague3.html'), false);
    assert.equal(isAllowedLaboFile(''), false);
  });
});
