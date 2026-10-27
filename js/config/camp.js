// Permanent upgrades bought at camp with embers.
// `step` is the bonus per rank; `base` is the price of the first rank.

export const CAMP = {
  vigor:   { name: 'Vigor',       ico: '♥', col: '#ff5470', max: 5, base: 40,  step: 10,   desc: '+10 max HP' },
  stride:  { name: 'Stride',      ico: '»', col: '#7dffa8', max: 5, base: 40,  step: 0.04, desc: '+4% move speed' },
  might:   { name: 'Might',       ico: '◆', col: '#d6dcff', max: 5, base: 50,  step: 0.05, desc: '+5% damage' },
  haste:   { name: 'Haste',       ico: '⧗', col: '#e0c3ff', max: 5, base: 50,  step: 0.03, desc: '−3% weapon cooldowns' },
  reach:   { name: 'Reach',       ico: '☾', col: '#6fd0ff', max: 4, base: 30,  step: 0.15, desc: '+15% pickup range' },
  kindling:{ name: 'Kindling',    ico: '✧', col: '#ffb547', max: 4, base: 45,  step: 15,   desc: 'Start with +15% Nova charge' },
  fortune: { name: 'Fortune',     ico: '❂', col: '#ffd84d', max: 4, base: 60,  step: 0.1,  desc: '+10% embers earned' },
  second:  { name: 'Second Wind', ico: '✚', col: '#8fe3e0', max: 1, base: 300, step: 1,    desc: 'Get back up once per night' },
};

export const PERK_IDS = Object.keys(CAMP);

export const costOf = (id, rank) => Math.round(CAMP[id].base * (1 + rank * 0.75));
