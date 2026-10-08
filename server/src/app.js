import { createHash, randomBytes } from 'node:crypto';
import cors from 'cors';
import express from 'express';
import * as v from './validate.js';

const hashToken = (token) => createHash('sha256').update(token).digest('hex');

const DEFAULT_SETTINGS = { sound: true, haptics: true };
/** Rows at the top of a leaderboard response. */
const TOP_ROWS = 5;

/**
 * The HTTP API. Players are anonymous: the app registers once, keeps the returned token, and sends
 * it as `Authorization: Bearer <token>` on every other call.
 *
 * @param {import('mysql2/promise').Pool} db
 * @param {{ corsOrigins?: string[] }} [options]
 */
export function createApp(db, { corsOrigins = [] } = {}) {
  const app = express();
  app.disable('x-powered-by');
  // Native apps send no Origin header, so CORS only affects the web build.
  app.use(cors({ origin: corsOrigins.length ? corsOrigins : false }));
  app.use(express.json({ limit: '1mb' }));

  app.get('/health', async (_req, res) => {
    await db.query('SELECT 1');
    res.json({ ok: true });
  });

  /** Creates an anonymous player. The token is shown once; only its hash is stored. */
  app.post('/players', async (req, res) => {
    const name = req.body?.name === undefined ? `Player${randomBytes(2).readUInt16BE() % 10000}` : v.playerName(req.body.name);
    const token = randomBytes(32).toString('base64url');
    const [result] = await db.execute('INSERT INTO players (token_hash, name) VALUES (?, ?)', [hashToken(token), name]);
    await db.execute('INSERT INTO player_settings (player_id) VALUES (?)', [result.insertId]);
    res.status(201).json({ token, player: { id: result.insertId, name }, settings: DEFAULT_SETTINGS });
  });

  // Everything below needs a player token.
  const auth = express.Router();
  auth.use(async (req, res, next) => {
    const token = /^Bearer (.+)$/.exec(req.get('authorization') ?? '')?.[1];
    if (!token) return res.status(401).json({ error: 'Missing token.' });
    const [rows] = await db.execute('SELECT id, name FROM players WHERE token_hash = ?', [hashToken(token)]);
    if (rows.length === 0) return res.status(401).json({ error: 'Unknown token.' });
    req.player = rows[0];
    db.execute('UPDATE players SET last_seen_at = NOW() WHERE id = ?', [req.player.id]).catch(() => {});
    next();
  });

  auth.get('/me', async (req, res) => {
    const [[settings]] = await db.execute('SELECT sound, haptics FROM player_settings WHERE player_id = ?', [req.player.id]);
    const [[progress]] = await db.execute(
      'SELECT coins, level, stars, score, cleared, data, updated_at FROM player_progress WHERE player_id = ?',
      [req.player.id],
    );
    res.json({
      player: req.player,
      settings: settings ? { sound: !!settings.sound, haptics: !!settings.haptics } : DEFAULT_SETTINGS,
      progress: progress ? { ...progress, data: JSON.parse(progress.data) } : null,
    });
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
    if (err instanceof v.BadRequest || err.type === 'entity.parse.failed') {
      return res.status(400).json({ error: err.message });
    }
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  });

  return app;
}
