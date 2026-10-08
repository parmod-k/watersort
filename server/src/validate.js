/**
 * Request validation. The app is the source of truth for progress (it plays offline), so the server
 * can't prove a result is honest; it rejects anything the game itself could never produce.
 * Keep these in step with game/scoring.ts and game/economy.ts in the app.
 */

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export class BadRequest extends HttpError {
  constructor(message) {
    super(400, message);
  }
}

/** Highest score one level can give (base + efficiency + time + restraint in scoring.ts). */
export const MAX_LEVEL_SCORE = 350;
export const MAX_COINS = 10_000_000;
export const COIN_REASONS = new Set(['level', 'trial', 'daily', 'shop', 'ad', 'undo', 'hint', 'restart', 'extraBottle']);
/** Largest single coin change the game makes (a cosmetic purchase), with headroom. */
const MAX_LEDGER_AMOUNT = 10_000;
const MAX_LEDGER_ENTRIES = 200;

const NAME_RE = /^[A-Za-z0-9_ ]{3,20}$/;

export function playerName(value) {
  const name = typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : '';
  if (!NAME_RE.test(name)) throw new BadRequest('Name must be 3-20 letters, numbers, spaces or underscores.');
  return name;
}

export function settings(body) {
  const out = {};
  for (const key of ['sound', 'haptics']) {
    if (body?.[key] === undefined) continue;
    if (typeof body[key] !== 'boolean') throw new BadRequest(`"${key}" must be true or false.`);
    out[key] = body[key];
  }
  if (Object.keys(out).length === 0) throw new BadRequest('Nothing to update.');
  return out;
}

function int(value, min, max, field) {
  if (!Number.isInteger(value) || value < min || value > max) throw new BadRequest(`"${field}" is out of range.`);
  return value;
}

/** Validates a progress snapshot and works out the leaderboard totals from its level records. */
export function progress(body) {
  if (!body || typeof body !== 'object') throw new BadRequest('Expected a JSON object.');
  const level = int(body.unlocked, 1, 100_000, 'unlocked');
  const coins = int(body.coins, 0, MAX_COINS, 'coins');

  const records = body.records ?? {};
  if (typeof records !== 'object' || Array.isArray(records)) throw new BadRequest('"records" must be an object.');
  let stars = 0;
  let score = 0;
  let cleared = 0;
  for (const [key, r] of Object.entries(records)) {
    const n = Number(key);
    // Only levels before the unlocked one can have been cleared.
    if (!Number.isInteger(n) || n < 1 || n >= level) throw new BadRequest(`Record for level "${key}" is not possible.`);
    stars += int(r?.stars, 0, 3, `records.${key}.stars`);
    score += int(r?.score, 0, MAX_LEVEL_SCORE, `records.${key}.score`);
    cleared++;
  }

  const owned = Array.isArray(body.owned) ? body.owned.filter((id) => typeof id === 'string').slice(0, 500) : [];
  const equipped = body.equipped && typeof body.equipped === 'object' ? body.equipped : {};

  const ledger = Array.isArray(body.ledger) ? body.ledger.slice(-MAX_LEDGER_ENTRIES) : [];
  const now = Date.now();
  const entries = ledger.map((e, i) => {
    if (!COIN_REASONS.has(e?.reason)) throw new BadRequest(`ledger[${i}].reason is unknown.`);
    // Device clocks drift; allow a day into the future.
    int(e.at, 1_600_000_000_000, now + 86_400_000, `ledger[${i}].at`);
    int(e.amount, -MAX_LEDGER_AMOUNT, MAX_LEDGER_AMOUNT, `ledger[${i}].amount`);
    return { at: e.at, amount: e.amount, reason: e.reason };
  });

  // Daily state, kept so a restored account doesn't get today's trial or bonus a second time.
  const trial =
    body.trial && Number.isInteger(body.trial.day) && Number.isInteger(body.trial.level)
      ? { day: body.trial.day, level: body.trial.level, done: !!body.trial.done }
      : undefined;
  const bonusDay = Number.isInteger(body.bonusDay) ? body.bonusDay : undefined;

  return { coins, level, stars, score, cleared, data: { records, owned, equipped, trial, bonusDay }, ledger: entries };
}

export const BOARD_KINDS = /** @type {const} */ (['level', 'stars', 'score']);

export function boardKind(value) {
  if (!BOARD_KINDS.includes(value)) throw new BadRequest('"kind" must be level, stars or score.');
  return value;
}
