// Draws one frame: camera, world, darkness and screen flashes.
import { COLORS } from '../config/palette.js';
import { jitter } from '../core/math.js';
import { view } from '../core/view.js';
import { drawGround } from './ground.js';
import { drawRun, drawPlayer, drawDamageNumbers } from './entities.js';
import { drawTiltDial } from './dial.js';

/** On the title screen a lone lantern-bearer wanders across the moor. */
const wanderer = t => ({ x: t * 22, y: Math.sin(t * .2) * 60, fx: 1, fy: 0, r: 13, inv: 0, shield: 0 });

export function drawScene(c, G, mode, now){
  const t = now / 1000, { w, h } = view;
  c.fillStyle = COLORS.ground; c.fillRect(0, 0, w, h);

  const p = G ? G.p : wanderer(t);
  const shake = G?.shake || 0;
  const camX = p.x - w / 2 + jitter(shake), camY = p.y - h / 2 + jitter(shake);

  c.save();
  c.translate(-camX, -camY);
  drawGround(c, camX, camY, t);
  if (G) drawRun(c, G, t);
  const lantern = drawPlayer(c, p, t);
  if (G) drawDamageNumbers(c, G.texts);
  c.restore();

  drawDarkness(c, w / 2 + lantern.x - p.x, h / 2 + lantern.y - p.y);
  if (G) drawFlashes(c, G);
  if (G && mode !== 'title') drawTiltDial(c, 52, h - 60, 30);
}

/** The world is only lit around the lantern. */
function drawDarkness(c, x, y){
  const { w, h } = view;
  const g = c.createRadialGradient(x, y, 90, x, y, Math.max(w, h) * 0.62);
  g.addColorStop(0, 'rgba(4,8,10,0)'); g.addColorStop(0.55, 'rgba(4,8,10,.45)'); g.addColorStop(1, 'rgba(4,8,10,.92)');
  c.fillStyle = g; c.fillRect(0, 0, w, h);
}

function drawFlashes(c, G){
  const { w, h } = view;
  if (G.hurtFlash > 0) { c.fillStyle = `rgba(255,40,70,${G.hurtFlash * .35})`; c.fillRect(0, 0, w, h); }
  if (G.novaFlash > 0) { c.fillStyle = `rgba(255,236,190,${G.novaFlash * .45})`; c.fillRect(0, 0, w, h); }
}
