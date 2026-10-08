import 'expo-sqlite/localStorage/install';
import { useSyncExternalStore } from 'react';
import { bestRecord, LevelRecord, LevelResult, recordFor } from './scoring';
import { cosmetic, CosmeticSlot, DEFAULT_EQUIPPED, Equipped, isOwned } from './cosmetics';
import { DAILY_BONUS, pickTrialLevel, today, TRIAL_REWARD } from './daily';
import { Booster, boosterPrice, CoinReason, ECONOMY, LEDGER_SIZE, LedgerEntry, levelReward } from './economy';

export type Progress = {
  /** Level currently loaded on the Play tab. */
  current: number;
  /** Bumped on every playLevel() so replaying the same level reloads the board. */
  session: number;
  /** Highest level the player may start. */
  unlocked: number;
  /** Best result per completed level (stars, score, moves, time, power-ups used). */
  records: Record<number, LevelRecord>;
  coins: number;
  /** Most recent coin changes, newest last (see LEDGER_SIZE). */
  ledger: LedgerEntry[];
  playerName: string;
  /** Cosmetics bought with coins (level- and star-gated items unlock without being listed here). */
  owned: string[];
  equipped: Equipped;
  /** Today's Daily Trial, pinned the first time it is shown so it can't change during the day. */
  trial?: { day: number; level: number; done: boolean };
  /** Day the free coin bonus was last claimed. */
  bonusDay?: number;
};

const STORAGE_KEY = 'watersort.progress.v1';
const DEFAULTS: Progress = {
  current: 1,
  session: 0,
  unlocked: 1,
  records: {},
  coins: ECONOMY.startingCoins,
  ledger: [],
  playerName: 'FluidMaster_99',
  owned: [],
  equipped: DEFAULT_EQUIPPED,
};

function loadEquipped(saved: unknown): Equipped {
  const equipped = { ...DEFAULT_EQUIPPED };
  if (saved && typeof saved === 'object') {
    for (const slot of Object.keys(equipped) as CosmeticSlot[]) {
      const id = (saved as Record<string, unknown>)[slot];
      if (typeof id === 'string' && cosmetic(id)?.slot === slot) equipped[slot] = id;
    }
  }
  return equipped;
}

/** Saves from before scores existed only kept stars; turn them into minimal records. */
function migrateStars(stars: Record<number, number>): Record<number, LevelRecord> {
  const records: Record<number, LevelRecord> = {};
  for (const [level, n] of Object.entries(stars)) {
    records[Number(level)] = { moves: 0, par: 0, seconds: 0, usedUndo: true, usedExtraBottle: true, stars: n, score: 100 };
  }
  return records;
}

/** Reads saved progress (SQLite-backed localStorage on native, browser localStorage on web). */
function load(): Progress {
  try {
    const raw = globalThis.localStorage?.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    const saved = JSON.parse(raw) as Partial<Progress> & { stars?: Record<number, number> };
    const unlocked = Math.max(1, Number(saved.unlocked) || 1);
    return {
      ...DEFAULTS,
      unlocked,
      current: Math.min(unlocked, Math.max(1, Number(saved.current) || 1)),
      records:
        saved.records && typeof saved.records === 'object'
          ? saved.records
          : saved.stars && typeof saved.stars === 'object'
            ? migrateStars(saved.stars)
            : {},
      coins: Number.isFinite(saved.coins) ? Number(saved.coins) : DEFAULTS.coins,
      ledger: Array.isArray(saved.ledger) ? saved.ledger.slice(-LEDGER_SIZE) : [],
      playerName: typeof saved.playerName === 'string' && saved.playerName ? saved.playerName : DEFAULTS.playerName,
      owned: Array.isArray(saved.owned) ? saved.owned.filter((id) => typeof id === 'string') : [],
      equipped: loadEquipped(saved.equipped),
      trial:
        saved.trial && Number.isFinite(saved.trial.day) && Number.isFinite(saved.trial.level)
          ? { day: saved.trial.day, level: saved.trial.level, done: !!saved.trial.done }
          : undefined,
      bonusDay: Number.isFinite(saved.bonusDay) ? saved.bonusDay : undefined,
    };
  } catch {
    return DEFAULTS;
  }
}

function save(p: Progress) {
  try {
    const { session, ...persisted } = p;
    globalThis.localStorage?.setItem(STORAGE_KEY, JSON.stringify(persisted));
  } catch {
    // Storage unavailable (e.g. private browsing); progress just won't survive a restart.
  }
}

let state: Progress = load();
const listeners = new Set<() => void>();

function set(next: Progress) {
  state = next;
  save(state);
  listeners.forEach((l) => l());
}

export function subscribeProgress(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Current progress, for code outside React (cloud sync). */
export function getProgress() {
  return state;
}

/**
 * Every coin change goes through here so the ledger stays complete. Returns null when a spend
 * (negative amount) can't be afforded; callers must not proceed in that case.
 */
function withCoins(p: Progress, amount: number, reason: CoinReason): Progress | null {
  if (amount === 0) return p;
  if (p.coins + amount < 0) return null;
  const entry: LedgerEntry = { at: Date.now(), amount, reason };
  return { ...p, coins: p.coins + amount, ledger: [...p.ledger, entry].slice(-LEDGER_SIZE) };
}

export function useProgress() {
  return useSyncExternalStore(subscribeProgress, getProgress, getProgress);
}

export function playLevel(level: number) {
  if (level < 1 || level > state.unlocked) return;
  set({ ...state, current: level, session: state.session + 1 });
}

export function totalStars(records: Record<number, LevelRecord>) {
  return Object.values(records).reduce((s, r) => s + r.stars, 0);
}

/** Today's Daily Trial: the pinned one if it is from today, otherwise a fresh pick. */
export function dailyTrial(p: Progress, day = today()) {
  if (p.trial?.day === day) return p.trial;
  return { day, level: pickTrialLevel(day, p.unlocked), done: false };
}

/** Pins today's trial so clearing levels later in the day doesn't change it. */
export function pinDailyTrial() {
  const trial = dailyTrial(state);
  if (state.trial !== trial) set({ ...state, trial });
}

export function startDailyTrial() {
  pinDailyTrial();
  playLevel(state.trial!.level);
}

/**
 * Records a cleared level and pays its coins: the full reward on a first clear, a small one on a
 * replay (see levelReward). The trial bonus is paid when today's trial is beaten within par.
 */
export function completeLevel(level: number, result: LevelResult) {
  const record = recordFor(result);
  const coins = levelReward(record.stars, state.records[level]?.stars);
  const trial = state.trial;
  const beatTrial = !!trial && trial.day === today() && !trial.done && trial.level === level && result.moves <= result.par;
  const trialBonus = beatTrial ? TRIAL_REWARD : 0;
  let next: Progress = {
    ...state,
    // Resume on the next level if the app closes before "Next Level" is tapped. The session is
    // unchanged, so the solved board stays on screen behind the level-complete sheet.
    current: Math.max(state.current, level + 1),
    unlocked: Math.max(state.unlocked, level + 1),
    records: { ...state.records, [level]: bestRecord(state.records[level], record) },
    trial: beatTrial ? { ...trial!, done: true } : state.trial,
  };
  next = withCoins(next, coins, 'level')!;
  next = withCoins(next, trialBonus, 'trial')!;
  set(next);
  return { record, coins, trialBonus };
}

/**
 * Pays for one use of an in-level booster. `used` is how many times the player already used it on
 * this level; uses within the free allowance cost nothing. Returns false if the player can't afford it.
 */
export function payForBooster(kind: Booster, used: number) {
  const next = withCoins(state, -boosterPrice(kind, used), kind);
  if (!next) return false;
  if (next !== state) set(next);
  return true;
}

/** Buys a coin-priced cosmetic and equips it. Returns false if it can't be bought. */
export function buyCosmetic(id: string) {
  const item = cosmetic(id);
  if (!item || item.unlock.kind !== 'coins' || state.owned.includes(id)) return false;
  const paid = withCoins(state, -item.unlock.price, 'shop');
  if (!paid) return false;
  set({ ...paid, owned: [...paid.owned, id], equipped: { ...paid.equipped, [item.slot]: id } });
  return true;
}

export function equipCosmetic(id: string) {
  const item = cosmetic(id);
  if (!item || !isOwned(item, state.owned, state.unlocked, totalStars(state.records))) return;
  set({ ...state, equipped: { ...state.equipped, [item.slot]: id } });
}

/** Coins earned by watching a rewarded ad (called only after the ad reports the reward). */
export function grantAdCoins(amount: number) {
  set(withCoins(state, amount, 'ad')!);
}

/** Same rule the server enforces: 3-20 letters, numbers, spaces or underscores. */
export function cleanPlayerName(name: string) {
  const clean = name.trim().replace(/\s+/g, ' ');
  return /^[A-Za-z0-9_ ]{3,20}$/.test(clean) ? clean : null;
}

/** Renames the player. Returns false if the name breaks the rule above. */
export function setPlayerName(name: string) {
  const clean = cleanPlayerName(name);
  if (!clean) return false;
  if (clean !== state.playerName) set({ ...state, playerName: clean });
  return true;
}

/** Free coins once per day. Returns false if already claimed today. */
export function claimDailyBonus() {
  const day = today();
  if (state.bonusDay === day) return false;
  set({ ...withCoins(state, DAILY_BONUS, 'daily')!, bonusDay: day });
  return true;
}
