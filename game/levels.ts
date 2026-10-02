import { liquidOrder } from '../theme/tokens';

export const CAPACITY = 4;

export type Stack = string[]; // bottom -> top

export type Level = {
  number: number;
  tubes: Stack[];
  /** Per tube: how many bottom segments start as "?" mystery layers. */
  hidden: number[];
  colorCount: number;
  emptyCount: number;
  mystery: boolean;
  /** Moves the reference solution needs; used for star ratings. */
  par: number;
};

export type SolverMove = { source: number; target: number; count: number };

// ---------------------------------------------------------------------------
// Difficulty curve
// ---------------------------------------------------------------------------

/** 2 colors on level 1, 3 from level 2, then one more every 4 levels, capped at the full palette (14). */
export function colorCountFor(level: number) {
  if (level <= 1) return 2;
  return Math.min(liquidOrder.length, 3 + Math.floor((level - 2) / 4));
}

/** 0 = big same-color blocks, 1 = every layer alternates. */
export function fragmentationFor(level: number) {
  return Math.max(0, Math.min(1, (level - 4) / 24));
}

/** Every 5th level from 25 on hides all but the top layer of each bottle. */
export function isMysteryLevel(level: number) {
  return level >= 25 && level % 5 === 0;
}

// ---------------------------------------------------------------------------
// Rules shared by the game screen and the solver
// ---------------------------------------------------------------------------

export function isTubeComplete(stack: Stack) {
  return stack.length === CAPACITY && stack.every((c) => c === stack[0]);
}

export function isSolved(tubes: Stack[]) {
  return tubes.every((s) => s.length === 0 || isTubeComplete(s));
}

/** Number of consecutive same-colored segments at the top of a stack. */
export function topRunLength(stack: Stack) {
  let n = 0;
  while (n < stack.length && stack[stack.length - 1 - n] === stack[stack.length - 1]) n++;
  return n;
}

export function canPour(source: Stack, target: Stack) {
  if (source.length === 0 || target.length >= CAPACITY) return false;
  return target.length === 0 || target[target.length - 1] === source[source.length - 1];
}

/** How many segments a pour moves: the whole top run, limited by the target's free slots. */
export function pourCount(source: Stack, target: Stack) {
  return Math.min(topRunLength(source), CAPACITY - target.length);
}

// ---------------------------------------------------------------------------
// Solver (depth-first with pruning and a node budget)
// ---------------------------------------------------------------------------

function stateKey(tubes: Stack[]) {
  return tubes
    .map((t) => t.join(','))
    .sort()
    .join('|');
}

function candidateMoves(tubes: Stack[]): SolverMove[] {
  const merges: SolverMove[] = [];
  const toEmpty: SolverMove[] = [];
  for (let s = 0; s < tubes.length; s++) {
    const src = tubes[s];
    if (src.length === 0 || isTubeComplete(src)) continue;
    const run = topRunLength(src);
    let triedEmpty = false;
    for (let t = 0; t < tubes.length; t++) {
      if (s === t) continue;
      const tgt = tubes[t];
      if (!canPour(src, tgt)) continue;
      const count = pourCount(src, tgt);
      if (tgt.length === 0) {
        // Moving a single-color tube into an empty one changes nothing; all empties are equivalent.
        if (run === src.length || triedEmpty) continue;
        triedEmpty = true;
        toEmpty.push({ source: s, target: t, count });
      } else {
        merges.push({ source: s, target: t, count });
      }
    }
  }
  // Prefer moves that pour a whole run onto its own color.
  merges.sort((a, b) => b.count - a.count);
  return [...merges, ...toEmpty];
}

function applyMove(tubes: Stack[], m: SolverMove): Stack[] {
  const next = tubes.slice();
  const src = tubes[m.source];
  const color = src[src.length - 1];
  next[m.source] = src.slice(0, src.length - m.count);
  next[m.target] = [...tubes[m.target], ...Array(m.count).fill(color)];
  return next;
}

/** Finds a solution, or null if none is found within the node budget. */
export function solve(start: Stack[], budget = 40000): SolverMove[] | null {
  const seen = new Set<string>();
  const path: SolverMove[] = [];
  let nodes = 0;

  function dfs(tubes: Stack[]): boolean {
    if (isSolved(tubes)) return true;
    if (++nodes > budget) return false;
    const key = stateKey(tubes);
    if (seen.has(key)) return false;
    seen.add(key);
    for (const m of candidateMoves(tubes)) {
      path.push(m);
      if (dfs(applyMove(tubes, m))) return true;
      path.pop();
      if (nodes > budget) return false;
    }
    return false;
  }

  return dfs(start.map((t) => t.slice())) ? path : null;
}

/** Lower-bound-ish estimate of moves left: every color break needs at least one pour. */
function movesLeftEstimate(tubes: Stack[]) {
  let breaks = 0;
  const bottoms = new Map<string, number>();
  for (const t of tubes) {
    for (let i = 1; i < t.length; i++) if (t[i] !== t[i - 1]) breaks++;
    if (t.length > 0) bottoms.set(t[0], (bottoms.get(t[0]) ?? 0) + 1);
  }
  // A color sitting at the bottom of k bottles needs at least k - 1 of them emptied.
  let spread = 0;
  bottoms.forEach((k) => (spread += k - 1));
  return breaks + spread;
}

/**
 * Weighted best-first search that finds much shorter solutions than solve(); used to set par.
 * Returns null if the budget runs out.
 */
export function solveShort(start: Stack[], budget = 15000): SolverMove[] | null {
  type Node = { tubes: Stack[]; g: number; f: number; parent: Node | null; move: SolverMove | null };
  const heap: Node[] = [];
  const push = (n: Node) => {
    heap.push(n);
    for (let i = heap.length - 1; i > 0; ) {
      const p = (i - 1) >> 1;
      if (heap[p].f <= heap[i].f) break;
      [heap[p], heap[i]] = [heap[i], heap[p]];
      i = p;
    }
  };
  const pop = () => {
    const top = heap[0];
    const last = heap.pop()!;
    if (heap.length > 0) {
      heap[0] = last;
      for (let i = 0; ; ) {
        const l = 2 * i + 1;
        const r = l + 1;
        let m = i;
        if (l < heap.length && heap[l].f < heap[m].f) m = l;
        if (r < heap.length && heap[r].f < heap[m].f) m = r;
        if (m === i) break;
        [heap[m], heap[i]] = [heap[i], heap[m]];
        i = m;
      }
    }
    return top;
  };

  const best = new Map<string, number>();
  const init = start.map((t) => t.slice());
  push({ tubes: init, g: 0, f: 1.5 * movesLeftEstimate(init), parent: null, move: null });
  for (let expanded = 0; heap.length > 0 && expanded < budget; expanded++) {
    const node = pop();
    if (isSolved(node.tubes)) {
      const path: SolverMove[] = [];
      for (let n: Node | null = node; n?.move; n = n.parent) path.unshift(n.move);
      return path;
    }
    for (const m of candidateMoves(node.tubes)) {
      const tubes = applyMove(node.tubes, m);
      const key = stateKey(tubes);
      const g = node.g + 1;
      if ((best.get(key) ?? Infinity) <= g) continue;
      best.set(key, g);
      push({ tubes, g, f: g + 1.5 * movesLeftEstimate(tubes), parent: node, move: m });
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Generator
// ---------------------------------------------------------------------------

/** Small deterministic PRNG so a given level number always produces the same puzzle. */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(arr: T[], rand: () => number) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function adjacentPairs(tubes: Stack[]) {
  let n = 0;
  for (const t of tubes) for (let i = 1; i < t.length; i++) if (t[i] === t[i - 1]) n++;
  return n;
}

/**
 * Fills `bottleCount` bottles with every color's 4 units. When there are more bottles than colors,
 * the spare space is scattered as partly filled bottles rather than one more empty bottle.
 */
function fillTubes(colorCount: number, bottleCount: number, frag: number, rand: () => number): Stack[] {
  const palette = liquidOrder.slice(0, colorCount);

  // Split each color's 4 units into chunks; low fragmentation keeps pairs together.
  const chunks: string[][] = [];
  for (const color of palette) {
    let left = CAPACITY;
    while (left > 0) {
      const size = left >= 2 && rand() > frag ? 2 : 1;
      chunks.push(Array(size).fill(color));
      left -= size;
    }
  }
  const flat = shuffle(chunks, rand).flat();

  const sizes = Array(bottleCount).fill(CAPACITY);
  for (let free = (bottleCount - colorCount) * CAPACITY; free > 0; ) {
    const i = Math.floor(rand() * bottleCount);
    if (sizes[i] > 2) {
      sizes[i]--;
      free--;
    }
  }
  const tubes: Stack[] = [];
  let pos = 0;
  for (const size of sizes) {
    tubes.push(flat.slice(pos, pos + size));
    pos += size;
  }

  // At high fragmentation, swap layers around to break up same-color neighbours.
  if (frag > 0.6) {
    for (let iter = 0; iter < 400 && adjacentPairs(tubes) > 0; iter++) {
      const a = Math.floor(rand() * tubes.length);
      const b = Math.floor(rand() * tubes.length);
      const i = Math.floor(rand() * tubes[a].length);
      const j = Math.floor(rand() * tubes[b].length);
      const before = adjacentPairs(tubes);
      [tubes[a][i], tubes[b][j]] = [tubes[b][j], tubes[a][i]];
      if (adjacentPairs(tubes) > before) [tubes[a][i], tubes[b][j]] = [tubes[b][j], tubes[a][i]];
    }
  }
  return tubes;
}

const cache = new Map<number, Level>();

export function generateLevel(level: number): Level {
  const cached = cache.get(level);
  if (cached) return cached;

  const rand = mulberry32(level * 9973 + 17);
  const colorCount = colorCountFor(level);
  const frag = fragmentationFor(level);
  const mystery = isMysteryLevel(level);

  // Easy levels get 2 empty bottles; past level 30, increasingly often only 1. A board with one
  // empty bottle keeps the same total free space, but scattered across partly filled bottles.
  const wantOneEmpty = level > 30 && rand() < Math.min(0.75, (level - 30) / 40);

  let result: Level | null = null;
  for (let attempt = 0; attempt < 40 && !result; attempt++) {
    // Fall back to 2 empties if 1 keeps proving unsolvable.
    const emptyCount = wantOneEmpty && attempt < 25 ? 1 : 2;
    const filled = fillTubes(colorCount, colorCount + 2 - emptyCount, frag, rand);
    if (filled.some(isTubeComplete)) continue;
    const tubes = [...filled, ...Array.from({ length: emptyCount }, () => [] as Stack[number][])];
    const solution = solve(tubes, colorCount > 9 ? 25000 : 40000);
    if (!solution) continue;
    result = {
      number: level,
      tubes,
      hidden: tubes.map((t) => (mystery ? Math.max(0, t.length - 1) : 0)),
      colorCount,
      emptyCount,
      mystery,
      // Par is the shorter of the two solvers' answers.
      par: Math.min(solution.length, solveShort(tubes)?.length ?? Infinity),
    };
  }

  // Practically unreachable; guarantee a playable board anyway.
  if (!result) {
    const tubes: Stack[] = [...fillTubes(colorCount, colorCount, 0, rand), [], []];
    result = { number: level, tubes, hidden: tubes.map(() => 0), colorCount, emptyCount: 2, mystery: false, par: colorCount * 3 };
  }

  cache.set(level, result);
  return result;
}

/** 3 stars at or under par, 2 within 40% over, otherwise 1. */
export function starsFor(moves: number, par: number) {
  if (moves <= par) return 3;
  if (moves <= Math.ceil(par * 1.4)) return 2;
  return 1;
}
