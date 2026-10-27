// The tilt dial: shows the dead zone and where the stick is. Drawn in the HUD and on the title screen.
import { COLORS } from '../config/palette.js';
import { DEAD_ZONE, fullTilt } from '../input/settings.js';
import { hasTilt, tiltLive } from '../input/tilt.js';
import { dialVector } from '../input/movement.js';
import { fillCircle, strokeCircle } from './shapes.js';

export function drawTiltDial(c, x, y, r){
  c.fillStyle = 'rgba(0,0,0,.5)'; fillCircle(c, x, y, r);
  c.strokeStyle = COLORS.moss; c.lineWidth = 1.5; c.stroke();
  strokeCircle(c, x, y, r * (DEAD_ZONE / fullTilt()));
  const v = dialVector();
  c.fillStyle = tiltLive() ? COLORS.amber : COLORS.muted;
  fillCircle(c, x + v.x * (r - 7), y + v.y * (r - 7), 6);
}

const preview = document.querySelector('#prev'), pctx = preview.getContext('2d');

/** Live preview on the title screen (a 240 px canvas shown at 120 px). */
export function drawPreview(){
  pctx.setTransform(2, 0, 0, 2, 0, 0);
  pctx.clearRect(0, 0, 120, 120);
  drawTiltDial(pctx, 60, 60, 54);
  if (!hasTilt()) {
    pctx.fillStyle = COLORS.muted; pctx.font = '600 11px Chivo, sans-serif'; pctx.textAlign = 'center';
    pctx.fillText('no Oplà yet', 60, 100);
  }
}
