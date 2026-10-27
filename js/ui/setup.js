// Title-screen controller setup: connect button, status line, options, calibration and the pad map.
import { $, create, setStatus } from '../core/dom.js';
import { padLabel, padPosition } from '../config/controls.js';
import { connect, serialSupported } from '../hardware/serial.js';
import { board } from '../hardware/board.js';
import { settings, saveSettings } from '../input/settings.js';
import { calibrate } from '../input/tilt.js';

const PAD_FLASH_MS = 350;

/** Pad map: a dot per pad, laid out like the board, that lights up when that pad is touched. */
const padDots = [0, 1, 2, 3, 4].map(n => create('span', { html: padLabel(n) }));
$('#padmap').replaceChildren(...padDots);

export function flashPad(n){
  const dot = padDots[n];
  dot.classList.add('on');
  clearTimeout(dot.timer);
  dot.timer = setTimeout(() => dot.classList.remove('on'), PAD_FLASH_MS);
}

/** Arrange the pad map and level-up cards for how the board is held, and turn its screen to match. */
function applyOrientation(){
  document.documentElement.classList.toggle('upside-down', settings.upsideDown);
  padDots.forEach((dot, n) => { dot.dataset.pos = padPosition(n, settings.upsideDown); });
  board.orient(settings.upsideDown);
}

/** [input, settings key, how to read it, what else to do when it changes] */
const OPTIONS = [
  ['#invX', 'invertX', 'checked'],
  ['#invY', 'invertY', 'checked'],
  ['#swap', 'swap', 'checked'],
  ['#upside', 'upsideDown', 'checked', applyOrientation],
  ['#sens', 'sensSlider', 'valueAsNumber'],
];

function initOptions(){
  for (const [sel, key, prop, onChange] of OPTIONS) {
    const input = $(sel);
    input[prop] = settings[key];
    input.addEventListener('input', () => { settings[key] = input[prop]; saveSettings(); onChange?.(); });
  }
  $('#btnCal').onclick = calibrate;
  applyOrientation();
}

/** onLine(text) for each line from the board; onConnect/onDisconnect when the link changes. */
function initConnect({ onLine, onConnect, onDisconnect }){
  const btn = $('#btnConnect'), status = $('#status');
  const setConnected = on => {
    btn.disabled = on;
    btn.textContent = on ? 'Connected' : 'Connect Oplà';
    document.documentElement.classList.toggle('has-board', on);   // swaps keyboard hints for pad hints
  };

  btn.onclick = async () => {
    if (!serialSupported()) return setStatus(status, 'This browser can’t talk to USB devices. Open the game in Chrome or Edge.', 'err');
    try {
      await connect({
        onLine,
        onClose: () => {
          setConnected(false);
          setStatus(status, 'Oplà disconnected. Plug it back in and connect again.', 'err');
          onDisconnect();
        },
      });
    } catch (e) {
      if (e.name === 'NotFoundError') setStatus(status, 'No port chosen. Plug in the Oplà and try again.', 'err');
      else setStatus(status, `Couldn’t open the port: ${e.message} Close the Arduino Serial Monitor if it’s open.`, 'err');
      return;
    }
    setConnected(true);
    setStatus(status, 'Oplà connected. Tilt it and watch the dot.', 'ok');
    onConnect();
  };
}

export function initSetup(handlers){
  initOptions();
  initConnect(handlers);
}
