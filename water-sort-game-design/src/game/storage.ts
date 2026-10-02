export type Progress = {
  unlocked: number;
  coins: number;
  stars: Record<number, number>;
  sound: boolean;
};

const KEY = 'watersort.progress.v1';

export const defaultProgress: Progress = { unlocked: 1, coins: 500, stars: {}, sound: true };

export function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...defaultProgress };
    const p = JSON.parse(raw);
    return { ...defaultProgress, ...p, stars: p.stars ?? {} };
  } catch {
    return { ...defaultProgress };
  }
}

export function saveProgress(p: Progress) {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    /* ignore */
  }
}
