import { angleDiff, clamp } from "./utils";

const PERFECT_MS     = 32;
const GOOD_MS        = 100;
const PERFECT_POINTS = 5;
const GOOD_POINTS    = 2;

const APPROACH_MS    = 1000;

export const LOGICAL_W = 800;
export const LOGICAL_H = 600;

const NOTE_RADIUS    = 42;
const ANGULAR_MARGIN = Math.PI / 6;

export type NoteKind   = "click" | "stream";
export type HitResult  = "perfect" | "good" | "miss";
export type NoteState  = "pending" | "hit" | "missed";

export interface Note {
  kind: NoteKind;
  time: number;
  x: number;
  y: number;
  direction: number;
  state: NoteState;
  hitResult?: HitResult;
}

export interface GameHandle {
  setChart(notes: Note[]): void;
  reset(): void;
  tick(songMs: number): void;
}

export interface GameDeps {
  canvas:     HTMLCanvasElement;
  gameArea:   HTMLElement;
  onScore:    (score: number) => void;
  onFeedback: (result: HitResult, x: number, y: number) => void;
}

export function createGame(deps: GameDeps): GameHandle {
  const { canvas, gameArea, onScore, onFeedback } = deps;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2D canvas context unavailable");

  const resize = (): void => {
    const rect = gameArea.getBoundingClientRect();
    const dpr  = window.devicePixelRatio || 1;
    canvas.width  = rect.width  * dpr;
    canvas.height = rect.height * dpr;
  };
  resize();
  window.addEventListener("resize", resize);

  const getScale = (): number => canvas.width / LOGICAL_W;

  const pointer = { x: 0, y: 0, prevX: 0, prevY: 0, held: false };
  const keysHeld = new Set<string>();
  const actionHeld = (): boolean => pointer.held || keysHeld.size > 0;

  const setPointer = (clientX: number, clientY: number): void => {
    const rect = canvas.getBoundingClientRect();
    pointer.x = (clientX - rect.left) * (LOGICAL_W / rect.width);
    pointer.y = (clientY - rect.top)  * (LOGICAL_H / rect.height);
  };

  canvas.addEventListener("mousemove",  e => setPointer(e.clientX, e.clientY));
  canvas.addEventListener("mousedown",  e => { setPointer(e.clientX, e.clientY); pointer.held = true; });
  window.addEventListener("mouseup",    () => { pointer.held = false; });
  canvas.addEventListener("touchmove",  e => {
    const t = e.touches[0]; if (t) setPointer(t.clientX, t.clientY); e.preventDefault();
  }, { passive: false });
  canvas.addEventListener("touchstart", e => {
    const t = e.touches[0]; if (t) { setPointer(t.clientX, t.clientY); pointer.held = true; } e.preventDefault();
  }, { passive: false });
  window.addEventListener("touchend", () => { pointer.held = false; });
  window.addEventListener("keydown",  e => { if (!e.repeat) keysHeld.add(e.key); });
  window.addEventListener("keyup",    e => { keysHeld.delete(e.key); });

  let notes: Note[] = [];
  let score = 0;

  const setScore = (v: number): void => { score = v; onScore(v); };

  const scoreFor = (deltaMs: number): { result: HitResult; points: number } => {
    const d = Math.abs(deltaMs);
    if (d <= PERFECT_MS) return { result: "perfect", points: PERFECT_POINTS };
    if (d <= GOOD_MS)    return { result: "good",    points: GOOD_POINTS    };
    return { result: "miss", points: 0 };
  };

  const tryHit = (note: Note, songMs: number): void => {
    if (note.state !== "pending") return;
    if (!actionHeld()) return;
    if (Math.abs(songMs - note.time) > GOOD_MS) return;

    const dx = Math.cos(note.direction);
    const dy = Math.sin(note.direction);
    const pPrev = (pointer.prevX - note.x) * dx + (pointer.prevY - note.y) * dy;
    const pCurr = (pointer.x     - note.x) * dx + (pointer.y     - note.y) * dy;
    if (pPrev >= 0 || pCurr < 0) return;

    const perpPrev = -(pointer.prevX - note.x) * dy + (pointer.prevY - note.y) * dx;
    const perpCurr = -(pointer.x     - note.x) * dy + (pointer.y     - note.y) * dx;
    const t = -pPrev / (pCurr - pPrev);
    const perpAtCross = perpPrev + (perpCurr - perpPrev) * t;
    if (Math.abs(perpAtCross) > NOTE_RADIUS) return;

    const moveDx = pointer.x - pointer.prevX;
    const moveDy = pointer.y - pointer.prevY;
    if (moveDx * moveDx + moveDy * moveDy < 0.5) return;
    const moveAngle = Math.atan2(moveDy, moveDx);
    if (Math.abs(angleDiff(moveAngle, note.direction)) > ANGULAR_MARGIN) return;

    const { result, points } = scoreFor(songMs - note.time);
    note.state = "hit";
    note.hitResult = result;
    if (points > 0) setScore(score + points);
    onFeedback(result, note.x, note.y);
  };

  const expireMisses = (songMs: number): void => {
    for (const n of notes) {
      if (n.state !== "pending") continue;
      if (songMs - n.time > GOOD_MS) {
        n.state = "missed";
        n.hitResult = "miss";
        onFeedback("miss", n.x, n.y);
      }
    }
  };

  const drawNote = (note: Note, appearProgress: number, scale: number): void => {
    const cx = note.x * scale;
    const cy = note.y * scale;
    const r  = NOTE_RADIUS * scale;
    const base     = note.kind === "click" ? "255, 82, 82"  : "82, 162, 255";
    const darkBase = note.kind === "click" ? "191, 62, 62"  : "62, 122, 191";

    // arrow length
    const len     = r * 1.0;

    // head length
    const headLen = r * 0.4;

    // head half-width (flare)
    const hw      = r * 0.4;

    // shaft half-width
    const shw     = r * 0.17;

    const a       = note.direction;

    const tx = (lx: number, ly: number): number =>
      cx + Math.cos(a) * lx - Math.sin(a) * ly;
    const ty = (lx: number, ly: number): number =>
      cy + Math.sin(a) * lx + Math.cos(a) * ly;

    const x0 = -len / 2;
    const x1 =  len / 2 - headLen;
    const x2 =  len / 2;

    const buildPath = (): void => {
      ctx.beginPath();
      ctx.moveTo(tx(x2,    0), ty(x2,    0));   // 1. tip
      ctx.lineTo(tx(x1,  -hw), ty(x1,  -hw));   // 2. head shoulder top
      ctx.lineTo(tx(x1, -shw), ty(x1, -shw));   // 3. shaft top (step in)
      ctx.lineTo(tx(x0, -shw), ty(x0, -shw));   // 4. tail top corner
      ctx.lineTo(tx(x0,  shw), ty(x0,  shw));   // 5. tail bottom corner
      ctx.lineTo(tx(x1,  shw), ty(x1,  shw));   // 6. shaft bottom (step out)
      ctx.lineTo(tx(x1,   hw), ty(x1,   hw));   // 7. head shoulder bottom
      ctx.closePath();
    };

    const OUTLINE_SNAP = 0.12;
    const FILL_START   = 0.62;
    const outlineAlpha = Math.min(appearProgress / OUTLINE_SNAP, 1);
    const fillProgress = Math.max(0, (appearProgress - FILL_START) / (1 - FILL_START));

    ctx.save();

    // Fill from center outward, clipped to arrow shape
    buildPath();
    ctx.save();
    ctx.clip();
    ctx.beginPath();
    ctx.arc(cx, cy, fillProgress * len, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${base}, 1.0)`;
    ctx.fill();
    ctx.restore();

    // Outline: fast fade-in, then holds at full opacity
    buildPath();
    ctx.strokeStyle = `rgba(${darkBase}, ${0.9 * outlineAlpha})`;
    ctx.lineWidth = 2.5 * scale;
    ctx.lineJoin = "miter";
    ctx.stroke();

    ctx.restore();
  };

  const draw = (songMs: number): void => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const scale = getScale();
    for (const note of notes) {
      if (note.state !== "pending") continue;
      const dt = note.time - songMs;
      if (dt > APPROACH_MS || dt < -GOOD_MS) continue;
      const appearProgress = clamp(1 - dt / APPROACH_MS, 0, 1);
      drawNote(note, appearProgress, scale);
    }
  };

  return {
    setChart(n: Note[]): void { notes = n; },
    reset(): void {
      for (const n of notes) { n.state = "pending"; n.hitResult = undefined; }
      setScore(0);
    },
    tick(songMs: number): void {
      for (const note of notes) tryHit(note, songMs);
      expireMisses(songMs);
      draw(songMs);
      pointer.prevX = pointer.x;
      pointer.prevY = pointer.y;
    },
  };
}
