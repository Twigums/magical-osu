import { useEffect, useRef, useState } from "react";

type TransitionState = "entering" | "entered" | "exiting" | "exited";

export function useTransitionState<T>(
  value: T,
  durationMs: number
): { current: T; state: TransitionState } {
  const currentRef = useRef<T>(value);
  const [current, setCurrent] = useState<T>(value);
  const [state, setState] = useState<TransitionState>(value ? "entered" : "exited");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (value === currentRef.current) return;

    if (timerRef.current !== null) { clearTimeout(timerRef.current); timerRef.current = null; }
    if (rafRef.current !== null) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }

    const prev = currentRef.current;
    currentRef.current = value;

    const enterNew = () => {
      setCurrent(value);
      setState("entering");
      // double rAF ensures browser paints the entering position before transitioning
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = requestAnimationFrame(() => setState("entered"));
      });
    };

    if (!prev && value) {
      enterNew();
    } else if (prev && !value) {
      setState("exiting");
      timerRef.current = setTimeout(() => {
        setCurrent(value);
        setState("exited");
      }, durationMs);
    } else {
      setState("exiting");
      timerRef.current = setTimeout(enterNew, durationMs);
    }

    return () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [value, durationMs]); // eslint-disable-line react-hooks/exhaustive-deps

  return { current, state };
}
