import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ADS, bonusAdDue, interstitialDue } from '../game/economy';

test('no interstitial or bonus-gift ad while a new player learns the game', () => {
  for (let level = 1; level < ADS.interstitialFromLevel; level++) {
    assert.equal(interstitialDue(level), false);
    assert.equal(bonusAdDue(level), false);
  }
});

test('the bonus-gift offer never lands on an interstitial level', () => {
  for (let level = 1; level <= 300; level++) assert.equal(interstitialDue(level) && bonusAdDue(level), false);
  assert.equal(bonusAdDue(10), true);
  assert.equal(bonusAdDue(15), false); // interstitial level
  assert.equal(bonusAdDue(5), false); // before bonusFromLevel
});
