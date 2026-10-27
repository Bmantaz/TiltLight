// Enemy types. hp scales up over the night (see game/spawn.js).
//   charge  Nova charge per kill        knock  how far hits push it (1 = full)
//   shape   'ghost' or 'orb'            burst  particles when it dies
//   bob     hover height in px          boss   gets an outline + health bar and is never recycled

export const ENEMIES = {
  wisp:  { hp: 8,   spd: 98, r: 9,  dmg: 8,  xp: 1,  col: '#7fd8e0', charge: 1,  shape: 'ghost', bob: 2.5, eye: '#ffffff', knock: 1,   burst: 7 },
  shade: { hp: 18,  spd: 72, r: 13, dmg: 12, xp: 2,  col: '#9a6cff', charge: 1,  shape: 'ghost', bob: 1,   eye: '#ffffff', knock: 1,   burst: 7 },
  brute: { hp: 62,  spd: 48, r: 21, dmg: 20, xp: 5,  col: '#ff6b7f', charge: 3,  shape: 'orb',   bob: 1,   eye: '#ffe08a', knock: 1,   burst: 7 },
  elite: { hp: 420, spd: 60, r: 32, dmg: 30, xp: 30, col: '#ffb547', charge: 25, shape: 'orb',   bob: 1,   eye: '#ffe08a', knock: 0.2, burst: 30, boss: true },
};
