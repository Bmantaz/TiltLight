import { view } from '../js/core/view.js';

/** Replace Math.random with a repeatable sequence. Returns a function that restores it. */
export function seedRandom(seed = 1){
  const original = Math.random;
  let s = seed >>> 0;
  Math.random = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  return () => { Math.random = original; };
}

/** The simulation needs a screen size for spawn distances and the Nova radius. */
export function setScreen(w = 1280, h = 800){
  view.w = w; view.h = h;
}
