export const AR_MIN = 1;
export const AR_MAX = 20;
export const AR_DEFAULT = 12;

const AR_STORAGE_KEY  = "approachRate";
const AR_CHANGE_EVENT = "approachRateChange";

// from 2000 ms -> 300 ms
export function arToMs(ar: number): number {
  return 2000 - (ar - 1) * (1700 / 19);
}

export function clampAr(n: number): number {
  return Math.max(AR_MIN, Math.min(AR_MAX, Math.round(n)));
}

export function loadAr(): number {
  const raw = localStorage.getItem(AR_STORAGE_KEY);
  if (raw === null) return AR_DEFAULT;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? clampAr(parsed) : AR_DEFAULT;
}

export function saveAr(ar: number): void {
  const clamped = clampAr(ar);
  localStorage.setItem(AR_STORAGE_KEY, String(clamped));
  window.dispatchEvent(new CustomEvent<number>(AR_CHANGE_EVENT, { detail: clamped }));
}

export function subscribeAr(cb: (ar: number) => void): () => void {
  const handler = (e: Event) => cb((e as CustomEvent<number>).detail);
  window.addEventListener(AR_CHANGE_EVENT, handler);
  return () => window.removeEventListener(AR_CHANGE_EVENT, handler);
}