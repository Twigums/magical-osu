import { useState, useEffect } from "react";

export function useNumericSetting(
  load: () => number,
  save: (v: number) => void,
  subscribe: (cb: (v: number) => void) => () => void,
): [number, (v: number) => void] {
  const [value, setValue] = useState(load);
  useEffect(() => subscribe(setValue), []);
  return [value, save];
}
