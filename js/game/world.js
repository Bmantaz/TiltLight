// One simulation step. Pure game state: no DOM, no drawing.
// Afterwards the caller checks G.over (player died) and G.pendingLv (level-ups waiting).
import { ENEMIES } from '../config/enemies.js';
import { LIMITS, NOVA, xpFor } from '../config/balance.js';
import { TAU, within, alive } from '../core/math.js';
import { offscreen } from '../core/view.js';
import { spawn } from './spawn.js';
import { fireWeapons, BULLET_SPEED } from './weapons.js';
import { hurt, heal, damagePlayer } from './combat.js';

const GRID_CELL = 40;       // spatial grid size for enemy separation
const RECYCLE_DIST = 1500;  // enemies this far behind are moved back near the screen edge

export function step(G, dt, move){
  G.t += dt;
  movePlayer(G, dt, move);
  spawn(G, dt);
  fireWeapons(G, dt);
  moveEnemies(G, dt);
  if (G.over) return;
  separateEnemies(G);
  updateBullets(G, dt);
  updateFires(G, dt);
  updateNovas(G, dt);
  G.enemies = G.enemies.filter(e => !e.dead);
  collectGems(G, dt);
  updateEffects(G, dt);
}

function movePlayer(G, dt, move){
  const p = G.p, speed = p.speed * G.stats.speedMul, m = Math.hypot(move.x, move.y);
  p.x += move.x * speed * dt; p.y += move.y * speed * dt;
  if (m > 0.08) { p.fx = move.x / m; p.fy = move.y / m; }
  G.moved += m * speed * dt;
  p.inv = Math.max(0, p.inv - dt);
  p.shield = Math.max(0, p.shield - dt);
  if (G.stats.regen) heal(G, G.stats.regen * dt);
  G.shake = Math.max(0, G.shake - dt * 40);
  G.hurtFlash = Math.max(0, G.hurtFlash - dt);
  G.novaFlash = Math.max(0, G.novaFlash - dt * 2);
}

function moveEnemies(G, dt){
  const p = G.p;
  for (const e of G.enemies) {
    const dx = p.x - e.x, dy = p.y - e.y, d = Math.hypot(dx, dy) || 1;
    const s = e.spd * (e.slow > 0 ? 0.5 : 1);
    e.x += dx / d * s * dt; e.y += dy / d * s * dt;
    e.slow -= dt; e.hitT -= dt; e.orbT -= dt; e.fireT -= dt; e.wob += dt * 4;
    if (d < e.r + p.r) damagePlayer(G, e.dmg);
    if (G.over) return;
    if (d > RECYCLE_DIST && !ENEMIES[e.type].boss) {
      const a = Math.random() * TAU, r = offscreen(60);
      e.x = p.x + Math.cos(a) * r; e.y = p.y + Math.sin(a) * r;
    }
  }
}

/** Push overlapping enemies apart, using a grid so each one only checks its neighbours. */
function separateEnemies(G){
  const cell = v => Math.floor(v / GRID_CELL);
  const grid = new Map();
  for (const e of G.enemies) {
    const k = cell(e.x) + ',' + cell(e.y);
    let list = grid.get(k);
    if (!list) grid.set(k, list = []);
    list.push(e);
  }
  for (const e of G.enemies) {
    const gx = cell(e.x), gy = cell(e.y);
    for (let ix = gx - 1; ix <= gx + 1; ix++) for (let iy = gy - 1; iy <= gy + 1; iy++) {
      const list = grid.get(ix + ',' + iy);
      if (!list) continue;
      for (const o of list) {
        if (o === e) continue;
        const dx = e.x - o.x, dy = e.y - o.y, rr = e.r + o.r, d2 = dx * dx + dy * dy;
        if (d2 < rr * rr && d2 > 0.01) {
          const d = Math.sqrt(d2), push = (rr - d) * 0.25;
          e.x += dx / d * push; e.y += dy / d * push;
        }
      }
    }
  }
}

function updateBullets(G, dt){
  for (const b of G.bullets) {
    b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
    for (const e of G.enemies) {
      if (e.dead || b.hit.has(e) || !within(e, b, e.r + 5)) continue;
      b.hit.add(e);
      hurt(G, e, b.d, b.vx / BULLET_SPEED * 6, b.vy / BULLET_SPEED * 6);
      if (--b.pierce <= 0) { b.life = 0; break; }
    }
  }
  G.bullets = G.bullets.filter(alive);
}

function updateFires(G, dt){
  for (const f of G.fires) {
    f.life -= dt;
    for (const e of G.enemies) {
      if (!e.dead && e.fireT <= 0 && within(e, f, f.r + e.r)) { e.fireT = 0.3; hurt(G, e, f.d); }
    }
  }
  G.fires = G.fires.filter(alive);
}

function updateNovas(G, dt){
  for (const n of G.novas) {
    n.r += NOVA.speed * dt;
    for (const e of G.enemies) {
      if (e.dead || n.hit.has(e)) continue;
      const dx = e.x - n.x, dy = e.y - n.y, d = Math.hypot(dx, dy) || 1;
      if (d < n.r) { n.hit.add(e); hurt(G, e, NOVA.damage(G.level), dx / d * NOVA.knock, dy / d * NOVA.knock); }
    }
  }
  G.novas = G.novas.filter(n => n.r < n.max);
}

/** Gems fly to the player once inside the magnet range; picking them up gives XP. */
function collectGems(G, dt){
  const p = G.p, mag = G.stats.magnet;
  for (const g of G.gems) {
    const dx = p.x - g.x, dy = p.y - g.y, d = Math.hypot(dx, dy) || 1;
    if (!g.pull && d < mag) g.pull = true;
    if (g.pull) {
      const s = 260 + (mag - Math.min(d, mag)) * 6;
      g.x += dx / d * s * dt; g.y += dy / d * s * dt;
    }
    if (d < p.r + 8) {
      g.got = true; G.xp += g.v;
      while (G.xp >= G.xpNext) { G.xp -= G.xpNext; G.level++; G.xpNext = xpFor(G.level); G.pendingLv++; }
    }
  }
  G.gems = G.gems.filter(g => !g.got);
  if (G.gems.length > LIMITS.gems) G.gems.splice(0, G.gems.length - LIMITS.gems);
}

function updateEffects(G, dt){
  for (const q of G.parts) { q.x += q.vx * dt; q.y += q.vy * dt; q.vx *= .92; q.vy *= .92; q.life -= dt; }
  G.parts = G.parts.filter(alive);
  for (const t of G.texts) { t.y -= 30 * dt; t.life -= dt; }
  G.texts = G.texts.filter(alive);
  for (const b of G.bolts) b.life -= dt;
  G.bolts = G.bolts.filter(alive);
}
