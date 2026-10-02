import 'expo-sqlite/localStorage/install';
import { useSyncExternalStore } from 'react';
import { bestRecord, LevelRecord, LevelResult, recordFor } from './scoring';

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
  playerName: string;
};

const STORAGE_KEY = 'watersort.progress.v1';
const DEFAULTS: Progress = {
  current: 1,
  session: 0,
  unlocked: 1,
  records: {},
  coins: 1450,
  playerName: 'FluidMaster_99',
};

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
      playerName: typeof saved.playerName === 'string' && saved.playerName ? saved.playerName : DEFAULTS.playerName,
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

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useProgress() {
  return useSyncExternalStore(subscribe, () => state, () => state);
}

export function playLevel(level: number) {
  if (level < 1 || level > state.unlocked) return;
  set({ ...state, current: level, session: state.session + 1 });
}

/** Records a cleared level and returns its record (the new result, not necessarily the best). */
export function completeLevel(level: number, result: LevelResult, coins: number): LevelRecord {
  const record = recordFor(result);
  set({
    ...state,
    // Resume on the next level if the app closes before "Next Level" is tapped. The session is
    // unchanged, so the solved board stays on screen behind the level-complete sheet.
    current: Math.max(state.current, level + 1),
    unlocked: Math.max(state.unlocked, level + 1),
    records: { ...state.records, [level]: bestRecord(state.records[level], record) },
    coins: state.coins + coins,
  });
  return record;
}
