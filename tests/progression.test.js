// Node has no localStorage, so progression runs on an in-memory save here (storage.js swallows the error).
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { CAMP, PERK_IDS, costOf } from '../js/config/camp.js';
import {
  resetSave, importSave, isSave, embers, rank, perkBonus, buyPerk, settleRun, records, exportSave,
} from '../js/game/progression.js';

beforeEach(resetSave);

test('a fresh save is empty', () => {
  assert.equal(embers(), 0);
  for (const id of PERK_IDS) assert.equal(rank(id), 0);
});

test('settling a run awards embers and sets records', () => {
  const res = settleRun({ time: 100, level: 5, kills: 40 });
  assert.equal(res.earned, Math.floor(40 * 0.5 + 100 * 0.5 + 5 * 5));
  assert.equal(res.firstRun, true);
  assert.deepEqual(res.newRecords, ['longest night', 'highest level', 'most banished']);
  assert.equal(embers(), res.earned);
  assert.equal(records().runs, 1);

  const second = settleRun({ time: 50, level: 6, kills: 10 });
  assert.equal(second.firstRun, false);
  assert.deepEqual(second.newRecords, ['highest level']);
  assert.equal(records().bestTime, 100);
  assert.equal(records().totalKills, 50);
});

test('buying a perk spends embers until maxed', () => {
  importSave({ v: 1, embers: 10_000, camp: {}, records: {} });
  let spent = 0;
  for (let r = 0; r < CAMP.second.max; r++) {
    assert.equal(buyPerk('second').status, 'bought');
    spent += costOf('second', r);
  }
  assert.equal(buyPerk('second').status, 'maxed');
  assert.equal(embers(), 10_000 - spent);
  assert.equal(perkBonus('second'), CAMP.second.step * CAMP.second.max);
});

test('cannot buy without enough embers', () => {
  const res = buyPerk('vigor');
  assert.equal(res.status, 'poor');
  assert.equal(res.cost, costOf('vigor', 0));
  assert.equal(rank('vigor'), 0);
});

test('fortune boosts embers earned', () => {
  importSave({ v: 1, embers: 0, camp: { fortune: 2 }, records: {} });
  assert.equal(settleRun({ time: 100, level: 1, kills: 0 }).earned, Math.floor(55 * 1.2));
});

test('imported saves are sanitised', () => {
  importSave({ v: 1, embers: -5.5, camp: { vigor: 99, might: 'lots', bogus: 3 }, records: { runs: 2.7, bestTime: Infinity } });
  const saved = JSON.parse(exportSave());
  assert.equal(saved.embers, 0);
  assert.equal(saved.camp.vigor, CAMP.vigor.max);
  assert.equal(saved.camp.might, 0);
  assert.equal('bogus' in saved.camp, false);
  assert.equal(saved.records.runs, 2);
  assert.equal(saved.records.bestTime, 0);
});

test('rejects files that are not saves', () => {
  for (const raw of [null, {}, { v: 2 }, 'save', 1]) {
    assert.equal(isSave(raw), false);
    assert.throws(() => importSave(raw));
  }
});
