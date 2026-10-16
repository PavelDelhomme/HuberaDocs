import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { betaChannelBlocked, isBetaAccount } from './betaChannel.mjs';

const allow = 'lab@example.com, beta@example.org';

describe('verrou bêta Docs', () => {
  it('reconnaît la liste, pas un compte absent', () => {
    assert.equal(isBetaAccount('Lab@Example.com', allow), true);
    assert.equal(isBetaAccount('autre@example.com', allow), false);
    assert.equal(isBetaAccount('', allow), false);
    assert.equal(isBetaAccount(null, ''), false);
  });

  it('404 seulement sur channel=beta pour un non-bêta', () => {
    assert.equal(betaChannelBlocked('beta', 'autre@example.com', allow), true);
    assert.equal(betaChannelBlocked('beta', '', allow), true);
    assert.equal(betaChannelBlocked('beta', 'lab@example.com', allow), false);
    assert.equal(betaChannelBlocked('', 'autre@example.com', allow), false);
    assert.equal(betaChannelBlocked('prod', null, allow), false);
  });
});
