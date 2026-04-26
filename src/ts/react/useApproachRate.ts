import { useState, useEffect } from "react";
import { loadAr, saveAr, subscribeAr } from "../settings";

/** Returns [currentAr, setAr]. Setting AR persists to localStorage and notifies all subscribers. */
export function useApproachRate(): [number, (ar: number) => void] {
  const [ar, setArState] = useState(loadAr);

  useEffect(() => subscribeAr(setArState), []);

  return [ar, saveAr];
}
