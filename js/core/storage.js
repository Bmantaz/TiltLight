// localStorage can throw (private mode, quota, blocked cookies), so every access is guarded.

export function loadJSON(key, fallback){
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch { return fallback; }
}

export function saveJSON(key, value){
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}
