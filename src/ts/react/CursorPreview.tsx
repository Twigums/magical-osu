import { useEffect, useRef } from "react";
import { drawCursorOrb, drawCursorParticle } from "../draw";
import { trailFadeToLifetimeMs } from "../settings";

const PREVIEW_W = 400;
const PREVIEW_H = 300;

const MAX_PARTICLES  = 64;
const SPAWN_INTERVAL = 8;

interface Particle {
  x: number;
  y: number;
  bornAt: number;
  alive: boolean;
}

interface Props {
  r: number;
  g: number;
  b: number;
  cursorSize: number;
  trailFadeSpeed: number;
}

export function CursorPreview({ r, g, b, cursorSize, trailFadeSpeed }: Props) {
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const rRef         = useRef(r);
  const gRef         = useRef(g);
  const bRef         = useRef(b);
  const sizeRef      = useRef(cursorSize);
  const fadeRef      = useRef(trailFadeSpeed);

  rRef.current    = r;
  gRef.current    = g;
  bRef.current    = b;
  sizeRef.current = cursorSize;
  fadeRef.current = trailFadeSpeed;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Hot-path ring buffer; slot mutation intentional for GC pressure
    const particles: Particle[] = Array.from({ length: MAX_PARTICLES }, () => ({
      x: 0, y: 0, bornAt: 0, alive: false,
    }));
    let nextSlot    = 0;
    let lastSpawnAt = 0;
    let rafId: number;

    const loop = (now: number): void => {
      // Lissajous path: infinity symbol
      const cx = PREVIEW_W / 2;
      const cy = PREVIEW_H / 2;
      const t  = now * 0.0008;
      const x  = cx + PREVIEW_W * 0.33 * Math.sin(t);
      const y  = cy + PREVIEW_H * 0.28 * Math.sin(2 * t + Math.PI / 2);

      if (now - lastSpawnAt >= SPAWN_INTERVAL) {
        particles[nextSlot] = { x, y, bornAt: now, alive: true };
        nextSlot = (nextSlot + 1) % MAX_PARTICLES;
        lastSpawnAt = now;
      }

      ctx.clearRect(0, 0, PREVIEW_W, PREVIEW_H);

      const rgb      = `${rRef.current}, ${gRef.current}, ${bRef.current}`;
      const lifetime = trailFadeToLifetimeMs(fadeRef.current);
      const orbR     = sizeRef.current;

      ctx.save();
      for (let i = 0; i < MAX_PARTICLES; i++) {
        const p = particles[i];
        if (!p.alive) continue;
        const age = now - p.bornAt;
        if (age >= lifetime) { p.alive = false; continue; }
        const ta    = age / lifetime;
        const alpha = (1 - ta) * (1 - ta);
        drawCursorParticle(ctx, p.x, p.y, orbR * 0.45 * (1 - ta * 0.5), alpha, rgb);
      }
      drawCursorOrb(ctx, x, y, orbR, rgb);
      ctx.restore();

      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="cursor-preview"
      width={PREVIEW_W}
      height={PREVIEW_H}
    />
  );
}
