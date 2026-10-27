// The Tiltlight serial protocol: every message the game and the Oplà exchange.
// Keep in sync with the "Serial protocol" table in README.md and the sketch header in firmware/.
import { send } from './serial.js';

const PAD_EVENTS = { B: 'pad', E: 'release' };

/** Parse a line from the Oplà: `A,<ax>,<ay>` tilt, `B,<n>` pad touched or `E,<n>` pad released. */
export function parseLine(line){
  const p = line.split(',');
  if (p[0] === 'A' && p.length >= 3) {
    const x = parseFloat(p[1]), y = parseFloat(p[2]);
    return isFinite(x) && isFinite(y) ? { type: 'tilt', x, y } : null;
  }
  if (p[0] in PAD_EVENTS) {
    const n = parseInt(p[1], 10);
    return n >= 0 && n <= 4 ? { type: PAD_EVENTS[p[0]], n } : null;
  }
  return null;
}

/** Messages to the Oplà. */
export const board = {
  reset:    () => send('R'),
  hit:      () => send('H'),
  levelUp:  colors => send('U,' + colors.map(c => c.slice(1)).join(',')),
  picked:   () => send('C'),
  charge:   pct => send('S,' + pct),
  nova:     () => send('N'),
  gameOver: () => send('G'),
  orient:   upsideDown => send('O,' + (upsideDown ? 1 : 0)),
  stats:    G => send(`D,${Math.max(0, Math.ceil(G.p.hp))},${G.p.maxHp},${G.level},${Math.floor(G.t)}`),
};

/** Bring the board up to date with a run, e.g. on start or after (re)connecting mid-run. */
export function syncRun(G){
  board.reset();
  board.stats(G);
  G.lastCharge = -1;
}

/** Per-frame updates: Nova charge in steps of 5 when it changes, stats once a second. */
export function syncTick(G, dt){
  const charge = Math.floor(G.super / 5) * 5;
  if (charge !== G.lastCharge) { G.lastCharge = charge; board.charge(charge); }
  G.statT -= dt;
  if (G.statT <= 0) { G.statT = 1; board.stats(G); }
}
