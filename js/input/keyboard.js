// Held keys for movement, plus a hook for one-off key presses.

const held = new Set();
const NO_SCROLL = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space']);

const down = (...codes) => codes.some(c => held.has(c));

export function keyVector(){
  const x = down('KeyD', 'ArrowRight') - down('KeyA', 'ArrowLeft');
  const y = down('KeyS', 'ArrowDown') - down('KeyW', 'ArrowUp');
  const m = Math.hypot(x, y) || 1;
  return { x: x / m, y: y / m };
}

/**
 * onPress(event) fires once per key press (not on auto-repeat).
 * onBlur() fires when the window loses focus.
 */
export function initKeyboard({ onPress, onBlur }){
  addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT') return;
    held.add(e.code);
    if (NO_SCROLL.has(e.code)) e.preventDefault();
    if (!e.repeat) onPress(e);
  });
  addEventListener('keyup', e => held.delete(e.code));
  addEventListener('blur', () => { held.clear(); onBlur(); });
}
