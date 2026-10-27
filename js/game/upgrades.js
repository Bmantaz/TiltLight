// Rolling level-up choices and applying the one the player picks.
import { UPGRADES } from '../config/upgrades.js';
import { shuffle } from '../core/math.js';
import { board } from '../hardware/board.js';
import { heal, addCharge } from './combat.js';

const TREAT_FILL = ['soup', 'jar', 'soup', 'jar'];

const EFFECTS = {
  boots:  G => { G.stats.speedMul += 0.12; },
  heart:  G => { G.p.maxHp += 25; heal(G, 25); },
  magnet: G => { G.stats.magnet *= 1.4; },
  glass:  G => { G.stats.cd *= 0.92; },
  whet:   G => { G.stats.dmg += 0.15; },
  moss:   G => { G.stats.regen += 0.6; },
  soup:   G => heal(G, 40),
  jar:    G => addCharge(G, 40),
};

export function levelOf(G, id){
  const { kind } = UPGRADES[id];
  if (kind === 'weapon') return G.weapons[id] || 0;
  if (kind === 'passive') return G.passives[id] || 0;
  return 0;
}

/** `count` random upgrades that can still level up, topped up with treats. */
export function rollChoices(G, count){
  const pool = Object.keys(UPGRADES).filter(id => UPGRADES[id].kind !== 'treat' && levelOf(G, id) < UPGRADES[id].max);
  const out = shuffle(pool).slice(0, count);
  for (const id of TREAT_FILL) if (out.length < count) out.push(id);
  return out;
}

/** Card text for an upgrade at the player's current level. `max` is 0 for treats (no levels). */
export function describe(G, id){
  const u = UPGRADES[id], cur = levelOf(G, id), treat = u.kind === 'treat';
  return {
    desc: Array.isArray(u.info) ? u.info[cur] : u.info,
    tag: treat ? 'Treat' : cur === 0 ? 'New' : `Level ${cur + 1}`,
    level: cur,
    max: treat ? 0 : u.max,
  };
}

export function applyUpgrade(G, id){
  const { kind } = UPGRADES[id];
  if (kind === 'weapon') { G.weapons[id] = levelOf(G, id) + 1; return; }
  if (kind === 'passive') G.passives[id] = levelOf(G, id) + 1;
  EFFECTS[id](G);
  board.stats(G);
}
