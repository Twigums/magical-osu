import { loadAr, saveAr, subscribeAr } from "../settings";
import { useNumericSetting } from "./useSetting";

export function useApproachRate(): [number, (ar: number) => void] {
  return useNumericSetting(loadAr, saveAr, subscribeAr);
}
