export const TAU = Math.PI * 2;

/** Random offset in [-size/2, size/2). */
export const jitter = size => (Math.random() - 0.5) * size;

export const dist2 = (a, b) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
export const within = (a, b, r) => dist2(a, b) < r * r;

/** Filter predicate for anything with a `life` countdown. */
export const alive = o => o.life > 0;

export function shuffle(list){
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.random() * (i + 1) | 0;
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

/** Stable 0..1 hash of an integer grid cell, so the scenery never changes between frames. */
export function hash2(x, y){
  let n = (Math.imul(x, 374761393) + Math.imul(y, 668265263)) | 0;
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  n ^= n >>> 16;
  return (n >>> 0) / 4294967296;
}

export const fmtTime = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
