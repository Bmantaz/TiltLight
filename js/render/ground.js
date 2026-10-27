// Endless moor: scenery is scattered by hashing grid cells, so it's the same every time you pass by.
import { hash2 } from '../core/math.js';
import { view } from '../core/view.js';
import { COLORS } from '../config/palette.js';
import { fillCircle } from './shapes.js';

const TILE = 64;

export function drawGround(c, camX, camY, t){
  const x0 = Math.floor(camX / TILE) - 1, y0 = Math.floor(camY / TILE) - 1;
  const x1 = Math.floor((camX + view.w) / TILE) + 1, y1 = Math.floor((camY + view.h) / TILE) + 1;
  for (let ix = x0; ix <= x1; ix++) for (let iy = y0; iy <= y1; iy++) {
    const h = hash2(ix, iy);
    if (h >= 0.22) continue;   // most tiles are bare
    const x = ix * TILE + hash2(ix + 9, iy) * 40 + 12, y = iy * TILE + hash2(ix, iy + 9) * 40 + 12;
    if (h < 0.035) drawStone(c, x, y);
    else if (h < 0.05) drawMushroom(c, x, y, 0.5 + 0.5 * Math.sin(t * 2 + ix * 3 + iy));
    else drawHeather(c, x, y, h < 0.1 ? '#2a2638' : '#1b2a28');
  }
}

function drawStone(c, x, y){
  c.fillStyle = '#1e2b30';
  c.beginPath(); c.moveTo(x - 7, y + 10); c.lineTo(x - 7, y - 4); c.arc(x, y - 4, 7, Math.PI, 0); c.lineTo(x + 7, y + 10); c.fill();
  c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(x - 9, y + 9, 18, 3);
}

function drawMushroom(c, x, y, pulse){
  c.fillStyle = `rgba(143,227,224,${0.08 + 0.1 * pulse})`; fillCircle(c, x, y, 10);
  c.fillStyle = COLORS.frost; fillCircle(c, x, y, 2.4);
}

function drawHeather(c, x, y, col){
  c.strokeStyle = col; c.lineWidth = 1.5;
  c.beginPath();
  c.moveTo(x - 4, y + 4); c.lineTo(x - 6, y - 3);
  c.moveTo(x, y + 4); c.lineTo(x, y - 5);
  c.moveTo(x + 4, y + 4); c.lineTo(x + 6, y - 3);
  c.stroke();
}
