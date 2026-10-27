// Where and when enemies appear. Difficulty rises with time survived (G.t, in seconds).
import { ENEMIES } from '../config/enemies.js';
import { LIMITS, WAVE_EVERY } from '../config/balance.js';
import { TAU } from '../core/math.js';
import { offscreen } from '../core/view.js';

export function spawnEnemy(G, type, ang = Math.random() * TAU, dist = offscreen(60)){
  const T = ENEMIES[type], hp = T.hp * (1 + G.t / 110);
  G.enemies.push({
    type, x: G.p.x + Math.cos(ang) * dist, y: G.p.y + Math.sin(ang) * dist, hp, maxHp: hp,
    spd: T.spd * (0.9 + Math.random() * 0.2), r: T.r, dmg: T.dmg, xp: T.xp, col: T.col, charge: T.charge,
    hitT: 0, slow: 0, orbT: 0, fireT: 0, wob: Math.random() * TAU,
  });
}

function pickType(t){
  const bruteChance = t > 45 ? Math.min(0.22, (t - 45) / 400) : 0;
  if (Math.random() < bruteChance) return 'brute';
  return Math.random() < (t < 25 ? 0.7 : 0.5) ? 'wisp' : 'shade';
}

/** A steady trickle that speeds up, plus an elite and a closing ring of wisps every wave. */
export function spawn(G, dt){
  G.spawnAcc += Math.min(16, 1.1 + G.t * 0.05) * dt;
  while (G.spawnAcc >= 1) {
    G.spawnAcc--;
    if (G.enemies.length < LIMITS.enemies) spawnEnemy(G, pickType(G.t));
  }
  if (G.t >= G.nextWave) {
    G.nextWave += WAVE_EVERY;
    spawnEnemy(G, 'elite');
    const ring = 18 + Math.floor(G.t / 60) * 4, d = offscreen(30);
    for (let i = 0; i < ring; i++) spawnEnemy(G, 'wisp', i / ring * TAU, d);
  }
}
