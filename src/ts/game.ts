import { angleDiff, clamp } from "./utils";
import { drawArrow, NOTE_RADIUS } from "./draw";
import { arToMs, loadAr } from "./settings";

const PERFECT_MS     = 32;
const GOOD_MS        = 100;
const PERFECT_POINTS = 5;
const GOOD_POINTS    = 2;

export const LOGICAL_W = 800;
export const LOGICAL_H = 600;

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

export interface GameStats {
  score: number;
  perfect: number;
  good: number;
  miss: number;
  total: number;
}

export interface GameHandle {
  setChart(notes: Note[]): void;
  reset(): void;
  tick(songMs: number): void;
  getStats(): GameStats;
  /** Update the approach window duration at runtime (e.g. when the user changes AR). */
  setApproachMs(ms: number): void;
}

export interface GameDeps {
  canvas:       HTMLCanvasElement;
  gameArea:     HTMLElement;
  onScore:      (score: number) => void;
  onFeedback:   (result: HitResult, x: number, y: number) => void;
  hitSoundUrl?: string;
}

export function createGame(deps: GameDeps): GameHandle {
  const { canvas, gameArea, onScore, onFeedback } = deps;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2D canvas context unavailable");

  // init AR immediately
  let approachMs = arToMs(loadAr());

  let audioCtx: AudioContext | null = null;
  let hitSoundBuffer: AudioBuffer | null = null;

  const playHitSound = (): void => {
    if (!audioCtx || !hitSoundBuffer) return;
    const source = audioCtx.createBufferSource();
    source.buffer = hitSoundBuffer;
    source.connect(audioCtx.destination);
    source.start();
  };

  if (deps.hitSoundUrl) {
    const url = deps.hitSoundUrl;
    let loading = false;
    const loadSound = (): void => {
      if (loading) return;
      loading = true;
      audioCtx = new AudioContext();
      fetch(url)
        .then(r => r.arrayBuffer())
        .then(buf => audioCtx!.decodeAudioData(buf))
        .then(decoded => { hitSoundBuffer = decoded; })
        .catch(err => console.error("[mimi] hitsound load failed:", err));
    };
    window.addEventListener("pointerdown", loadSound, { once: true });
    window.addEventListener("keydown",     loadSound, { once: true });
  }

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
  let perfectCount = 0;
  let goodCount = 0;
  let missCount = 0;

  // After reset(), skip expiry until the song confirms it has rewound to the lead-in window
  // preventing stale mid-song positions from triggering immediate misses.
  let skipExpiry = false;

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
    if (result === "perfect") perfectCount++;
    else if (result === "good") goodCount++;
    if (points > 0) setScore(score + points);
    onFeedback(result, note.x, note.y);
    playHitSound();
  };

  const expireMisses = (songMs: number): void => {
    for (const n of notes) {
      if (n.state !== "pending") continue;
      if (songMs - n.time > GOOD_MS) {
        n.state = "missed";
        n.hitResult = "miss";
        missCount++;
        onFeedback("miss", n.x, n.y);
      }
    }
  };

  const draw = (songMs: number): void => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const scale = getScale();
    for (const note of notes) {
      if (note.state !== "pending") continue;
      const dt = note.time - songMs;
      if (dt > approachMs || dt < -GOOD_MS) continue;
      const appearProgress = clamp(1 - dt / approachMs, 0, 1);
      drawArrow(ctx, note, appearProgress, scale);
    }
  };

  return {
    setChart(n: Note[]): void { notes = n; },

    reset(): void {
      skipExpiry = true;
      for (const n of notes) { n.state = "pending"; n.hitResult = undefined; }
      setScore(0);
      perfectCount = 0;
      goodCount    = 0;
      missCount    = 0;
    },

    getStats(): GameStats {
      return {
        score,
        perfect: perfectCount,
        good:    goodCount,
        miss:    missCount,
        total:   perfectCount + goodCount + missCount,
      };
    },

    setApproachMs(ms: number): void {
      approachMs = ms;
    },

    tick(songMs: number): void {
      for (const note of notes) tryHit(note, songMs);
      if (skipExpiry) {
        // Once songMs confirms the song has rewound into the lead-in window, lift the guard
        if (songMs <= approachMs) skipExpiry = false;
      } else {
        expireMisses(songMs);
      }
      draw(songMs);
      pointer.prevX = pointer.x;
      pointer.prevY = pointer.y;
    },
  };
}