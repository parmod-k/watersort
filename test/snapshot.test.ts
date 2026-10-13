import { test } from 'node:test';
import assert from 'node:assert/strict';
import { packSnapshot, unpackSnapshot } from '../game/snapshot';

const progress = {
  session: 4,
  current: 3,
  unlocked: 3,
  coins: 1234,
  ledger: [{ at: 1, amount: 5, reason: 'level' }],
  playerId: '0b7c8f8e-2d4f-4b8a-9a77-0e4b8f1f2c3d',
  records: {
    1: { moves: 12, par: 10, seconds: 40, usedUndo: false, usedExtraBottle: true, stars: 3, score: 310 },
    2: { moves: 20, par: 14, seconds: 95, usedUndo: true, usedExtraBottle: false, stars: 2, score: 180 },
  },
};

test('a snapshot round-trips level records and drops the ledger and session', () => {
  const packed = JSON.stringify(packSnapshot(progress));
  const back = unpackSnapshot(packed)!;
  assert.deepEqual(back.records, progress.records);
  assert.equal(back.coins, 1234);
  assert.equal(back.playerId, progress.playerId);
  assert.deepEqual(back.ledger, []);
  assert.equal('session' in back, false);
});

test('unknown or corrupt snapshots are ignored', () => {
  assert.equal(unpackSnapshot(null), null);
  assert.equal(unpackSnapshot('not json'), null);
  assert.equal(unpackSnapshot(JSON.stringify({ v: 2, rows: [] })), null);
  const bad = unpackSnapshot(JSON.stringify({ v: 1, rows: [[1, 2, 3], 'x', [2, 1, 1, 1, 0, 1, 50]] }))!;
  assert.deepEqual(Object.keys(bad.records as object), ['2']);
});
