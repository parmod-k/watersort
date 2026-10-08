import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT } from 'jose';
import mysql from 'mysql2/promise';
import { createApp } from '../src/app.js';
import { createPool, dbConfig } from '../src/db.js';
import { createIdentityVerifier } from '../src/identity.js';
import { migrate } from '../src/migrate.js';

// Own database so it can run alongside api.test.js.
const config = { ...dbConfig, database: `${dbConfig.database}_test_auth` };
const GOOGLE_AUD = 'web-client.apps.googleusercontent.com';
const APPLE_AUD = 'com.watersortapp';
let db;
let server;
let base;
let keys;

before(async () => {
  const conn = await mysql.createConnection({ ...config, database: undefined });
  await conn.query(`DROP DATABASE IF EXISTS \`${config.database}\``);
  await conn.end();
  await migrate(config);
  db = createPool(config);

  // Stand-ins for Google's and Apple's signing keys; the real verifier checks tokens against them.
  keys = { google: await generateKeyPair('RS256'), apple: await generateKeyPair('RS256'), rogue: await generateKeyPair('RS256') };
  const jwks = async (k) => createLocalJWKSet({ keys: [{ ...(await exportJWK(k.publicKey)), alg: 'RS256', kid: 'k1' }] });
  const verifyIdToken = createIdentityVerifier({
    audiences: { google: [GOOGLE_AUD], apple: [APPLE_AUD] },
    keySets: { google: await jwks(keys.google), apple: await jwks(keys.apple) },
  });
  server = createApp(db, { verifyIdToken }).listen(0);
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
  return { status: res.status, body: res.status === 204 ? null : await res.json() };
}

function idToken(sub, { provider = 'google', key = keys[provider], aud, iss, exp = '1h', email = `${sub}@example.com` } = {}) {
  return new SignJWT({ email })
    .setProtectedHeader({ alg: 'RS256', kid: 'k1' })
    .setSubject(sub)
    .setIssuer(iss ?? (provider === 'google' ? 'https://accounts.google.com' : 'https://appleid.apple.com'))
    .setAudience(aud ?? (provider === 'google' ? GOOGLE_AUD : APPLE_AUD))
    .setIssuedAt()
    .setExpirationTime(exp)
    .sign(key.privateKey);
}

const signIn = async (provider, sub, token, opts) =>
  call('POST', `/auth/${provider}`, { token, body: { idToken: await idToken(sub, { provider, ...opts }) } });

const register = async (name) => (await call('POST', '/players', { body: { name } })).body.token;

const progress = (levels, coins = 700) => {
  const records = {};
  for (let i = 1; i <= levels; i++) records[i] = { stars: 3, score: 300 };
  return { unlocked: levels + 1, coins, records, owned: ['glass-gold'], equipped: {}, ledger: [], bonusDay: 20000 };
};

test('a guest links Google, then recovers the account on a new device', async () => {
  const phone = await register('Phone_Player');
  await call('PUT', '/me/progress', { token: phone, body: progress(12) });

  const link = await signIn('google', 'g-100', phone);
  assert.equal(link.status, 200);
  assert.equal(link.body.result, 'linked');
  assert.equal(link.body.token, phone, 'linking keeps the device token');
  assert.deepEqual(link.body.logins, [{ provider: 'google', email: 'g-100@example.com' }]);

  // App data cleared / new phone: no device token at all.
  const restore = await signIn('google', 'g-100');
  assert.equal(restore.status, 200);
  assert.equal(restore.body.result, 'existing');
  assert.notEqual(restore.body.token, phone);
  assert.equal(restore.body.player.name, 'Phone_Player');
  assert.equal(restore.body.progress.level, 13);
  assert.equal(restore.body.progress.coins, 700);
  assert.deepEqual(restore.body.progress.data.owned, ['glass-gold']);
  assert.equal(restore.body.progress.data.bonusDay, 20000);

  // Both devices stay signed in to the same player.
  assert.equal((await call('GET', '/me', { token: phone })).body.player.id, restore.body.player.id);
  assert.equal((await call('GET', '/me', { token: restore.body.token })).body.player.id, restore.body.player.id);
});

test('signing in on a device that was a guest replaces and deletes that guest', async () => {
  const owner = await register('Owner_Name');
  await signIn('google', 'g-200', owner);

  const tablet = await register('Tablet_Guest');
  const guestId = (await call('GET', '/me', { token: tablet })).body.player.id;
  const res = await signIn('google', 'g-200', tablet);
  assert.equal(res.body.result, 'existing');
  assert.equal(res.body.player.name, 'Owner_Name');
  assert.equal((await call('GET', '/me', { token: tablet })).status, 401, 'old guest token is gone');
  const [rows] = await db.query('SELECT id FROM players WHERE id = ?', [guestId]);
  assert.equal(rows.length, 0, 'guest player deleted');
});

test('signing in again with the identity already on this device is a no-op', async () => {
  const token = await register('Same_Device');
  await signIn('google', 'g-250', token);
  const again = await signIn('google', 'g-250', token);
  assert.equal(again.body.result, 'existing');
  assert.equal(again.body.token, token);
});

test('Apple sign-in on a fresh install creates a permanent player', async () => {
  const res = await signIn('apple', 'apple-001.abc');
  assert.equal(res.status, 201);
  assert.equal(res.body.result, 'created');
  assert.match(res.body.player.name, /^Player\d+$/);
  assert.deepEqual(res.body.logins, [{ provider: 'apple', email: 'apple-001.abc@example.com' }]);
  assert.equal((await signIn('apple', 'apple-001.abc')).body.player.id, res.body.player.id);
});

test('one player can link Google and Apple, but not two Google logins', async () => {
  const token = await register('Two_Logins');
  assert.equal((await signIn('google', 'g-300', token)).body.result, 'linked');
  assert.equal((await signIn('apple', 'a-300', token)).body.result, 'linked');
  const clash = await signIn('google', 'g-301', token);
  assert.equal(clash.status, 409);
});

test('rejects ID tokens that are forged, expired, or meant for another app', async () => {
  const cases = [
    { key: keys.rogue },
    { aud: 'someone-elses-app.apps.googleusercontent.com' },
    { iss: 'https://evil.example.com' },
    { exp: Math.floor(Date.now() / 1000) - 60 },
  ];
  for (const opts of cases) assert.equal((await signIn('google', 'g-400', undefined, opts)).status, 401, JSON.stringify(opts));
  assert.equal((await call('POST', '/auth/google', { body: {} })).status, 400);
  assert.equal((await call('POST', '/auth/facebook', { body: { idToken: 'x' } })).status, 400);
  // An Apple token can't be used as a Google one.
  assert.equal((await signIn('google', 'g-401', undefined, { key: keys.apple })).status, 401);
});

test('sign out removes only this device; guests cannot sign out', async () => {
  const guest = await register('Guest_Only');
  assert.equal((await call('POST', '/me/logout', { token: guest })).status, 409);

  const phone = await register('Logout_Tester');
  await signIn('google', 'g-500', phone);
  const tablet = (await signIn('google', 'g-500')).body.token;
  assert.equal((await call('POST', '/me/logout', { token: phone })).status, 204);
  assert.equal((await call('GET', '/me', { token: phone })).status, 401);
  assert.equal((await call('GET', '/me', { token: tablet })).status, 200);
});

test('deleting the account removes the player, logins and devices', async () => {
  const token = await register('Delete_Me');
  await signIn('google', 'g-600', token);
  await call('PUT', '/me/progress', { token, body: progress(3) });
  assert.equal((await call('DELETE', '/me', { token })).status, 204);
  assert.equal((await call('GET', '/me', { token })).status, 401);
  const again = await signIn('google', 'g-600');
  assert.equal(again.body.result, 'created', 'the Google identity is free again');
  assert.equal(again.body.progress, null);
});
