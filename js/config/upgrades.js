// Level-up choices.
//   weapon   levels 1-6, numbers per level in WEAPON_STATS, behaviour in game/weapons.js
//   passive  stacks up to `max`, effect in game/upgrades.js
//   treat    one-off, fills the hand when there aren't enough other choices
// `info` is the card text: one string per level for weapons, one string for everything else.

export const UPGRADES = {
  spark:  { kind: 'weapon', name: 'Spark Bolt',    ico: '✦', col: '#ffd84d', max: 6, info: ['Fires bolts at the nearest foe', '+1 bolt', '+40% damage', '+1 bolt, pierces 2 foes', '+35% damage, fires faster', '+1 bolt, pierces 3, fires faster'] },
  orbit:  { kind: 'weapon', name: 'Lantern Orbit', ico: '◉', col: '#ff9a3d', max: 6, info: ['Little lanterns circle you and burn foes', '+1 lantern', '+45% damage, wider circle', '+1 lantern', '+40% damage, wider circle', '+1 lantern, +25% damage'] },
  frost:  { kind: 'weapon', name: 'Frost Ring',    ico: '❄', col: '#8fe3e0', max: 6, info: ['Chills and slows foes near you', 'Wider ring', '+20% damage, wider ring', '+30% damage, wider ring', '+25% damage, wider ring', 'Huge ring, +30% damage'] },
  thunder:{ kind: 'weapon', name: 'Storm Call',    ico: 'ϟ', col: '#b98cff', max: 6, info: ['Lightning strikes random foes', '+1 strike, faster', '+35% damage', '+1 strike, faster', '+1 strike, +25% damage', '+1 strike, +25% damage, much faster'] },
  ember:  { kind: 'weapon', name: 'Ember Trail',   ico: '♨', col: '#ff6a3d', max: 6, info: ['Your footsteps leave burning embers', 'Hotter, lasts longer', 'Hotter, bigger embers', 'Lasts longer', 'Hotter, bigger embers', 'An inferno follows you'] },
  boots:  { kind: 'passive', name: 'Swift Boots',  ico: '»', col: '#7dffa8', max: 5, info: '+12% move speed' },
  heart:  { kind: 'passive', name: 'Vital Heart',  ico: '♥', col: '#ff5470', max: 5, info: '+25 max HP and heal 25' },
  magnet: { kind: 'passive', name: 'Moon Magnet',  ico: '☾', col: '#6fd0ff', max: 5, info: '+40% pickup range' },
  glass:  { kind: 'passive', name: 'Hourglass',    ico: '⧗', col: '#e0c3ff', max: 5, info: '−8% weapon cooldowns' },
  whet:   { kind: 'passive', name: 'Whetstone',    ico: '◆', col: '#d6dcff', max: 5, info: '+15% damage' },
  moss:   { kind: 'passive', name: 'Healing Moss', ico: '✿', col: '#b4ff6b', max: 5, info: '+0.6 HP per second' },
  soup:   { kind: 'treat', name: 'Warm Soup',      ico: '☕', col: '#ffc59a', max: 99, info: 'Heal 40 HP' },
  jar:    { kind: 'treat', name: 'Spark Jar',      ico: '✧', col: '#ffb547', max: 99, info: '+40% Lantern Nova charge' },
};

// Per-level weapon numbers (index 0 = level 1).
//   n count   d damage   cd cooldown (s)   p pierce   r radius   life seconds on the ground
export const WEAPON_STATS = {
  spark:  [{ n: 1, d: 10, cd: .95, p: 1 }, { n: 2, d: 10, cd: .9, p: 1 }, { n: 2, d: 14, cd: .85, p: 1 }, { n: 3, d: 14, cd: .8, p: 2 }, { n: 3, d: 19, cd: .7, p: 2 }, { n: 4, d: 24, cd: .6, p: 3 }],
  orbit:  [{ n: 1, d: 9, r: 68 }, { n: 2, d: 9, r: 72 }, { n: 2, d: 13, r: 78 }, { n: 3, d: 13, r: 84 }, { n: 3, d: 18, r: 92 }, { n: 4, d: 23, r: 100 }],
  frost:  [{ r: 72, d: 4 }, { r: 86, d: 5 }, { r: 98, d: 6 }, { r: 112, d: 8 }, { r: 124, d: 10 }, { r: 142, d: 13 }],
  thunder:[{ n: 1, d: 28, cd: 2.4 }, { n: 2, d: 28, cd: 2.2 }, { n: 2, d: 38, cd: 2 }, { n: 3, d: 38, cd: 1.8 }, { n: 4, d: 48, cd: 1.6 }, { n: 5, d: 60, cd: 1.3 }],
  ember:  [{ d: 5, life: 1.4, r: 16 }, { d: 6, life: 1.8, r: 18 }, { d: 8, life: 2, r: 20 }, { d: 9, life: 2.4, r: 22 }, { d: 11, life: 2.8, r: 25 }, { d: 14, life: 3.2, r: 28 }],
};

export const WEAPON_IDS = Object.keys(WEAPON_STATS);
