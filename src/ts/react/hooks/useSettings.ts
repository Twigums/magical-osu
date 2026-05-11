import { useState, useEffect } from "react";
import {
  loadAr, saveAr, subscribeAr,
  loadVolume, saveVolume, subscribeVolume,
  loadHitsoundVolume, saveHitsoundVolume, subscribeHitsoundVolume,
} from "../../settings";

function useNumericSetting(
  load: () => number,
  save: (v: number) => void,
  subscribe: (cb: (v: number) => void) => () => void,
): [number, (v: number) => void] {
  const [value, setValue] = useState(load);
  useEffect(() => subscribe(setValue), [subscribe]);
  return [value, save];
}

export function useApproachRate(): [number, (ar: number) => void] {
  return useNumericSetting(loadAr, saveAr, subscribeAr);
}

export function useVolume(): [number, (v: number) => void] {
  return useNumericSetting(loadVolume, saveVolume, subscribeVolume);
}

export function useHitsoundVolume(): [number, (v: number) => void] {
  return useNumericSetting(loadHitsoundVolume, saveHitsoundVolume, subscribeHitsoundVolume);
}