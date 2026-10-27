// Size of the full-screen game canvas in CSS pixels.
// Touches the DOM only in initView(), so the simulation can import this in Node tests.

export const view = { w: 0, h: 0 };

/** Size the canvas to the window (and keep it sized). Returns its 2D context. */
export function initView(canvas){
  const ctx = canvas.getContext('2d');
  const resize = () => {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    view.w = innerWidth; view.h = innerHeight;
    canvas.width = view.w * dpr; canvas.height = view.h * dpr;
    canvas.style.width = view.w + 'px'; canvas.style.height = view.h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  addEventListener('resize', resize);
  resize();
  return ctx;
}

/** Distance from the centre of the screen to just past its corners. */
export const offscreen = (pad = 0) => Math.hypot(view.w, view.h) / 2 + pad;

/** Is `o` inside the screen centred on `center`? */
export const onScreen = (o, center, pad = 10) =>
  Math.abs(o.x - center.x) < view.w / 2 + pad && Math.abs(o.y - center.y) < view.h / 2 + pad;
