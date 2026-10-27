// Core numbers that shape a run. Per-upgrade and per-enemy numbers live in their own config files.

export const PLAYER = { r: 13, hp: 100, speed: 155, magnet: 70 };

export const SUPER_FULL = 100;      // Lantern Nova charge needed to fire
export const WAVE_EVERY = 60;       // seconds between elite waves
export const MAX_DT = 0.05;         // longest simulated step, so a hitch can't teleport anything

export const NOVA = { speed: 950, knock: 70, damage: level => 160 + level * 12 };

export const xpFor = level => Math.floor(6 + level * 4 + level * level * 0.35);

/** Caps that keep a long run from slowing the browser down. */
export const LIMITS = { enemies: 360, gems: 350, particles: 400, texts: 60, fires: 90 };
