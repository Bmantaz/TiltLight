// In-run HUD: XP, HP, time, kills, Nova charge and the loadout icons.
import { $, create } from '../core/dom.js';
import { fmtTime } from '../core/math.js';
import { SUPER_FULL } from '../config/balance.js';
import { UPGRADES } from '../config/upgrades.js';

const el = {
  xp: $('#xpfill'), lvl: $('#lvl'), hp: $('#hpfill'), hpText: $('#hptxt'), time: $('#time'),
  kills: $('#kills'), charge: $('#sfill'), superBox: $('#superbox'), superText: $('#stxt'), loadout: $('#loadout'),
};

export function renderHud(G){
  const p = G.p, ready = G.super >= SUPER_FULL;
  el.xp.style.width = (G.xp / G.xpNext * 100) + '%';
  el.lvl.textContent = 'Lv ' + G.level;
  el.hp.style.width = Math.max(0, p.hp / p.maxHp * 100) + '%';
  el.hpText.textContent = `${Math.max(0, Math.ceil(p.hp))} / ${p.maxHp}`;
  el.time.textContent = fmtTime(Math.floor(G.t));
  el.kills.textContent = G.kills + ' banished';
  el.charge.style.width = G.super / SUPER_FULL * 100 + '%';
  el.superBox.classList.toggle('ready', ready);
  el.superText.textContent = ready ? 'Nova ready' : 'Lantern Nova';
}

export function renderLoadout(G){
  const owned = [...Object.entries(G.weapons), ...Object.entries(G.passives)];
  el.loadout.replaceChildren(...owned.map(([id, level]) => {
    const u = UPGRADES[id];
    return create('div', { className: 'ico', color: u.col, title: u.name, html: `${u.ico}<i>${level}</i>` });
  }));
}
