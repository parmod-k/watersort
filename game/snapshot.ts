import type { LevelRecord } from './scoring';

/**
 * Compact copy of the player's progress for the iOS Keychain backup (see backup.ios.ts). Level
 * records become short arrays and the coin ledger is left out, so the snapshot stays a few KB.
 */

type Row = [level: number, moves: number, par: number, seconds: number, flags: number, stars: number, score: number];

export type Snapshot<T> = Omit<T, 'records' | 'ledger' | 'session'> & { v: 1; rows: Row[] };

export function packSnapshot<T extends { records: Record<number, LevelRecord>; ledger: unknown; session: unknown }>(p: T): Snapshot<T> {
  const { records, ledger, session, ...rest } = p;
  const rows = Object.entries(records).map(([level, r]): Row => [
    Number(level),
    r.moves,
    r.par,
    r.seconds,
    (r.usedUndo ? 1 : 0) | (r.usedExtraBottle ? 2 : 0),
    r.stars,
    r.score,
  ]);
  return { ...rest, v: 1, rows };
}

/** Back to the saved-progress shape (with an empty ledger). Returns null for anything unrecognised. */
export function unpackSnapshot(raw: string | null): Record<string, unknown> | null {
  try {
    const s = JSON.parse(raw ?? 'null');
    if (!s || s.v !== 1 || !Array.isArray(s.rows)) return null;
    const { v, rows, ...rest } = s;
    const records: Record<number, LevelRecord> = {};
    for (const row of rows as Row[]) {
      if (!Array.isArray(row) || row.length !== 7 || !row.every(Number.isFinite)) continue;
      const [level, moves, par, seconds, flags, stars, score] = row;
      records[level] = { moves, par, seconds, usedUndo: !!(flags & 1), usedExtraBottle: !!(flags & 2), stars, score };
    }
    return { ...rest, records, ledger: [] };
  } catch {
    return null;
  }
}
