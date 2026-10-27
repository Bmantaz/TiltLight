// Level-up screen, laid out like the Oplà: cards on the pads around a copy of its round screen.
import { $, create } from '../core/dom.js';
import { UPGRADES } from '../config/upgrades.js';
import { UPGRADE_PADS, PAD, padLabel, padPosition } from '../config/controls.js';
import { SUPER_FULL } from '../config/balance.js';
import { settings } from '../input/settings.js';
import { describe } from '../game/upgrades.js';

const board = $('#cards');
const cards = () => board.querySelectorAll('.card');

export function renderCards(G, choices, onChoose){
  board.classList.remove('picked', 'holding');
  board.replaceChildren(
    boardScreen(G),
    ...choices.map((id, i) => card(G, id, i, onChoose)),
    novaPad(G),
  );
}

/** Show card i filling up over `ms` while its pad is held; i = -1 clears it. */
export function showHold(i, ms = 0){
  board.classList.toggle('holding', i >= 0);
  cards().forEach((el, n) => {
    el.classList.toggle('holding', n === i);
    if (n === i) el.style.setProperty('--hold', ms + 'ms');
  });
}

/** Flash the picked card and dim the rest. */
export function markChosen(i){
  board.classList.remove('holding');
  board.classList.add('picked');
  cards()[i]?.classList.add('chosen');
}

function card(G, id, i, onChoose){
  const u = UPGRADES[id], { desc, tag, level, max } = describe(G, id), pad = UPGRADE_PADS[i];
  const pips = Array.from({ length: max }, (_, n) => `<i class="${n < level ? 'on' : n === level ? 'next' : ''}"></i>`).join('');
  const el = create('button', {
    className: 'card', color: u.col, onClick: () => onChoose(i),
    label: `Pad ${padLabel(pad)}: ${u.name}, ${tag}. ${desc}`,
    html: `<span class="pad"><span class="slot">${padLabel(pad)}</span><span class="big">${u.ico}</span><span class="key">key ${i + 1}</span></span>`
      + `<b>${u.name}</b><small>${tag}</small>${max ? `<span class="lvls">${pips}</span>` : ''}<p>${desc}</p><span class="hold"></span>`,
  });
  el.dataset.pos = padPosition(pad, settings.upsideDown);
  return el;
}

/** Same information the board's own screen shows while you choose. */
function boardScreen(G){
  const p = G.p, hp = Math.max(0, Math.ceil(p.hp));
  return create('div', {
    className: 'opla-screen',
    html: `<small>LEVEL UP!</small><strong>${G.level}</strong>`
      + `<span class="hp"><i style="width:${hp / p.maxHp * 100}%"></i></span><span>${hp}/${p.maxHp}</span>`,
  });
}

function novaPad(G){
  return create('div', {
    className: 'opla-nova',
    html: `<b>${padLabel(PAD.main)}</b>Nova ${Math.floor(G.super / SUPER_FULL * 100)}%`,
  });
}
