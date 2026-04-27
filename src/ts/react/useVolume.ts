import { loadVolume, saveVolume, subscribeVolume } from "../settings";
import { useNumericSetting } from "./useSetting";

export function useVolume(): [number, (v: number) => void] {
  return useNumericSetting(loadVolume, saveVolume, subscribeVolume);
}
