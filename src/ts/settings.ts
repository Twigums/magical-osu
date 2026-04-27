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

function createNumericSetting(key: string, event: string, clamp: (n: number) => number, def: number) {
  return {
    load: () => loadNumericSetting(key, clamp, def),
    save: (v: number) => saveNumericSetting(key, event, clamp, v),
    subscribe: (cb: (n: number) => void) => subscribeNumericSetting(event, cb),
  };
}

export const AR_MIN     = 1;
export const AR_MAX     = 20;
export const AR_DEFAULT = 12;

// 2000 ms at AR 1 → ~300 ms at AR 20
export function arToMs(ar: number): number {
  return 2000 - (ar - 1) * (1700 / 19);
}

function clampAr(n: number): number {
  return Math.max(AR_MIN, Math.min(AR_MAX, Math.round(n)));
}

const arSetting = createNumericSetting("approachRate", "approachRateChange", clampAr, AR_DEFAULT);
export const loadAr        = arSetting.load;
export const saveAr        = arSetting.save;
export const subscribeAr   = arSetting.subscribe;

export const VOLUME_MIN     = 0;
export const VOLUME_MAX     = 100;
export const VOLUME_DEFAULT = 100;
export const VOLUME_STEP    = 1;

function clampVolume(n: number): number {
  return Math.max(VOLUME_MIN, Math.min(VOLUME_MAX, Math.round(n)));
}

export function volToFactor(v: number): number { return clampVolume(v) / VOLUME_MAX; }

const volSetting = createNumericSetting("songVolume", "songVolumeChange", clampVolume, VOLUME_DEFAULT);
export const loadVolume      = volSetting.load;
export const saveVolume      = volSetting.save;
export const subscribeVolume = volSetting.subscribe;

const hitsoundSetting = createNumericSetting("hitsoundVolume", "hitsoundVolumeChange", clampVolume, VOLUME_DEFAULT);
export const loadHitsoundVolume      = hitsoundSetting.load;
export const saveHitsoundVolume      = hitsoundSetting.save;
export const subscribeHitsoundVolume = hitsoundSetting.subscribe;
