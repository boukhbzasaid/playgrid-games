export type TubeState = number[]; // bottom -> top, color ids
export type Board = TubeState[];

export const CAPACITY = 4;

export type ColorDef = {
  id: number;
  name: string;
  light: string;
  base: string;
  dark: string;
};

export const COLORS: ColorDef[] = [
  { id: 0, name: 'red', light: '#ff8a8a', base: '#f4322c', dark: '#b8100c' },
  { id: 1, name: 'orange', light: '#ffc07a', base: '#ff8a1e', dark: '#d15d00' },
  { id: 2, name: 'yellow', light: '#ffe98a', base: '#ffce1b', dark: '#d19b00' },
  { id: 3, name: 'green', light: '#9ff59a', base: '#35c93c', dark: '#128a22' },
  { id: 4, name: 'cyan', light: '#9df0ff', base: '#22c4e8', dark: '#0c7fa3' },
  { id: 5, name: 'blue', light: '#9db9ff', base: '#2f6bff', dark: '#1235b8' },
  { id: 6, name: 'purple', light: '#d4a6ff', base: '#9b3bf0', dark: '#5d11a8' },
  { id: 7, name: 'pink', light: '#ffb0e0', base: '#ff49ad', dark: '#c00d74' },
  { id: 8, name: 'lime', light: '#e4ff9c', base: '#b6e429', dark: '#6f9c00' },
  { id: 9, name: 'teal', light: '#8ff2d6', base: '#14b391', dark: '#04745e' },
  { id: 10, name: 'brown', light: '#d8a887', base: '#9c5a2c', dark: '#653113' },
  { id: 11, name: 'grey', light: '#d7dbe6', base: '#8a93ab', dark: '#525a6e' },
];

/* ------------------------------------------------------------------ */
/* Rules                                                               */
/* ------------------------------------------------------------------ */

export const top = (t: TubeState) => (t.length ? t[t.length - 1] : -1);

export function topRunLength(t: TubeState) {
  if (!t.length) return 0;
  const c = top(t);
  let n = 0;
  for (let i = t.length - 1; i >= 0 && t[i] === c; i--) n++;
  return n;
}

export function isMonochrome(t: TubeState) {
  return t.length > 0 && t.every((c) => c === t[0]);
}

export function isTubeDone(t: TubeState) {
  return t.length === 0 || (t.length === CAPACITY && isMonochrome(t));
}

export function isSolved(board: Board) {
  return board.every(isTubeDone);
}

export function canPour(board: Board, from: number, to: number) {
  if (from === to) return false;
  const a = board[from];
  const b = board[to];
  if (!a.length) return false;
  if (b.length >= CAPACITY) return false;
  if (b.length && top(b) !== top(a)) return false;
  // pointless move: moving a complete-color tube into an empty one
  if (!b.length && isMonochrome(a)) return false;
  return true;
}

export function pourAmount(board: Board, from: number, to: number) {
  return Math.min(topRunLength(board[from]), CAPACITY - board[to].length);
}

export function applyPour(board: Board, from: number, to: number): Board {
  const next = board.map((t) => t.slice());
  const n = pourAmount(board, from, to);
  const color = top(board[from]);
  next[from].splice(next[from].length - n, n);
  for (let i = 0; i < n; i++) next[to].push(color);
  return next;
}

/* ------------------------------------------------------------------ */
/* Solver (DFS with memo) — used to validate & to generate hints        */
/* ------------------------------------------------------------------ */

const key = (b: Board) => b.map((t) => t.join('.')).sort().join('|');

export type Move = { from: number; to: number };

export function solve(board: Board, nodeLimit = 120000): Move[] | null {
  const seen = new Set<string>();
  let nodes = 0;
  const path: Move[] = [];

  const dfs = (b: Board, depth: number): boolean => {
    if (isSolved(b)) return true;
    if (depth > 220) return false;
    if (++nodes > nodeLimit) return false;
    const k = key(b);
    if (seen.has(k)) return false;
    seen.add(k);

    const moves: { m: Move; score: number }[] = [];
    for (let i = 0; i < b.length; i++) {
      if (!b[i].length) continue;
      for (let j = 0; j < b.length; j++) {
        if (!canPour(b, i, j)) continue;
        const amount = pourAmount(b, i, j);
        if (amount < topRunLength(b[i]) && b[j].length) {
          // partial pour into non-empty: allowed but low priority
        }
        let score = 0;
        if (b[j].length && b[j].length + amount === CAPACITY) score += 100; // completes
        if (topRunLength(b[i]) === b[i].length) score += 40; // empties source
        if (b[j].length) score += 20;
        score += amount * 5;
        moves.push({ m: { from: i, to: j }, score });
      }
    }
    moves.sort((x, y) => y.score - x.score);

    for (const { m } of moves) {
      const nb = applyPour(b, m.from, m.to);
      path.push(m);
      if (dfs(nb, depth + 1)) return true;
      path.pop();
      if (nodes > nodeLimit) return false;
    }
    return false;
  };

  return dfs(board.map((t) => t.slice()), 0) ? path.slice() : null;
}

/* ------------------------------------------------------------------ */
/* Level generation                                                    */
/* ------------------------------------------------------------------ */

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type LevelConfig = { colors: number; empties: number };

export function levelConfig(level: number): LevelConfig {
  let colors: number;
  if (level <= 3) colors = 3;
  else if (level <= 6) colors = 4;
  else if (level <= 9) colors = 5;
  else if (level <= 12) colors = 6;
  else if (level <= 16) colors = 7;
  else if (level <= 20) colors = 8;
  else if (level <= 25) colors = 9;
  else if (level <= 30) colors = 10;
  else if (level <= 40) colors = 11;
  else colors = 8 + ((level * 7) % 5); // 8..12 endless variety
  colors = Math.min(colors, COLORS.length);
  const empties = 2;
  return { colors, empties };
}

/** Rough lower bound on the number of moves needed. */
export function computePar(board: Board) {
  let runs = 0;
  const colorSet = new Set<number>();
  for (const t of board) {
    for (let i = 0; i < t.length; i++) {
      colorSet.add(t[i]);
      if (i === 0 || t[i] !== t[i - 1]) runs++;
    }
  }
  return Math.max(colorSet.size, runs - colorSet.size);
}

/** Deterministic, always-solvable board for a level number. */
export function generateLevel(level: number): Board {
  const { colors, empties } = levelConfig(level);
  for (let attempt = 0; attempt < 30; attempt++) {
    const rnd = mulberry32(level * 100003 + attempt * 7919 + 13);
    const units: number[] = [];
    for (let c = 0; c < colors; c++) for (let i = 0; i < CAPACITY; i++) units.push(c);
    // Fisher-Yates
    for (let i = units.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [units[i], units[j]] = [units[j], units[i]];
    }
    const board: Board = [];
    for (let i = 0; i < colors; i++) board.push(units.slice(i * CAPACITY, (i + 1) * CAPACITY));
    for (let i = 0; i < empties; i++) board.push([]);

    // avoid trivially-prefilled boards
    const already = board.filter((t) => t.length === CAPACITY && isMonochrome(t)).length;
    if (already > 0) continue;
    if (colors >= 4) {
      const singles = board.filter((t) => new Set(t).size === 1).length;
      if (singles > 0) continue;
    }
    if (solve(board, 25000)) return board;
  }
  // fallback: simple guaranteed-solvable near-solved board
  const board: Board = [];
  for (let c = 0; c < colors; c++) board.push([c, c, c, c]);
  for (let i = 0; i < empties; i++) board.push([]);
  const rnd = mulberry32(level + 1);
  for (let i = 0; i < 40; i++) {
    const opts: Move[] = [];
    for (let a = 0; a < board.length; a++)
      for (let b = 0; b < board.length; b++)
        if (a !== b && board[a].length && board[b].length < CAPACITY && (!board[b].length || top(board[b]) === top(board[a])))
          opts.push({ from: a, to: b });
    if (!opts.length) break;
    const m = opts[Math.floor(rnd() * opts.length)];
    const c = board[m.from].pop()!;
    board[m.to].push(c);
  }
  return board;
}

export function starRating(moves: number, par: number) {
  if (moves <= par + 2) return 3;
  if (moves <= par * 1.5 + 4) return 2;
  return 1;
}
