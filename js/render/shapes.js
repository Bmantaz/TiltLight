// Small canvas helpers shared by the renderers.
import { TAU } from '../core/math.js';

export function fillCircle(c, x, y, r){
  c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
}

export function strokeCircle(c, x, y, r){
  c.beginPath(); c.arc(x, y, r, 0, TAU); c.stroke();
}

/** Two dots mirrored around (x, y), e.g. a pair of eyes. */
export function fillPair(c, x, y, ox, oy, r){
  c.beginPath(); c.arc(x + ox, y + oy, r, 0, TAU); c.arc(x - ox, y - oy, r, 0, TAU); c.fill();
}

/** Flat ellipse under something standing on the ground. */
export function shadow(c, x, y, rx, ry, alpha){
  c.fillStyle = `rgba(0,0,0,${alpha})`;
  c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, TAU); c.fill();
}

/** Soft radial light: `inner` at the centre fading to `outer` at radius r. */
export function glow(c, x, y, r, inner, outer){
  const g = c.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, inner); g.addColorStop(1, outer);
  c.fillStyle = g;
  fillCircle(c, x, y, r);
}
