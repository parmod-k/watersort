import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import mysql from 'mysql2/promise';
import { createApp } from '../src/app.js';
import { createPool, dbConfig } from '../src/db.js';
import { migrate } from '../src/migrate.js';

// Runs against a throwaway database next to the real one.
const config = { ...dbConfig, database: `${dbConfig.database}_test` };
let db;
let server;
let base;

before(async () => {
  const conn = await mysql.createConnection({ ...config, database: undefined });
  await conn.query(`DROP DATABASE IF EXISTS \`${config.database}\``);
  await conn.end();
  await migrate(config);
  db = createPool(config);
  server = createApp(db).listen(0);
  base = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  server?.close();
  await db?.end();
});

async function call(method, path, { token, body } = {}) {
  const res = await fetch(base + path, {
    method,
    headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: res.status, body: await res.json() };
}

const register = async (name) => (await call('POST', '/players', { body: { name } })).body.token;

/** A progress snapshot with `levels` cleared at the given stars and score each. */
function snapshot(levels, { stars = 3, score = 300, coins = 500, ledger = [] } = {}) {
  const records = {};
  for (let i = 1; i <= levels; i++) records[i] = { stars, score, moves: 10, par: 10, seconds: 30 };
  return { unlocked: levels + 1, coins, records, owned: [], equipped: {}, ledger };
}

test('registers a player and requires the token afterwards', async () => {
  const res = await call('POST', '/players', { body: { name: 'AquaQueen' } });
  assert.equal(res.status, 201);
  assert.equal(res.body.player.name, 'AquaQueen');
  assert.deepEqual(res.body.settings, { sound: true, haptics: true });

  assert.equal((await call('GET', '/me')).status, 401);
  assert.equal((await call('GET', '/me', { token: 'nope' })).status, 401);
  const me = await call('GET', '/me', { token: res.body.token });
  assert.equal(me.status, 200);
  assert.equal(me.body.player.name, 'AquaQueen');
  assert.equal(me.body.progress, null);
});

test('renames, rejecting bad names', async () => {
  const token = await register('First_Name');
  assert.equal((await call('PATCH', '/me', { token, body: { name: 'x' } })).status, 400);
  assert.equal((await call('PATCH', '/me', { token, body: { name: '<script>' } })).status, 400);
  const ok = await call('PATCH', '/me', { token, body: { name: '  Tide   Tamer ' } });
  assert.equal(ok.body.player.name, 'Tide Tamer');
});

test('updates settings partially', async () => {
  const token = await register('Settings_Fan');
  let res = await call('PUT', '/me/settings', { token, body: { sound: false } });
  assert.deepEqual(res.body.settings, { sound: false, haptics: true });
  res = await call('PUT', '/me/settings', { token, body: { haptics: false } });
  assert.deepEqual(res.body.settings, { sound: false, haptics: false });
  assert.equal((await call('PUT', '/me/settings', { token, body: { sound: 'yes' } })).status, 400);
  assert.deepEqual((await call('GET', '/me', { token })).body.settings, { sound: false, haptics: false });
});

test('stores progress, works out totals and ignores resent ledger entries', async () => {
  const token = await register('Sync_Tester');
  const ledger = [
    { at: Date.now() - 1000, amount: 250, reason: 'level' },
    { at: Date.now(), amount: -20, reason: 'undo' },
  ];
  const res = await call('PUT', '/me/progress', { token, body: snapshot(4, { ledger }) });
  assert.equal(res.status, 200);
  assert.deepEqual(res.body, { level: 5, stars: 12, score: 1200, cleared: 4 });
  // The app resends its whole recent ledger on every sync.
  await call('PUT', '/me/progress', { token, body: snapshot(4, { ledger }) });

  const me = (await call('GET', '/me', { token })).body;
  assert.equal(me.progress.coins, 500);
  const [[{ n }]] = await db.query('SELECT COUNT(*) AS n FROM coin_ledger WHERE player_id = ?', [me.player.id]);
  assert.equal(Number(n), 2);
});

test('rejects progress the game could not produce', async () => {
  const token = await register('Cheater_99');
  const bad = [
    { ...snapshot(2), coins: -5 },
    { ...snapshot(2), records: { 9: { stars: 3, score: 300 } } }, // level not unlocked yet
    snapshot(2, { stars: 4 }),
    snapshot(2, { score: 9999 }),
    snapshot(1, { ledger: [{ at: Date.now(), amount: 50, reason: 'hacked' }] }),
  ];
  for (const body of bad) assert.equal((await call('PUT', '/me/progress', { token, body })).status, 400);
});

test('ranks players with shared ranks for ties', async () => {
  await db.query('DELETE FROM players');
  const players = [
    ['Alpha', 10],
    ['Bravo', 8],
    ['Charlie', 8],
    ['Delta', 5],
    ['Echo', 3],
    ['Foxtrot', 2],
    ['Golf', 1],
  ];
  const tokens = {};
  for (const [name, levels] of players) {
    tokens[name] = await register(name);
    await call('PUT', '/me/progress', { token: tokens[name], body: snapshot(levels) });
  }

  const board = (await call('GET', '/leaderboard?kind=level', { token: tokens.Echo })).body;
  assert.equal(board.total, 7);
  assert.deepEqual(
    board.top.map((e) => [e.name, e.rank]),
    [
      ['Alpha', 1],
      ['Bravo', 2],
      ['Charlie', 2],
      ['Delta', 4],
      ['Echo', 5],
    ],
  );
  assert.deepEqual(board.me, { name: 'Echo', level: 4, stars: 9, score: 900, rank: 5, isMe: true });
  assert.deepEqual(
    board.around.map((e) => [e.name, e.rank]),
    [
      ['Delta', 4],
      ['Echo', 5],
      ['Foxtrot', 6],
    ],
  );

  // A tied player sees themselves ranked with, and listed ahead of, the player they tie.
  const charlie = (await call('GET', '/leaderboard?kind=level', { token: tokens.Charlie })).body;
  assert.equal(charlie.me.rank, 2);
  assert.deepEqual(charlie.top.slice(1, 3).map((e) => e.name), ['Charlie', 'Bravo']);
  assert.deepEqual(charlie.around.map((e) => [e.name, e.rank]), [['Alpha', 1], ['Charlie', 2], ['Bravo', 2]]);

  assert.equal((await call('GET', '/leaderboard?kind=coins', { token: tokens.Echo })).status, 400);
});
