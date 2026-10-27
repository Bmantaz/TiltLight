// Tilt and keyboard combined into one movement vector (length 0..1).
import { tiltVector, tiltLive } from './tilt.js';
import { keyVector } from './keyboard.js';

export function moveVector(){
  const tv = tiltVector(), kv = keyVector();
  let x = tv.x + kv.x, y = tv.y + kv.y;
  const m = Math.hypot(x, y);
  if (m > 1) { x /= m; y /= m; }
  return { x, y };
}

/** What the tilt dial shows: the board when it's live, otherwise the keyboard. */
export const dialVector = () => tiltLive() ? tiltVector() : keyVector();
