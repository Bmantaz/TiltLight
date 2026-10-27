// Entry point: wire the modules together and run the frame loop.
import { $ } from './core/dom.js';
import { initView } from './core/view.js';
import { MAX_DT } from './config/balance.js';
import { initKeyboard } from './input/keyboard.js';
import { drawScene } from './render/scene.js';
import { drawPreview } from './render/dial.js';
import { renderHud } from './ui/hud.js';
import { initCamp } from './ui/camp.js';
import { initSetup } from './ui/setup.js';
import {
  game, tick, startRun, startOrResume, toCamp,
  onKey, onFocusLost, onBoardLine, onBoardConnect, onBoardDisconnect,
} from './app/controller.js';

const ctx = initView($('#game'));
initCamp();
initSetup({ onLine: onBoardLine, onConnect: onBoardConnect, onDisconnect: onBoardDisconnect });
initKeyboard({ onPress: onKey, onBlur: onFocusLost });

$('#btnPlay').onclick = startOrResume;
$('#btnAgain').onclick = startRun;
$('#btnCamp').onclick = toCamp;

let last = performance.now();
function frame(now){
  const dt = Math.min(MAX_DT, (now - last) / 1000);
  last = now;
  tick(dt);
  drawScene(ctx, game.run, game.mode, now);
  if (game.run) renderHud(game.run);
  if (game.mode === 'title' || game.mode === 'paused') drawPreview();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
