// Weapons fire on their own. Each one reads its numbers for the current level from WEAPON_STATS.
import { WEAPON_STATS, WEAPON_IDS } from '../config/upgrades.js';
import { LIMITS } from '../config/balance.js';
import { TAU, dist2, within, jitter } from '../core/math.js';
import { view, onScreen } from '../core/view.js';
import { hurt } from './combat.js';

export const BULLET_SPEED = 440;
const SPARK_RANGE = 700;
const THUNDER_SPLASH = 46;

export const weaponStats = (G, id) => WEAPON_STATS[id][G.weapons[id] - 1];

/** Where each orbiting lantern is right now. Shared by the hit check and the renderer. */
export function orbitPositions(G){
  const s = weaponStats(G, 'orbit'), p = G.p;
  return Array.from({ length: s.n }, (_, i) => {
    const a = G.orbA + i / s.n * TAU;
    return { x: p.x + Math.cos(a) * s.r, y: p.y + Math.sin(a) * s.r };
  });
}

/** Count down a weapon's cooldown; true when it's time to fire. The first shot comes after 0.3 s. */
function ready(G, id, cd, dt){
  G.timers[id] = (G.timers[id] ?? 0.3) - dt;
  if (G.timers[id] > 0) return false;
  G.timers[id] = cd * G.stats.cd;
  return true;
}

/** Jagged path from above the screen down to the target. */
function boltPath(e){
  const pts = [];
  let x = e.x + jitter(80), y = e.y - view.h;
  for (let k = 0; k <= 8; k++) {
    pts.push([x, y]);
    y += (e.y - y) / (8 - k + 1);
    x += (e.x - x) / (8 - k + 1) + (k < 8 ? jitter(40) : 0);
  }
  pts.push([e.x, e.y]);
  return pts;
}

const FIRE = {
  spark(G, s, dt){
    if (!ready(G, 'spark', s.cd, dt)) return;
    const p = G.p;
    const targets = G.enemies
      .filter(e => !e.dead && Math.abs(e.x - p.x) < SPARK_RANGE && Math.abs(e.y - p.y) < SPARK_RANGE)
      .sort((a, b) => dist2(a, p) - dist2(b, p));
    for (let i = 0; i < s.n; i++) {
      let ang;
      if (targets.length) {
        const e = targets[i % targets.length];
        ang = Math.atan2(e.y - p.y, e.x - p.x) + (i >= targets.length ? jitter(.4) : 0);
      } else {
        ang = Math.atan2(p.fy, p.fx) + (i - (s.n - 1) / 2) * 0.25;   // fan out ahead of the player
      }
      G.bullets.push({ x: p.x, y: p.y, vx: Math.cos(ang) * BULLET_SPEED, vy: Math.sin(ang) * BULLET_SPEED, d: s.d, pierce: s.p, life: 1.4, hit: new Set() });
    }
  },

  orbit(G, s, dt){
    G.orbA += dt * 3.1;
    for (const o of orbitPositions(G)) {
      for (const e of G.enemies) {
        if (e.dead || e.orbT > 0) continue;
        const dx = e.x - o.x, dy = e.y - o.y;
        if (dx * dx + dy * dy < (e.r + 11) ** 2) {
          e.orbT = 0.4;
          const d = Math.hypot(dx, dy) || 1;
          hurt(G, e, s.d, dx / d * 10, dy / d * 10);
        }
      }
    }
  },

  frost(G, s, dt){
    if (!ready(G, 'frost', 0.5, dt)) return;
    for (const e of G.enemies) {
      if (!e.dead && within(e, G.p, s.r + e.r)) { e.slow = 1; hurt(G, e, s.d); }
    }
  },

  thunder(G, s, dt){
    if (!ready(G, 'thunder', s.cd, dt)) return;
    const pool = G.enemies.filter(e => !e.dead && onScreen(e, G.p));
    for (let i = 0; i < s.n && pool.length; i++) {
      const e = pool.splice(Math.random() * pool.length | 0, 1)[0];
      G.bolts.push({ pts: boltPath(e), life: .22 });
      for (const o of G.enemies) if (!o.dead && within(o, e, THUNDER_SPLASH)) hurt(G, o, s.d);
    }
  },

  ember(G, s){
    if (G.moved < 24) return;   // drop one ember every 24 px walked
    G.moved = 0;
    if (G.fires.length < LIMITS.fires) {
      G.fires.push({ x: G.p.x + jitter(8), y: G.p.y + jitter(8), r: s.r, d: s.d, life: s.life, max: s.life });
    }
  },
};

export function fireWeapons(G, dt){
  for (const id of WEAPON_IDS) if (G.weapons[id]) FIRE[id](G, weaponStats(G, id), dt);
}
