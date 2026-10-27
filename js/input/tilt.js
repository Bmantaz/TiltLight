// Accelerometer readings from the Oplà, turned into an analog movement vector.
import { settings, DEAD_ZONE, fullTilt } from './settings.js';

const STALE_MS = 600;   // readings older than this count as "no board"
const SMOOTHING = 0.5;

const tilt = { x: 0, y: 0, cx: 0, cy: 0, has: false, last: 0 };

export const hasTilt = () => tilt.has;
export const tiltLive = () => tilt.has && performance.now() - tilt.last < STALE_MS;

export function feedTilt(x, y){
  if (!tilt.has) { tilt.x = tilt.cx = x; tilt.y = tilt.cy = y; tilt.has = true; }
  tilt.x += (x - tilt.x) * SMOOTHING;
  tilt.y += (y - tilt.y) * SMOOTHING;
  tilt.last = performance.now();
}

export function loseTilt(){ tilt.has = false; }

/** Make the current pose the "standing still" pose. */
export function calibrate(){
  if (tilt.has) { tilt.cx = tilt.x; tilt.cy = tilt.y; }
}

export function tiltVector(){
  if (!tiltLive()) return { x: 0, y: 0 };
  let dx = tilt.x - tilt.cx, dy = tilt.y - tilt.cy;
  if (settings.swap) [dx, dy] = [dy, dx];
  if (settings.invertX) dx = -dx;
  if (settings.invertY) dy = -dy;
  const m = Math.hypot(dx, dy);
  if (m < DEAD_ZONE) return { x: 0, y: 0 };
  const k = Math.min(1, (m - DEAD_ZONE) / (fullTilt() - DEAD_ZONE)) / m;
  return { x: dx * k, y: dy * k };
}
