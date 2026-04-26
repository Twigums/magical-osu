function loadNumericSetting(key: string, clamp: (n: number) => number, def: number): number {
  const raw = localStorage.getItem(key);
  if (raw === null) return def;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? clamp(parsed) : def;
}

function saveNumericSetting(key: string, event: string, clamp: (n: number) => number, value: number): void {
  const clamped = clamp(value);
  localStorage.setItem(key, String(clamped));
  window.dispatchEvent(new CustomEvent<number>(event, { detail: clamped }));
}

function subscribeNumericSetting(event: string, cb: (n: number) => void): () => void {
  const handler = (e: Event) => cb((e as CustomEvent<number>).detail);
  window.addEventListener(event, handler);
  return () => window.removeEventListener(event, handler);
}

export const AR_MIN     = 1;
export const AR_MAX     = 20;
export const AR_DEFAULT = 12;

const AR_STORAGE_KEY  = "approachRate";
const AR_CHANGE_EVENT = "approachRateChange";

// 2000 ms at AR 1 → ~300 ms at AR 20
export function arToMs(ar: number): number {
  return 2000 - (ar - 1) * (1700 / 19);
}

export function clampAr(n: number): number {
  return Math.max(AR_MIN, Math.min(AR_MAX, Math.round(n)));
}

export function loadAr():                              number      { return loadNumericSetting(AR_STORAGE_KEY, clampAr, AR_DEFAULT); }
export function saveAr(ar: number):                    void        { saveNumericSetting(AR_STORAGE_KEY, AR_CHANGE_EVENT, clampAr, ar); }
export function subscribeAr(cb: (ar: number) => void): () => void  { return subscribeNumericSetting(AR_CHANGE_EVENT, cb); }

// 0 = muted, 100 = full volume
export const VOLUME_MIN     = 0;
export const VOLUME_MAX     = 100;
export const VOLUME_DEFAULT = 100;
export const VOLUME_STEP    = 1;

const VOLUME_STORAGE_KEY  = "songVolume";
const VOLUME_CHANGE_EVENT = "songVolumeChange";

export function clampVolume(n: number): number {
  return Math.max(VOLUME_MIN, Math.min(VOLUME_MAX, Math.round(n)));
}

export function loadVolume():                              number      { return loadNumericSetting(VOLUME_STORAGE_KEY, clampVolume, VOLUME_DEFAULT); }
export function saveVolume(v: number):                     void        { saveNumericSetting(VOLUME_STORAGE_KEY, VOLUME_CHANGE_EVENT, clampVolume, v); }
export function subscribeVolume(cb: (v: number) => void):  () => void  { return subscribeNumericSetting(VOLUME_CHANGE_EVENT, cb); }
