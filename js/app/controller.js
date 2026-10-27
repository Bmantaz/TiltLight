// Game flow: which mode we're in, how to move between modes, and what each input does in each mode.
//
//   title  → play       start the night
//   play  ⇄ levelup     XP bar fills up / a card is picked
//   play  ⇄ paused      P or Esc, window loses focus, board unplugged
//   play   → over       the light goes out
//   over   → play       walk again
//   over   → title      back to camp
import { PAD, UPGRADE_PADS, HOLD_MS } from '../config/controls.js';
import { UPGRADES } from '../config/upgrades.js';
import { board, parseLine, syncRun, syncTick } from '../hardware/board.js';
import { feedTilt, loseTilt, calibrate } from '../input/tilt.js';
import { settings } from '../input/settings.js';
import { moveVector } from '../input/movement.js';
import { newRun } from '../game/run.js';
import { step } from '../game/world.js';
import { useSuper } from '../game/combat.js';
import { rollChoices, applyUpgrade } from '../game/upgrades.js';
import { settleRun } from '../game/progression.js';
import { showMode, showResults } from '../ui/screens.js';
import { renderLoadout } from '../ui/hud.js';
import { renderCards, markChosen, showHold } from '../ui/levelup.js';
import { flashPad } from '../ui/setup.js';
import { renderCamp, moveCampSelection, buySelected } from '../ui/camp.js';

// Short pause before a new screen accepts input, so a press meant for the
// previous screen doesn't pick a card or skip the results by accident.
const LOCK_LEVELUP_MS = 450;
const LOCK_GAMEOVER_MS = 900;
const PICK_FLASH_MS = 280;   // how long the picked card lights up before the game continues

/** Read-only outside this module. `run` is null at camp. */
export const game = { run: null, mode: 'title' };

let inputLock = 0;
let choices = [];
let picking = false;   // a card was chosen and is flashing
let hold = null;       // { pad, timer } while a pad is held on the level-up screen

const unlocked = () => performance.now() >= inputLock;
const lockInput = ms => { inputLock = performance.now() + ms; };

function setMode(mode){
  game.mode = mode;
  showMode(mode);
  if (mode === 'title') renderCamp();
}

/* ---------------- transitions ---------------- */

export function startRun(){
  game.run = newRun();
  calibrate();
  setMode('play');
  renderLoadout(game.run);
  syncRun(game.run);
}

export function startOrResume(){
  if (game.mode === 'paused') togglePause();
  else startRun();
}

export function togglePause(){
  if (game.mode === 'play') setMode('paused');
  else if (game.mode === 'paused') { calibrate(); setMode('play'); }
}

export function toCamp(){
  game.run = null;
  setMode('title');
}

function openLevelUp(){
  const G = game.run;
  G.pendingLv--;
  cancelHold();
  choices = rollChoices(G, UPGRADE_PADS.length);
  renderCards(G, choices, choose);
  setMode('levelup');
  lockInput(LOCK_LEVELUP_MS);
  board.levelUp(choices.map(id => UPGRADES[id].col));
}

/** A pad touched on the level-up screen picks its card only after HOLD_MS. */
function startHold(pad){
  const i = UPGRADE_PADS.indexOf(pad);
  if (i < 0 || picking) return;
  cancelHold();
  showHold(i, HOLD_MS);
  hold = { pad, timer: setTimeout(() => { hold = null; choose(i); }, HOLD_MS) };
}

function cancelHold(){
  if (!hold) return;
  clearTimeout(hold.timer);
  hold = null;
  showHold(-1);
}

function choose(i){
  const id = choices[i];
  if (game.mode !== 'levelup' || !id || picking || !unlocked()) return;
  cancelHold();
  picking = true;
  markChosen(i);
  board.picked();
  setTimeout(() => {
    picking = false;
    const G = game.run;
    applyUpgrade(G, id);
    renderLoadout(G);
    if (G.pendingLv > 0) openLevelUp();
    else setMode('play');
  }, PICK_FLASH_MS);
}

function endRun(){
  const G = game.run, time = Math.floor(G.t);
  const result = settleRun({ time, level: G.level, kills: G.kills });
  showResults({ time, level: G.level, kills: G.kills, ...result });
  setMode('over');
  lockInput(LOCK_GAMEOVER_MS);
  board.stats(G);
  board.gameOver();
}

/** Advance the simulation by dt seconds (only while playing). */
export function tick(dt){
  const G = game.run;
  if (!G || game.mode !== 'play') return;
  step(G, dt, moveVector());
  if (G.over) return endRun();
  syncTick(G, dt);
  if (G.pendingLv > 0) { board.stats(G); openLevelUp(); }
}

/* ---------------- input ---------------- */

function onPad(n){
  if (game.mode === 'title' || game.mode === 'paused') flashPad(n);
  if (!unlocked()) return;
  switch (game.mode) {
    case 'levelup':
      startHold(n);
      break;
    case 'play':
      if (n === PAD.main) useSuper(game.run);
      break;
    case 'title':
      if (n === PAD.main) startRun();
      else if (n === PAD.prev) moveCampSelection(-1);
      else if (n === PAD.next) moveCampSelection(1);
      else if (n === PAD.buy) buySelected();
      break;
    case 'paused':
      if (n === PAD.main) togglePause();
      break;
    case 'over':
      if (n === PAD.main) startRun();
      else toCamp();
      break;
  }
}

export function onKey(e){
  const { mode } = game, code = e.code;
  if (mode === 'levelup' && /^Digit\d$/.test(code)) choose(+code.slice(5) - 1);
  else if (code === 'Space' && mode === 'play') useSuper(game.run);
  else if (code === 'Enter') {
    if (e.target.tagName === 'BUTTON') return;   // let the focused button handle its own Enter
    if (mode === 'title' || mode === 'paused') startOrResume();
    else if (mode === 'over' && unlocked()) startRun();
  }
  else if (code === 'KeyC') calibrate();
  else if ((code === 'KeyP' || code === 'Escape') && (mode === 'play' || mode === 'paused')) togglePause();
  else if (code === 'Escape' && mode === 'over' && unlocked()) toCamp();
}

export function onFocusLost(){
  if (game.mode === 'play') togglePause();
}

/* ---------------- board ---------------- */

export function onBoardLine(line){
  const msg = parseLine(line);
  if (msg?.type === 'tilt') feedTilt(msg.x, msg.y);
  else if (msg?.type === 'pad') onPad(msg.n);
  else if (msg?.type === 'release' && hold?.pad === msg.n) cancelHold();
}

export function onBoardConnect(){
  board.orient(settings.upsideDown);
  if (game.run) syncRun(game.run);
}

/** Pause instead of letting the player walk blind into the dark. */
export function onBoardDisconnect(){
  loseTilt();
  if (game.mode === 'play') togglePause();
}
