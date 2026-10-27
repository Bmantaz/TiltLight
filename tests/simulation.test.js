import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { seedRandom, setScreen } from './helpers.js';
import { LIMITS, SUPER_FULL, PLAYER } from '../js/config/balance.js';
import { UPGRADES, WEAPON_IDS } from '../js/config/upgrades.js';
import { resetSave, importSave } from '../js/game/progression.js';
import { newRun } from '../js/game/run.js';
import { step } from '../js/game/world.js';
import { useSuper } from '../js/game/combat.js';
import { rollChoices, applyUpgrade, levelOf } from '../js/game/upgrades.js';

let restore;
beforeEach(() => { restore = seedRandom(42); setScreen(); resetSave(); });
afterEach(() => restore());

/** A simple bot: back away from nearby enemies, otherwise walk to the closest gem. */
function steer(G){
  const p = G.p;
  let x = 0, y = 0;
  for (const e of G.enemies) {
    const dx = p.x - e.x, dy = p.y - e.y, d2 = dx * dx + dy * dy;
    if (d2 < 160 ** 2) { x += dx / d2 * 100; y += dy / d2 * 100; }
  }
  if (Math.hypot(x, y) < 0.2) {
    let best = null, bestD = Infinity;
    for (const g of G.gems) { const d = (g.x - p.x) ** 2 + (g.y - p.y) ** 2; if (d < bestD) { best = g; bestD = d; } }
    if (best) { x += best.x - p.x; y += best.y - p.y; }
  }
  const m = Math.hypot(x, y);
  return m > 1e-6 ? { x: x / m, y: y / m } : { x: 0, y: 0 };
}

/** Walk in a slow circle, so enemies catch up and the ember trail gets laid. */
const circle = (G, t) => ({ x: Math.cos(t * 0.6), y: Math.sin(t * 0.6) });

/** Play a run, taking the first card at each level-up and firing the Nova when ready. */
function play(G, seconds, move = steer, dt = 1 / 60){
  for (let t = 0; t < seconds && !G.over; t += dt) {
    step(G, dt, move(G, t));
    while (G.pendingLv > 0) { G.pendingLv--; applyUpgrade(G, rollChoices(G, 4)[0]); }
    useSuper(G);
    checkInvariants(G);
  }
}

function checkInvariants(G){
  const p = G.p;
  for (const v of [p.x, p.y, p.hp, G.xp, G.super, G.t]) assert.ok(Number.isFinite(v), 'state stays finite');
  assert.ok(p.hp <= p.maxHp, 'hp never exceeds max');
  assert.ok(G.super >= 0 && G.super <= SUPER_FULL, 'charge stays in range');
  assert.ok(G.enemies.length <= LIMITS.enemies + 60, 'enemy cap (plus one wave ring)');
  assert.ok(G.gems.length <= LIMITS.gems);
  assert.ok(G.parts.length <= LIMITS.particles);
}

test('a new run starts from the base stats', () => {
  const G = newRun();
  assert.equal(G.p.hp, PLAYER.hp);
  assert.deepEqual(G.weapons, { spark: 1 });
  assert.equal(G.super, 0);
  assert.equal(G.revives, 0);
});

test('camp perks shape a new run', () => {
  importSave({ v: 1, embers: 0, camp: { vigor: 2, kindling: 1, second: 1, reach: 2 }, records: {} });
  const G = newRun();
  assert.equal(G.p.maxHp, PLAYER.hp + 20);
  assert.equal(G.super, 15);
  assert.equal(G.revives, 1);
  assert.equal(G.stats.magnet, PLAYER.magnet * 1.3);
});

test('a played night: enemies come, levels go up, weapons are picked up', () => {
  const G = newRun();
  play(G, 300);
  assert.ok(G.kills > 100, `killed ${G.kills}`);
  assert.ok(G.level > 5, `reached level ${G.level}`);
  assert.ok(Object.keys(G.weapons).length > 1, 'picked up a second weapon');
});

test('standing still, the light goes out', () => {
  const G = newRun();
  play(G, 600, () => ({ x: 0, y: 0 }));
  assert.ok(G.over, 'the run ended');
});

test('second wind brings the player back once', () => {
  importSave({ v: 1, embers: 0, camp: { second: 1 }, records: {} });
  const G = newRun();
  G.p.hp = 1;
  G.enemies.push({ type: 'brute', x: 0, y: 0, hp: 1e9, maxHp: 1e9, spd: 0, r: 21, dmg: 50, xp: 1, col: '#fff', charge: 0, hitT: 0, slow: 0, orbT: 0, fireT: 0, wob: 0 });
  step(G, 1 / 60, { x: 0, y: 0 });
  assert.equal(G.over, false);
  assert.equal(G.revives, 0);
  assert.equal(G.p.hp, Math.ceil(G.p.maxHp / 2));
  assert.ok(G.p.shield > 0);
});

test('the Nova needs a full charge and resets it', () => {
  const G = newRun();
  G.super = SUPER_FULL - 1;
  useSuper(G);
  assert.equal(G.novas.length, 0);
  G.super = SUPER_FULL;
  useSuper(G);
  assert.equal(G.super, 0);
  assert.equal(G.novas.length, 1);
});

test('level-up offers four choices and falls back to treats', () => {
  const G = newRun();
  const first = rollChoices(G, 4);
  assert.equal(first.length, 4);
  assert.equal(new Set(first).size, 4, 'no duplicates while upgrades remain');

  for (const id of Object.keys(UPGRADES)) {
    if (UPGRADES[id].kind !== 'treat') while (levelOf(G, id) < UPGRADES[id].max) applyUpgrade(G, id);
  }
  assert.deepEqual(rollChoices(G, 4), ['soup', 'jar', 'soup', 'jar']);
});

test('every weapon works at every level', () => {
  for (const id of WEAPON_IDS) {
    for (let lvl = 1; lvl <= UPGRADES[id].max; lvl++) {
      const G = newRun();
      G.weapons = { [id]: lvl };
      play(G, 20, circle);
      assert.ok(G.kills > 0 || G.over, `${id} level ${lvl} killed something`);
    }
  }
});

test('passives apply their effect', () => {
  const G = newRun();
  const before = { ...G.stats, maxHp: G.p.maxHp };
  for (const id of ['boots', 'heart', 'magnet', 'glass', 'whet', 'moss']) applyUpgrade(G, id);
  assert.ok(G.stats.speedMul > before.speedMul);
  assert.equal(G.p.maxHp, before.maxHp + 25);
  assert.ok(G.stats.magnet > before.magnet);
  assert.ok(G.stats.cd < before.cd);
  assert.ok(G.stats.dmg > before.dmg);
  assert.ok(G.stats.regen > 0);
});
