// Everything that lives in the world: effects, pickups, enemies, projectiles and the player.
// Called with the camera transform already applied, so all coordinates are world coordinates.
import { ENEMIES } from '../config/enemies.js';
import { COLORS } from '../config/palette.js';
import { TAU } from '../core/math.js';
import { weaponStats, orbitPositions } from '../game/weapons.js';
import { fillCircle, strokeCircle, fillPair, shadow, glow } from './shapes.js';

const GEM_TIERS = [[20, '#ffb547'], [5, '#ff6b7f'], [2, '#b4ff6b'], [0, COLORS.frost]];

/** Draw a run's world, back to front. The player is drawn separately (it also appears on the title screen). */
export function drawRun(c, G, t){
  const p = G.p;

  c.globalCompositeOperation = 'lighter';
  for (const f of G.fires) glow(c, f.x, f.y, f.r * 1.4, `rgba(255,170,60,${0.55 * f.life / f.max})`, 'rgba(255,60,30,0)');
  c.globalCompositeOperation = 'source-over';

  if (G.weapons.frost) drawFrostRing(c, p, weaponStats(G, 'frost').r, t);
  for (const g of G.gems) drawGem(c, g);
  for (const e of G.enemies) drawEnemy(c, e, p);

  c.globalCompositeOperation = 'lighter';
  c.lineCap = 'round';
  for (const b of G.bullets) drawBullet(c, b);
  if (G.weapons.orbit) for (const o of orbitPositions(G)) drawOrbitLantern(c, o.x, o.y);
  for (const b of G.bolts) drawBolt(c, b);
  for (const n of G.novas) drawNova(c, n);
  for (const q of G.parts) { c.globalAlpha = q.life / q.max; c.fillStyle = q.col; fillCircle(c, q.x, q.y, q.r); }
  c.globalAlpha = 1;
  c.globalCompositeOperation = 'source-over';
}

function drawFrostRing(c, p, r, t){
  c.fillStyle = 'rgba(143,227,224,.06)'; fillCircle(c, p.x, p.y, r);
  c.strokeStyle = 'rgba(143,227,224,.35)'; c.lineWidth = 1.5;
  c.setLineDash([4, 8]); c.lineDashOffset = -t * 20;
  strokeCircle(c, p.x, p.y, r);
  c.setLineDash([]);
}

function drawGem(c, g){
  const s = g.v >= 5 ? 7 : 5;
  c.fillStyle = GEM_TIERS.find(([min]) => g.v >= min)[1];
  c.beginPath(); c.moveTo(g.x, g.y - s); c.lineTo(g.x + s * .7, g.y); c.lineTo(g.x, g.y + s); c.lineTo(g.x - s * .7, g.y); c.fill();
}

function drawEnemy(c, e, p){
  const T = ENEMIES[e.type], r = e.r;
  shadow(c, e.x, e.y + r * .85, r * .8, r * .28, .35);
  const y = e.y + Math.sin(e.wob) * T.bob;

  c.fillStyle = e.hitT > 0 ? '#ffffff' : e.col;
  c.beginPath();
  if (T.shape === 'ghost') ghostPath(c, e.x, y, r, e.wob);
  else c.arc(e.x, y, r, 0, TAU);
  c.fill();
  if (T.boss) { c.strokeStyle = '#fff3c4'; c.lineWidth = 2; c.stroke(); }

  // eyes follow the player
  const dx = p.x - e.x, dy = p.y - e.y, d = Math.hypot(dx, dy) || 1, ux = dx / d, uy = dy / d;
  const ex = ux * r * .3, ey = uy * r * .3 - r * .15, sx = -uy * r * .32, sy = ux * r * .32;
  c.fillStyle = COLORS.night; fillPair(c, e.x + ex, y + ey, sx, sy, r * .2);
  c.fillStyle = T.eye; fillPair(c, e.x + ex * 1.3, y + ey, sx, sy, r * .08);

  if (e.slow > 0) { c.strokeStyle = 'rgba(143,227,224,.7)'; c.lineWidth = 1.5; strokeCircle(c, e.x, y, r + 3); }
  if (T.boss) {
    c.fillStyle = 'rgba(0,0,0,.6)'; c.fillRect(e.x - 28, y - r - 14, 56, 5);
    c.fillStyle = COLORS.amber; c.fillRect(e.x - 28, y - r - 14, 56 * Math.max(0, e.hp / e.maxHp), 5);
  }
}

/** Dome on top, ragged hem below. */
function ghostPath(c, x, y, r, wob){
  const hem = y + r * .8, n = 4, w = 2 * r / n;
  c.arc(x, y - r * .15, r, Math.PI, 0);
  c.lineTo(x + r, hem);
  for (let i = n; i > 0; i--) {
    c.lineTo(x - r + (i - .5) * w, hem - r * .35 + Math.sin(wob + i) * 1.5);
    c.lineTo(x - r + (i - 1) * w, hem);
  }
  c.closePath();
}

function drawBullet(c, b){
  c.strokeStyle = 'rgba(255,216,77,.9)'; c.lineWidth = 4;
  c.beginPath(); c.moveTo(b.x, b.y); c.lineTo(b.x - b.vx * .03, b.y - b.vy * .03); c.stroke();
  c.fillStyle = '#fff6c9'; fillCircle(c, b.x, b.y, 2.5);
}

function drawOrbitLantern(c, x, y){
  glow(c, x, y, 22, 'rgba(255,154,61,.7)', 'rgba(255,154,61,0)');
  c.fillStyle = '#ffd59a'; fillCircle(c, x, y, 6);
}

function drawBolt(c, b){
  const a = b.life / .22;
  c.beginPath(); b.pts.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y));
  c.strokeStyle = `rgba(185,140,255,${a})`; c.lineWidth = 3; c.stroke();
  c.strokeStyle = `rgba(255,255,255,${a})`; c.lineWidth = 1; c.stroke();
}

function drawNova(c, n){
  const k = 1 - n.r / n.max;
  c.strokeStyle = `rgba(255,200,90,${k})`; c.lineWidth = 6 + 18 * k;
  strokeCircle(c, n.x, n.y, n.r);
}

/** The lantern-bearer. Returns where the lantern is, since the darkness is centred on it. */
export function drawPlayer(c, p, t){
  const blink = p.inv > 0 && Math.floor(t * 20) % 2 === 0;
  if (!blink) {
    shadow(c, p.x, p.y + 12, 12, 4, .4);
    c.fillStyle = '#3b4a52';
    c.beginPath(); c.moveTo(p.x - 12, p.y + 12);
    c.quadraticCurveTo(p.x - 13, p.y - 14, p.x, p.y - 16); c.quadraticCurveTo(p.x + 13, p.y - 14, p.x + 12, p.y + 12);
    c.closePath(); c.fill();
    c.fillStyle = COLORS.night; fillCircle(c, p.x + p.fx * 3, p.y - 6 + p.fy * 2, 6);   // hood opening
    c.fillStyle = '#ffd59a'; fillPair(c, p.x + p.fx * 5, p.y - 6 + p.fy * 3, -p.fy * 2, p.fx * .5, 1.3);
  }

  const lx = p.x + p.fx * 15, ly = p.y + p.fy * 10 + 2;
  c.globalCompositeOperation = 'lighter';
  glow(c, lx, ly, 46, 'rgba(255,181,71,.55)', 'rgba(255,181,71,0)');
  c.globalCompositeOperation = 'source-over';
  c.fillStyle = '#ffe2a8'; fillCircle(c, lx, ly, 4);

  if (p.shield > 0) {
    c.strokeStyle = `rgba(255,200,90,${Math.min(1, p.shield)})`; c.lineWidth = 2;
    strokeCircle(c, p.x, p.y, 24 + Math.sin(t * 10) * 2);
  }
  return { x: lx, y: ly };
}

export function drawDamageNumbers(c, texts){
  c.font = '800 12px Chivo, system-ui, sans-serif'; c.textAlign = 'center';
  for (const tx of texts) {
    c.globalAlpha = Math.min(1, tx.life * 2.5);
    c.fillStyle = COLORS.night; c.fillText(tx.v, tx.x + 1, tx.y + 1);
    c.fillStyle = '#fff3d6'; c.fillText(tx.v, tx.x, tx.y);
  }
  c.globalAlpha = 1;
}
