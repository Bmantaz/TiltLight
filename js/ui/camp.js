// Camp panel: spend embers on perks, view records, export/import/reset the save.
import { $, create, setStatus } from '../core/dom.js';
import { CAMP, PERK_IDS, costOf } from '../config/camp.js';
import { board } from '../hardware/board.js';
import { embers, records, rank, buyPerk, RECORDS, exportSave, importSave, isSave, resetSave } from '../game/progression.js';

const el = { embers: $('#embers'), perks: $('#perks'), records: $('#records'), status: $('#saveStatus'), file: $('#fileImport') };
let selected = 0;

const say = (text, tone) => setStatus(el.status, text, tone);

/** focus: move keyboard focus to the selected perk (after a mouse/keyboard purchase). */
export function renderCamp(focus = false){
  el.embers.textContent = embers();
  el.perks.replaceChildren(...PERK_IDS.map((id, i) => perkButton(id, i)));
  if (focus) el.perks.children[selected].focus();
  el.records.innerHTML = RECORDS.map(rec => {
    const v = records()[rec.key];
    return `<div><strong>${rec.format ? rec.format(v) : v}</strong><span>${rec.label}</span></div>`;
  }).join('');
}

function perkButton(id, i){
  const c = CAMP[id], r = rank(id), maxed = r >= c.max, cost = costOf(id, r);
  const state = maxed ? ' maxed' : embers() < cost ? ' poor' : '';
  return create('button', {
    className: 'perk' + (i === selected ? ' sel' : '') + state,
    color: c.col,
    html: `<span class="pico">${c.ico}</span><span class="pname">${c.name}<span class="pips">${'●'.repeat(r)}${'○'.repeat(c.max - r)}</span></span>`
      + `<span class="pcost">${maxed ? 'Maxed' : '✹ ' + cost}</span><span class="pdesc">${c.desc}</span>`,
    label: `${c.name}, rank ${r} of ${c.max}. ${c.desc}. ${maxed ? 'Maxed.' : `Costs ${cost} embers.`}`,
    onClick: () => { selected = i; buy(id, true); },
  });
}

function buy(id, focus = false){
  const name = CAMP[id].name, res = buyPerk(id);
  if (res.status === 'maxed') say(`${name} is already maxed.`);
  else if (res.status === 'poor') say(`${name} costs ${res.cost} embers. You have ${embers()}.`, 'err');
  else { say(`${name} is now rank ${res.rank}.`, 'ok'); board.picked(); }
  renderCamp(focus);
}

/** Oplà pads 00/04 move the selection, 01 buys. */
export function moveCampSelection(d){
  selected = (selected + d + PERK_IDS.length) % PERK_IDS.length;
  renderCamp();
}
export const buySelected = () => buy(PERK_IDS[selected]);

function download(name, text){
  const a = create('a');
  a.href = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

export function initCamp(){
  $('#btnExport').onclick = () => {
    download('tiltlight-save.json', exportSave());
    say('Exported tiltlight-save.json.', 'ok');
  };
  $('#btnImport').onclick = () => el.file.click();
  el.file.onchange = async () => {
    const f = el.file.files[0];
    el.file.value = '';
    if (!f) return;
    let raw;
    try { raw = JSON.parse(await f.text()); } catch {}
    if (!isSave(raw)) return say('That file isn’t a Tiltlight save.', 'err');
    if (!confirm('Replace your current progress with this save?')) return;
    importSave(raw);
    renderCamp();
    say('Save imported.', 'ok');
  };
  $('#btnReset').onclick = () => {
    if (!confirm('Erase all embers, camp upgrades and records?')) return;
    resetSave();
    renderCamp();
    say('Progress reset.', 'ok');
  };
  renderCamp();
}
