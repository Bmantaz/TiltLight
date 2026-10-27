export const $ = sel => document.querySelector(sel);

/** Create an element. `color` sets the --c custom property the stylesheets use for accents. */
export function create(tag, { className, color, html, title, label, onClick } = {}){
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (color) el.style.setProperty('--c', color);
  if (html) el.innerHTML = html;
  if (title) el.title = title;
  if (label) el.setAttribute('aria-label', label);
  if (onClick) el.addEventListener('click', onClick);
  return el;
}

/** Show a message in a `.status` line. tone: '' | 'ok' | 'err' */
export function setStatus(el, text, tone = ''){
  el.textContent = text;
  el.className = tone ? `status ${tone}` : 'status';
}
