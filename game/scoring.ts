import { isMysteryLevel, starsFor } from './levels';

/** Outcome of one cleared level. */
export type LevelResult = {
  moves: number;
  par: number;
  seconds: number;
  usedUndo: boolean;
  usedExtraBottle: boolean;
};

/** Best result kept per level. */
export type LevelRecord = LevelResult & { stars: number; score: number };

export type ScoreBreakdown = {
  base: number;
  efficiency: number;
  time: number;
  restraint: number;
  total: number;
};

export const SCORE_MAX = { base: 100, efficiency: 100, time: 50, restraint: 100 };

/** Seconds a level "should" take: about 3s per par move, never under 20s. */
export function targetSeconds(par: number) {
  return Math.max(20, par * 3);
}

/**
 * Level score (max 350):
 *  - base 100 for clearing it
 *  - move efficiency up to 100: par / moves (fewest possible pours = full marks)
 *  - time up to 50: full at or under the target time, fading to 0 at 3x the target
 *  - restraint up to 100: +50 without Undo, +50 without the extra-bottle power-up
 */
export function scoreFor(r: LevelResult): ScoreBreakdown {
  const base = SCORE_MAX.base;
  const efficiency = Math.round(SCORE_MAX.efficiency * Math.min(1, r.par / Math.max(1, r.moves)));
  const target = targetSeconds(r.par);
  const over = Math.max(0, r.seconds - target);
  const time = Math.round(SCORE_MAX.time * Math.max(0, 1 - over / (target * 2)));
  const restraint = (r.usedUndo ? 0 : 50) + (r.usedExtraBottle ? 0 : 50);
  return { base, efficiency, time, restraint, total: base + efficiency + time + restraint };
}

export function recordFor(r: LevelResult): LevelRecord {
  return { ...r, stars: starsFor(r.moves, r.par), score: scoreFor(r).total };
}

/** Keeps the better of two records (by score), but never loses a better star rating. */
export function bestRecord(prev: LevelRecord | undefined, next: LevelRecord): LevelRecord {
  if (!prev) return next;
  const winner = next.score > prev.score ? next : prev;
  return { ...winner, stars: Math.max(prev.stars, next.stars) };
}

// ---------------------------------------------------------------------------
// Player stats and leaderboards
// ---------------------------------------------------------------------------

export type PlayerStats = {
  /** Highest level reached (the level the player is currently on). */
  level: number;
  stars: number;
  score: number;
  cleared: number;
  /** 3 stars without Undo or the extra bottle. */
  perfect: number;
  noUndo: number;
  /** Clears under 45 seconds. */
  fast: number;
  mystery: number;
};

export function statsFor(records: Record<number, LevelRecord>, unlocked: number): PlayerStats {
  const all = Object.values(records);
  return {
    level: unlocked,
    stars: all.reduce((s, r) => s + r.stars, 0),
    score: all.reduce((s, r) => s + r.score, 0),
    cleared: all.length,
    perfect: all.filter((r) => r.stars === 3 && !r.usedUndo && !r.usedExtraBottle).length,
    noUndo: all.filter((r) => !r.usedUndo).length,
    fast: all.filter((r) => r.seconds < 45).length,
    mystery: Object.keys(records).filter((level) => isMysteryLevel(Number(level))).length,
  };
}

export type League = { name: string; next?: { name: string; at: number } };

const LEAGUES = [
  { name: 'Bronze', at: 0 },
  { name: 'Silver', at: 2000 },
  { name: 'Gold', at: 6000 },
  { name: 'Diamond', at: 15000 },
  { name: 'Master', at: 35000 },
];

export function leagueFor(score: number): League {
  let i = 0;
  while (i + 1 < LEAGUES.length && score >= LEAGUES[i + 1].at) i++;
  return { name: LEAGUES[i].name, next: LEAGUES[i + 1] };
}

export type BoardKind = 'level' | 'stars' | 'score';

export type BoardEntry = {
  name: string;
  level: number;
  stars: number;
  score: number;
  isMe?: boolean;
  /** Standard competition rank: tied values share a rank ("1, 2, 2, 4"). */
  rank: number;
};

const RIVAL_NAMES = [
  'AquaQueen', 'LiquidSorcerer', 'VialWizard', 'HydroPulse', 'PrismPour', 'TideTamer', 'FlaskFox',
  'NeonDrip', 'CobaltCascade', 'SplashSage', 'GlassGolem', 'MistMixer', 'CoralCrafter', 'BubbleBard',
  'IndigoInk', 'RippleRogue', 'LagoonLord', 'DewDancer', 'TealTitan', 'AmberAlchemist', 'VortexVial',
  'SirenSorter', 'PotionPilot', 'EmeraldEddy', 'QuartzQuencher', 'SaffronSwirl', 'OnyxOoze',
  'PearlPourer', 'MagentaMist', 'CrystalCurrent',
];

/** Small deterministic PRNG so the sample rivals are the same on every launch. */
function seeded(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), a | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Sample rivals spread from level 3 to ~140. There is no game server yet, so these stand in for
 * other players; replace with a backend fetch when one exists.
 */
export function sampleRivals(): Omit<BoardEntry, 'rank'>[] {
  const rand = seeded(42);
  return RIVAL_NAMES.map((name, i) => {
    const level = Math.max(3, Math.round(140 * Math.pow((RIVAL_NAMES.length - i) / RIVAL_NAMES.length, 1.6)));
    const cleared = level - 1;
    const stars = Math.round(cleared * (2.1 + rand() * 0.8));
    const score = Math.round(cleared * (230 + rand() * 90));
    return { name, level, stars, score };
  });
}

function valueOf(e: Omit<BoardEntry, 'rank'>, kind: BoardKind) {
  return kind === 'level' ? e.level : kind === 'stars' ? e.stars : e.score;
}

/** Ranks everyone on one board; the player sorts ahead of rivals they tie with. */
export function buildBoard(me: Omit<BoardEntry, 'rank'>, kind: BoardKind): BoardEntry[] {
  const everyone = [...sampleRivals(), { ...me, isMe: true }];
  everyone.sort((a, b) => valueOf(b, kind) - valueOf(a, kind) || Number(!!b.isMe) - Number(!!a.isMe));
  const ranked: BoardEntry[] = [];
  everyone.forEach((e, i) => {
    const tiedWithPrev = i > 0 && valueOf(e, kind) === valueOf(everyone[i - 1], kind);
    ranked.push({ ...e, rank: tiedWithPrev ? ranked[i - 1].rank : i + 1 });
  });
  return ranked;
}
