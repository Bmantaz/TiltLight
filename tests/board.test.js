import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseLine } from '../js/hardware/board.js';

test('parses tilt readings', () => {
  assert.deepEqual(parseLine('A,0.125,-0.5'), { type: 'tilt', x: 0.125, y: -0.5 });
});

test('parses touch pads 0-4', () => {
  for (let n = 0; n <= 4; n++) assert.deepEqual(parseLine(`B,${n}`), { type: 'pad', n });
});

test('parses pad releases', () => {
  assert.deepEqual(parseLine('E,3'), { type: 'release', n: 3 });
});

test('ignores malformed or unknown lines', () => {
  for (const line of ['A,1', 'A,x,1', 'A,1,NaN', 'B,5', 'B,-1', 'B,', 'E,9', 'Z,1,2', '', 'hello']) {
    assert.equal(parseLine(line), null, line);
  }
});
