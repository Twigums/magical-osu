import { loadHitsoundVolume, saveHitsoundVolume, subscribeHitsoundVolume } from "../settings";
import { useNumericSetting } from "./useSetting";

export function useHitsoundVolume(): [number, (v: number) => void] {
  return useNumericSetting(loadHitsoundVolume, saveHitsoundVolume, subscribeHitsoundVolume);
}
