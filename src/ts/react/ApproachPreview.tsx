import { useEffect, useRef } from "react";
import { drawArrow } from "../draw";
import { arToMs } from "../settings";
import { clamp } from "../utils";
import type { Note } from "../game";

// 4:3 canvas that matches the game's logical aspect ratio; CSS scales it down
const PREVIEW_W = 400;
const PREVIEW_H = 300;

// Static arrow at canvas centre, pointing right — only the fill animation changes
const PREVIEW_NOTE: Note = {
  kind:      "click",
  time:      0,
  x:         PREVIEW_W / 2,
  y:         PREVIEW_H / 2,
  direction: 0,
  state:     "pending",
};

interface Props {
  ar: number;
}

export function ApproachPreview({ ar }: Props) {
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  // Ref keeps the rAF loop reading the latest AR without restarting the loop
  const arRef        = useRef(ar);
  // Setting this to null inside an effect causes the next frame to reset the cycle start
  const startTimeRef = useRef<number | null>(null);

  // Always current — written during render, read only inside rAF (safe pattern)
  arRef.current = ar;

  // Reset the animation cycle whenever AR changes so the new speed is immediately visible
  useEffect(() => {
    startTimeRef.current = null;
  }, [ar]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let rafId: number;

    const loop = (timestamp: number): void => {
      if (startTimeRef.current === null) startTimeRef.current = timestamp;

      const ms           = arToMs(arRef.current);
      // Cycle = fill duration + 400ms pause so the completed arrow is briefly visible
      const cycleDuration = ms + 400;
      const elapsed       = (timestamp - startTimeRef.current) % cycleDuration;
      const appearProgress = clamp(elapsed / ms, 0, 1);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      // scale=1: the preview canvas uses logical coords directly; CSS handles display size
      drawArrow(ctx, PREVIEW_NOTE, appearProgress, 1);

      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, []); // mount/unmount only — AR is read via arRef

  return (
    <canvas
      ref={canvasRef}
      className="approach-preview"
      width={PREVIEW_W}
      height={PREVIEW_H}
    />
  );
}
