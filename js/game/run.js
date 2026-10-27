// A fresh run, with camp perks applied. The run object (often called G) holds the whole simulation state.
import { PLAYER, WAVE_EVERY, xpFor } from '../config/balance.js';
import { perkBonus } from './progression.js';

export function newRun(){
  const hp = PLAYER.hp + perkBonus('vigor');
  return {
    t: 0, kills: 0, level: 1, xp: 0, xpNext: xpFor(1), pendingLv: 0,
    super: perkBonus('kindling'), revives: perkBonus('second'), over: false,
    p: { x: 0, y: 0, r: PLAYER.r, hp, maxHp: hp, speed: PLAYER.speed, inv: 0, shield: 0, fx: 1, fy: 0 },
    stats: {
      dmg: 1 + perkBonus('might'),
      cd: 1 - perkBonus('haste'),
      magnet: PLAYER.magnet * (1 + perkBonus('reach')),
      speedMul: 1 + perkBonus('stride'),
      regen: 0,
    },
    weapons: { spark: 1 }, passives: {}, timers: {}, orbA: 0, moved: 0,
    enemies: [], bullets: [], gems: [], fires: [], bolts: [], novas: [], parts: [], texts: [],
    spawnAcc: 0, nextWave: WAVE_EVERY, shake: 0, hurtFlash: 0, novaFlash: 0,
    lastCharge: -1, statT: 0,
  };
}
