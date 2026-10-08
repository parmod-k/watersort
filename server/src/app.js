import { createHash, randomBytes } from 'node:crypto';
import cors from 'cors';
import express from 'express';
import * as v from './validate.js';

const hashToken = (token) => createHash('sha256').update(token).digest('hex');
const bearer = (req) => /^Bearer (.+)$/.exec(req.get('authorization') ?? '')?.[1];
const randomName = () => `Player${randomBytes(2).readUInt16BE() % 10000}`;

const DEFAULT_SETTINGS = { sound: true, haptics: true };
/** Rows at the top of a leaderboard response. */
const TOP_ROWS = 5;

/**
 * The HTTP API. Every device starts as an anonymous guest: it registers once, keeps the returned
 * token and sends it as `Authorization: Bearer <token>`. Signing in with Google or Apple links that
 * identity to the player, so the same account can be recovered on any device.
 *
 * @param {import('mysql2/promise').Pool} db
 * @param {{
 *   corsOrigins?: string[],
 *   verifyIdToken?: (provider: string, idToken: string) => Promise<{ subject: string, email: string | null }>,
 * }} [options]
 */
export function createApp(db, { corsOrigins = [], verifyIdToken } = {}) {
  const app = express();
  app.disable('x-powered-by');
  // Native apps send no Origin header, so CORS only affects the web build.
  app.use(cors({ origin: corsOrigins.length ? corsOrigins : false }));
  app.use(express.json({ limit: '1mb' }));

  /** Creates a new device token for a player. The token is returned once; only its hash is stored. */
  async function issueToken(playerId, conn = db) {
    const token = randomBytes(32).toString('base64url');
    await conn.execute('INSERT INTO player_tokens (token_hash, player_id) VALUES (?, ?)', [hashToken(token), playerId]);
    return token;
  }

  async function createPlayer(name, conn = db) {
    const [result] = await conn.execute('INSERT INTO players (name) VALUES (?)', [name]);
    await conn.execute('INSERT INTO player_settings (player_id) VALUES (?)', [result.insertId]);
    return { id: result.insertId, name };
  }

  async function playerForToken(token) {
    if (!token) return null;
    const [[row]] = await db.execute(
      'SELECT p.id, p.name FROM player_tokens t JOIN players p ON p.id = t.player_id WHERE t.token_hash = ?',
      [hashToken(token)],
    );
    return row ?? null;
  }

  async function loginCount(playerId) {
    const [[{ n }]] = await db.execute('SELECT COUNT(*) AS n FROM player_logins WHERE player_id = ?', [playerId]);
    return Number(n);
  }

  /** Everything the app needs to restore an account on a device. */
  async function account(player) {
    const [logins] = await db.execute('SELECT provider, email FROM player_logins WHERE player_id = ? ORDER BY created_at', [
      player.id,
    ]);
    const [[settings]] = await db.execute('SELECT sound, haptics FROM player_settings WHERE player_id = ?', [player.id]);
    const [[progress]] = await db.execute(
      'SELECT coins, level, stars, score, cleared, data, updated_at FROM player_progress WHERE player_id = ?',
      [player.id],
    );
    return {
      player: { id: player.id, name: player.name },
      logins,
      settings: settings ? { sound: !!settings.sound, haptics: !!settings.haptics } : DEFAULT_SETTINGS,
      progress: progress ? { ...progress, data: JSON.parse(progress.data) } : null,
    };
  }

  app.get('/health', async (_req, res) => {
    await db.query('SELECT 1');
    res.json({ ok: true });
  });

  /** Creates an anonymous guest player for a new device. */
  app.post('/players', async (req, res) => {
    const name = req.body?.name === undefined ? randomName() : v.playerName(req.body.name);
    const player = await createPlayer(name);
    const token = await issueToken(player.id);
    res.status(201).json({ token, player, settings: DEFAULT_SETTINGS });
  });

  /**
   * Sign in with Google or Apple. Send the provider's ID token, plus the device's current token if
   * it has one. `result` in the response:
   *  - "linked":   the identity was new and is now attached to this device's player (progress kept).
   *  - "existing": the identity already belongs to a player and the device switches to it. A guest
   *                the device was using is deleted (the app may first copy its progress across).
   *  - "created":  no device token and a new identity: a fresh player is created.
   */
  app.post('/auth/:provider', async (req, res) => {
    if (!verifyIdToken) throw new v.HttpError(503, 'Sign-in is not configured on the server.');
    const provider = req.params.provider;
    const { subject, email } = await verifyIdToken(provider, req.body?.idToken);
    const deviceToken = bearer(req);
    const caller = await playerForToken(deviceToken);

    const [[owner]] = await db.execute(
      'SELECT p.id, p.name FROM player_logins l JOIN players p ON p.id = l.player_id WHERE l.provider = ? AND l.subject = ?',
      [provider, subject],
    );

    if (owner) {
      if (caller?.id === owner.id) return res.json({ result: 'existing', token: deviceToken, ...(await account(owner)) });
      const token = await issueToken(owner.id);
      if (caller) {
        // A guest has nothing to recover it with once the device moves on, so remove it. A linked
        // account only loses this device's token.
        if ((await loginCount(caller.id)) === 0) await db.execute('DELETE FROM players WHERE id = ?', [caller.id]);
        else await db.execute('DELETE FROM player_tokens WHERE token_hash = ?', [hashToken(deviceToken)]);
      }
      return res.json({ result: 'existing', token, ...(await account(owner)) });
    }

    if (caller) {
      try {
        await db.execute('INSERT INTO player_logins (provider, subject, player_id, email) VALUES (?, ?, ?, ?)', [
          provider,
          subject,
          caller.id,
          email,
        ]);
      } catch (e) {
        if (e.code !== 'ER_DUP_ENTRY') throw e;
        throw new v.HttpError(409, `This account is already linked to a different ${provider} login.`);
      }
      return res.json({ result: 'linked', token: deviceToken, ...(await account(caller)) });
    }

    const conn = await db.getConnection();
    let created;
    try {
      await conn.beginTransaction();
      const player = await createPlayer(randomName(), conn);
      await conn.execute('INSERT INTO player_logins (provider, subject, player_id, email) VALUES (?, ?, ?, ?)', [
        provider,
        subject,
        player.id,
        email,
      ]);
      created = { player, token: await issueToken(player.id, conn) };
      await conn.commit();
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
    res.status(201).json({ result: 'created', token: created.token, ...(await account(created.player)) });
  });

  // Everything below needs a player token.
  const auth = express.Router();
  auth.use(async (req, res, next) => {
    const token = bearer(req);
    if (!token) return res.status(401).json({ error: 'Missing token.' });
    const player = await playerForToken(token);
    if (!player) return res.status(401).json({ error: 'Unknown token.' });
    req.player = player;
    req.tokenHash = hashToken(token);
    db.execute('UPDATE players SET last_seen_at = NOW() WHERE id = ?', [player.id]).catch(() => {});
    next();
  });

  auth.get('/me', async (req, res) => {
    res.json(await account(req.player));
  });

  /** Signs this device out. Only for linked accounts: a guest could never be recovered. */
  auth.post('/me/logout', async (req, res) => {
    if ((await loginCount(req.player.id)) === 0) {
      throw new v.HttpError(409, 'Link Google or Apple first, or this progress cannot be recovered.');
    }
    await db.execute('DELETE FROM player_tokens WHERE token_hash = ?', [req.tokenHash]);
    res.status(204).end();
  });

  /** Permanently deletes the player and everything stored about them (the App Store requires this). */
  auth.delete('/me', async (req, res) => {
    await db.execute('DELETE FROM players WHERE id = ?', [req.player.id]);
    res.status(204).end();
  });

  auth.patch('/me', async (req, res) => {
    const name = v.playerName(req.body?.name);
    await db.execute('UPDATE players SET name = ? WHERE id = ?', [name, req.player.id]);
    res.json({ player: { id: req.player.id, name } });
  });

  auth.put('/me/settings', async (req, res) => {
    const s = v.settings(req.body);
    const merged = { ...DEFAULT_SETTINGS, ...s };
    await db.execute(
      `INSERT INTO player_settings (player_id, sound, haptics) VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE sound = COALESCE(?, sound), haptics = COALESCE(?, haptics)`,
      [req.player.id, merged.sound, merged.haptics, s.sound ?? null, s.haptics ?? null],
    );
    const [[row]] = await db.execute('SELECT sound, haptics FROM player_settings WHERE player_id = ?', [req.player.id]);
    res.json({ settings: { sound: !!row.sound, haptics: !!row.haptics } });
  });

  /** Stores the device's latest progress and appends its coin history (resends are ignored). */
  auth.put('/me/progress', async (req, res) => {
    const p = v.progress(req.body);
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();
      await conn.execute(
        `INSERT INTO player_progress (player_id, coins, level, stars, score, cleared, data) VALUES (?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE coins = VALUES(coins), level = VALUES(level), stars = VALUES(stars),
           score = VALUES(score), cleared = VALUES(cleared), data = VALUES(data)`,
        [req.player.id, p.coins, p.level, p.stars, p.score, p.cleared, JSON.stringify(p.data)],
      );
      if (p.ledger.length) {
        await conn.query('INSERT IGNORE INTO coin_ledger (player_id, at, amount, reason) VALUES ?', [
          p.ledger.map((e) => [req.player.id, e.at, e.amount, e.reason]),
        ]);
      }
      await conn.commit();
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
    res.json({ level: p.level, stars: p.stars, score: p.score, cleared: p.cleared });
  });

  /**
   * One leaderboard: the top rows, the player's own row, and their neighbours above and below.
   * Ranks are standard competition ranks (ties share a rank); the player sorts ahead of anyone they tie.
   */
  auth.get('/leaderboard', async (req, res) => {
    const col = v.boardKind(req.query.kind ?? 'score');
    const me = req.player.id;
    const rankOf = async (value) => {
      const [[r]] = await db.execute(`SELECT COUNT(*) AS n FROM player_progress WHERE ${col} > ?`, [value]);
      return Number(r.n) + 1;
    };
    const select = `SELECT p.id, p.name, pp.level, pp.stars, pp.score
                    FROM player_progress pp JOIN players p ON p.id = pp.player_id`;
    const entry = (row, rank) => ({
      name: row.name,
      level: row.level,
      stars: row.stars,
      score: row.score,
      rank,
      ...(row.id === me ? { isMe: true } : {}),
    });

    const [[{ total }]] = await db.execute('SELECT COUNT(*) AS total FROM player_progress');
    const [[mine]] = await db.execute(`${select} WHERE pp.player_id = ?`, [me]);
    const myRow = mine ?? { id: me, name: req.player.name, level: 1, stars: 0, score: 0 };
    const myValue = myRow[col];
    const myRank = await rankOf(myValue);

    // Top rows; anyone tied with the player is listed after them, matching the player's own rank.
    const [topRows] = await db.query(
      `${select} ORDER BY pp.${col} DESC, (p.id = ?) DESC, pp.updated_at ASC, p.id ASC LIMIT ${TOP_ROWS}`,
      [me],
    );
    const top = [];
    for (const row of topRows) {
      const prev = top[top.length - 1];
      top.push(entry(row, prev && row[col] === topRows[top.length - 1][col] ? prev.rank : top.length + 1));
    }

    const [[above]] = await db.execute(`${select} WHERE pp.${col} > ? ORDER BY pp.${col} ASC, pp.updated_at DESC, p.id DESC LIMIT 1`, [
      myValue,
    ]);
    const [[below]] = await db.execute(
      `${select} WHERE pp.${col} <= ? AND pp.player_id <> ? ORDER BY pp.${col} DESC, pp.updated_at ASC, p.id ASC LIMIT 1`,
      [myValue, me],
    );
    const around = [
      ...(above ? [entry(above, await rankOf(above[col]))] : []),
      entry(myRow, myRank),
      ...(below ? [entry(below, below[col] === myValue ? myRank : await rankOf(below[col]))] : []),
    ];

    res.json({ kind: col, total: Number(total) + (mine ? 0 : 1), top, around, me: entry(myRow, myRank) });
  });

  app.use(auth);

  app.use((_req, res) => res.status(404).json({ error: 'Not found.' }));
  // Express 5 forwards rejected async handlers here.
  app.use((err, _req, res, _next) => {
    if (err instanceof v.HttpError) return res.status(err.status).json({ error: err.message });
    if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid JSON.' });
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  });

  return app;
}
