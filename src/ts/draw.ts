import type { Note } from "./game";

// Shared between hit detection in game.ts and rendering here
export const NOTE_RADIUS = 42;

// appearProgress: 0 = faint outline just appearing, 1 = fully filled at hit time
// scale: canvas pixels per logical unit (canvas.width / LOGICAL_W)
export function drawArrow(
  ctx: CanvasRenderingContext2D,
  note: Note,
  appearProgress: number,
  scale: number,
): void {
  const cx = note.x * scale;
  const cy = note.y * scale;
  const r  = NOTE_RADIUS * scale;

  const base     = note.kind === "click" ? "255, 82, 82"  : "82, 162, 255";
  const darkBase = note.kind === "click" ? "191, 62, 62"  : "62, 122, 191";

  const len     = r;         // total arrow length
  const headLen = r * 0.4;  // arrowhead length
  const hw      = r * 0.4;  // arrowhead half-width (flare)
  const shw     = r * 0.17; // shaft half-width

  const cosA = Math.cos(note.direction);
  const sinA = Math.sin(note.direction);

  // Rotate local (lx, ly) into canvas space around (cx, cy)
  const tx = (lx: number, ly: number): number => cx + cosA * lx - sinA * ly;
  const ty = (lx: number, ly: number): number => cy + sinA * lx + cosA * ly;

  const x0 = -len / 2;           // tail
  const x1 =  len / 2 - headLen; // shaft/head junction
  const x2 =  len / 2;           // tip

  const buildPath = (): void => {
    ctx.beginPath();
    ctx.moveTo(tx(x2,    0), ty(x2,    0));   // tip
    ctx.lineTo(tx(x1,  -hw), ty(x1,  -hw));   // head top shoulder
    ctx.lineTo(tx(x1, -shw), ty(x1, -shw));   // shaft top (step in)
    ctx.lineTo(tx(x0, -shw), ty(x0, -shw));   // tail top
    ctx.lineTo(tx(x0,  shw), ty(x0,  shw));   // tail bottom
    ctx.lineTo(tx(x1,  shw), ty(x1,  shw));   // shaft bottom (step out)
    ctx.lineTo(tx(x1,   hw), ty(x1,   hw));   // head bottom shoulder
    ctx.closePath();
  };

  // Outline snaps to full opacity quickly; fill grows from center after FILL_START
  const OUTLINE_SNAP = 0.12;
  const FILL_START   = 0.62;
  const outlineAlpha = Math.min(appearProgress / OUTLINE_SNAP, 1);
  const fillProgress = Math.max(0, (appearProgress - FILL_START) / (1 - FILL_START));

  ctx.save();

  // Radial fill clipped to arrow shape
  buildPath();
  ctx.save();
  ctx.clip();
  const fillMaxR = Math.sqrt((len / 2) ** 2 + shw ** 2);
  ctx.beginPath();
  ctx.arc(cx, cy, fillProgress * fillMaxR, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(${base}, 1.0)`;
  ctx.fill();
  ctx.restore();

  buildPath();
  ctx.strokeStyle = `rgba(${darkBase}, ${0.9 * outlineAlpha})`;
  ctx.lineWidth = 2.5 * scale;
  ctx.lineJoin  = "miter";
  ctx.stroke();

  ctx.restore();
}