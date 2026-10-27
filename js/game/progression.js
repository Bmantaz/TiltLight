// Embers, camp ranks and records that carry over between runs, saved in localStorage.
import { CAMP, PERK_IDS, costOf } from '../config/camp.js';
import { loadJSON, saveJSON } from '../core/storage.js';
import { fmtTime } from '../core/math.js';

const SAVE_KEY = 'tiltlight-save';
const SAVE_VERSION = 1;

/** Records shown at camp. `best` picks the value from a finished run; runs is counted separately. */
export const RECORDS = [
  { key: 'bestTime',  label: 'longest night', format: fmtTime, best: run => run.time },
  { key: 'bestLevel', label: 'highest level', best: run => run.level },
  { key: 'mostKills', label: 'most banished', best: run => run.kills },
  { key: 'runs',      label: 'nights walked' },
];

function blankSave(){
  return { v: SAVE_VERSION, embers: 0, camp: {}, records: { bestTime: 0, bestLevel: 0, mostKills: 0, totalKills: 0, runs: 0, totalEmbers: 0 } };
}

/** Copy only known, non-negative whole numbers from untrusted data (old saves, imported files). */
function sanitize(src){
  const d = blankSave();
  const num = v => (typeof v === 'number' && isFinite(v) && v >= 0) ? Math.floor(v) : 0;
  d.embers = num(src.embers);
  for (const id of PERK_IDS) d.camp[id] = Math.min(CAMP[id].max, num(src.camp?.[id]));
  for (const k in d.records) d.records[k] = num(src.records?.[k]);
  return d;
}

export const isSave = raw => !!raw && raw.v === SAVE_VERSION;

function loadSave(){
  const raw = loadJSON(SAVE_KEY, null);
  return isSave(raw) ? sanitize(raw) : blankSave();
}

let save = loadSave();
const persist = () => saveJSON(SAVE_KEY, save);

export const embers = () => save.embers;
export const records = () => save.records;
export const rank = id => save.camp[id] || 0;

/** Total bonus from a camp perk at its current rank. */
export const perkBonus = id => rank(id) * CAMP[id].step;

/** Try to buy the next rank. Returns { status: 'bought' | 'maxed' | 'poor', rank, cost }. */
export function buyPerk(id){
  const r = rank(id), cost = costOf(id, r);
  if (r >= CAMP[id].max) return { status: 'maxed', rank: r, cost };
  if (save.embers < cost) return { status: 'poor', rank: r, cost };
  save.embers -= cost;
  save.camp[id] = r + 1;
  persist();
  return { status: 'bought', rank: r + 1, cost };
}

/** Bank a finished run: award embers and update records. */
export function settleRun(run){
  const r = save.records;
  const earned = Math.floor((run.kills * 0.5 + run.time * 0.5 + run.level * 5) * (1 + perkBonus('fortune')));
  const newRecords = [];
  for (const rec of RECORDS) {
    if (rec.best && rec.best(run) > r[rec.key]) { r[rec.key] = rec.best(run); newRecords.push(rec.label); }
  }
  r.totalKills += run.kills; r.runs++; r.totalEmbers += earned;
  save.embers += earned;
  persist();
  return { earned, newRecords, firstRun: r.runs === 1 };
}

export const exportSave = () => JSON.stringify(save, null, 2);

export function importSave(raw){
  if (!isSave(raw)) throw new Error('not a Tiltlight save');
  save = sanitize(raw);
  persist();
}

export function resetSave(){
  save = blankSave();
  persist();
}
