// Player's controller preferences, remembered per browser.
import { loadJSON, saveJSON } from '../core/storage.js';

const KEY = 'tiltlight-settings';

export const settings = Object.assign(
  { invertX: false, invertY: false, swap: false, sensSlider: 0.5, upsideDown: false },
  loadJSON(KEY, {}),
);

export const saveSettings = () => saveJSON(KEY, settings);

/** Tilt (in g) that is ignored around the calibrated rest pose. */
export const DEAD_ZONE = 0.05;

/** Tilt (in g) that gives full speed; the sensitivity slider moves it. */
export const fullTilt = () => 0.55 - settings.sensSlider * 0.4;
