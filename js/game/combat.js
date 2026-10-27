// Damage, death, healing and the Lantern Nova.
import { ENEMIES } from '../config/enemies.js';
import { LIMITS, SUPER_FULL } from '../config/balance.js';
import { TAU, jitter } from '../core/math.js';
import { view } from '../core/view.js';
import { board } from '../hardware/board.js';

export function heal(G, amount){
  G.p.hp = Math.min(G.p.maxHp, G.p.hp + amount);
}

export function addCharge(G, amount){
  G.super = Math.min(SUPER_FULL, G.super + amount);
}

/** Damage an enemy (scaled by the player's damage bonus) and knock it back by (kx, ky). */
export function hurt(G, e, base, kx = 0, ky = 0){
  if (e.dead) return;
  const d = base * G.stats.dmg, knock = ENEMIES[e.type].knock;
  e.hp -= d; e.hitT = 0.09;
  e.x += kx * knock; e.y += ky * knock;
  if (G.texts.length < LIMITS.texts) G.texts.push({ x: e.x + jitter(10), y: e.y - e.r, v: Math.round(d), life: .6 });
  if (e.hp <= 0) kill(G, e);
}

function kill(G, e){
  e.dead = true; G.kills++;
  addCharge(G, e.charge * 1.3);
  G.gems.push({ x: e.x, y: e.y, v: e.xp, pull: false });
  burst(G, e.x, e.y, e.col, ENEMIES[e.type].burst);
}

function burst(G, x, y, col, count){
  for (let i = 0; i < count && G.parts.length < LIMITS.particles; i++) {
    const a = Math.random() * TAU, s = 40 + Math.random() * 140;
    G.parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: .5, max: .5, col, r: 1.5 + Math.random() * 2.5 });
  }
}

/** Expanding ring from the player; `reach` is its final radius as a share of the larger screen side. */
function releaseNova(G, reach){
  G.novas.push({ x: G.p.x, y: G.p.y, r: 0, max: Math.max(view.w, view.h) * reach, hit: new Set() });
  G.novaFlash = 1;
  board.nova();
}

export function useSuper(G){
  if (G.super < SUPER_FULL) return;
  G.super = 0;
  releaseNova(G, 0.75);
  G.p.shield = 2.2; G.shake = 14;
}

/** Hurt the player. Sets G.over when the last life is lost. */
export function damagePlayer(G, d){
  const p = G.p;
  if (p.inv > 0 || p.shield > 0) return;
  p.hp -= d; p.inv = 0.55; G.shake = 9; G.hurtFlash = 0.3;
  board.hit(); board.stats(G);
  if (p.hp > 0) return;
  if (G.revives > 0) {
    G.revives--; p.hp = Math.ceil(p.maxHp / 2); p.shield = 2.5;
    releaseNova(G, 0.6);
    G.texts.push({ x: p.x, y: p.y - 30, v: 'Second wind!', life: 1.6 });
    board.stats(G);
  } else {
    G.over = true;
  }
}
