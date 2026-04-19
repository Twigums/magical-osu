// Rhythm-game engine: note chart building, canvas rendering, cursor-swipe
// hit detection, and judgement-window scoring. Driven by song.ts which calls
// tick(songMs) each animation frame.

import { angleDiff, clamp } from "./utils";

const PERFECT_MS     = 32;
const GOOD_MS        = 100;
const PERFECT_POINTS = 5;
const GOOD_POINTS    = 2;

const APPROACH_MS    = 1500;

export const LOGICAL_W = 800;
export const LOGICAL_H = 600;

const NOTE_RADIUS    = 42;
const ANGULAR_MARGIN = Math.PI / 4; // +/- 45 degrees

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

  // input
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

  // state
  let notes: Note[] = [];
  let score = 0;

  const setScore = (v: number): void => { score = v; onScore(v); };

  // judgement
  const scoreFor = (deltaMs: number): { result: HitResult; points: number } => {
    const d = Math.abs(deltaMs);
    if (d <= PERFECT_MS) return { result: "perfect", points: PERFECT_POINTS };
    if (d <= GOOD_MS)    return { result: "good",    points: GOOD_POINTS    };
    return { result: "miss", points: 0 };
  };

  // definition of hit
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

  // note rendering
  const drawNote = (note: Note, appearProgress: number, scale: number): void => {
    const cx = note.x * scale;
    const cy = note.y * scale;
    const r  = NOTE_RADIUS * scale;
    const base = note.kind === "click" ? "255, 82, 82" : "82, 162, 255";

    ctx.save();
    ctx.lineWidth = 3;
    ctx.strokeStyle = `rgba(${base}, 0.9)`;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = `rgba(${base}, ${0.15 + appearProgress * 0.7})`;
    ctx.fill();

    const approachR = r * (1 + (1 - appearProgress) * 1.4);
    ctx.lineWidth = 2;
    ctx.strokeStyle = `rgba(${base}, ${0.3 + appearProgress * 0.4})`;
    ctx.beginPath();
    ctx.arc(cx, cy, approachR, 0, Math.PI * 2);
    ctx.stroke();

    const dx = Math.cos(note.direction);
    const dy = Math.sin(note.direction);
    const tipX  = cx + dx * (r - 6);
    const tipY  = cy + dy * (r - 6);
    const tailX = cx - dx * (r * 0.5);
    const tailY = cy - dy * (r * 0.5);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.95)";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(tailX, tailY);
    ctx.lineTo(tipX, tipY);
    ctx.stroke();

    const head = 8 * scale;
    const lX = tipX - Math.cos(note.direction - 0.5) * head;
    const lY = tipY - Math.sin(note.direction - 0.5) * head;
    const rX = tipX - Math.cos(note.direction + 0.5) * head;
    const rY = tipY - Math.sin(note.direction + 0.5) * head;
    ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
    ctx.beginPath();
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(lX, lY);
    ctx.lineTo(rX, rY);
    ctx.closePath();
    ctx.fill();
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

  // use textalive
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
