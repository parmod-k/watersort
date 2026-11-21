import { test } from 'node:test';
import assert from 'node:assert/strict';
import { adSettingsFor, ageBandFrom } from '../game/ageSignals';

const shared = (ageLower: number | null, ageUpper: number | null) =>
  ({ mandatory: true, status: 'SHARED', ageLower, ageUpper }) as const;

test('age bands from Play age ranges', () => {
  assert.equal(ageBandFrom(null), 'unknown');
  assert.equal(ageBandFrom(shared(0, 12)), 'child');
  assert.equal(ageBandFrom(shared(13, 15)), 'teen');
  assert.equal(ageBandFrom(shared(16, 17)), 'teen');
  assert.equal(ageBandFrom(shared(18, null)), 'adult');
  assert.equal(ageBandFrom(shared(null, null)), 'unknown');
  assert.equal(ageBandFrom({ mandatory: false, status: 'NOT_REQUESTED' }), 'unknown');
  assert.equal(ageBandFrom({ mandatory: true, status: 'NOT_SHARED' }), 'unknown');
  assert.equal(ageBandFrom({ mandatory: true, status: 'VERIFICATION_REQUIRED' }), 'teen');
});

test('minors get child-safe ad settings, everyone else the normal setup', () => {
  assert.deepEqual(adSettingsFor('child'), { tagForChildDirectedTreatment: true, tagForUnderAgeOfConsent: true, maxAdContentRating: 'G' });
  assert.equal(adSettingsFor('teen').tagForUnderAgeOfConsent, true);
  assert.deepEqual(adSettingsFor('adult'), {});
  assert.deepEqual(adSettingsFor('unknown'), {});
});
