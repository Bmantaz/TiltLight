// Which overlay is showing for each game mode, plus the game-over summary.
import { $ } from '../core/dom.js';
import { fmtTime } from '../core/math.js';

const el = {
  title: $('#title'), levelup: $('#levelup'), over: $('#over'), hud: $('#hud'), play: $('#btnPlay'),
  time: $('#oTime'), level: $('#oLvl'), kills: $('#oKills'), earn: $('#oEarn'), note: $('#oRec'),
};

/** mode: 'title' | 'play' | 'levelup' | 'paused' | 'over'. The title screen doubles as the pause screen. */
export function showMode(mode){
  const paused = mode === 'paused';
  el.title.classList.toggle('show', mode === 'title' || paused);
  el.title.classList.toggle('paused', paused);
  el.play.textContent = paused ? 'Keep walking' : 'Start the night';
  el.levelup.classList.toggle('show', mode === 'levelup');
  el.over.classList.toggle('show', mode === 'over');
  el.hud.classList.toggle('show', mode !== 'title');
}

export function showResults({ time, level, kills, earned, newRecords, firstRun }){
  el.time.textContent = fmtTime(time);
  el.level.textContent = level;
  el.kills.textContent = kills;
  el.earn.textContent = `+${earned} embers`;
  el.note.textContent = firstRun ? 'Spend your embers at camp to grow stronger.'
    : newRecords.length ? 'New record: ' + newRecords.join(', ') : '';
}
