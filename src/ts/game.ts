import { angleDiff, clamp } from "./utils";
import { drawArrow, drawFireworks, NOTE_RADIUS, NOTE_STYLE } from "./draw";
import { arToMs, loadAr, loadHitsoundVolume, subscribeHitsoundVolume, volToFactor, loadHiddenMod, subscribeHiddenMod } from "./settings";

const PERFECT_MS           = 32;
const GOOD_MS              = 100;
export const PERFECT_POINTS = 5;
export const GOOD_POINTS    = 2;

export const LOGICAL_W = 800;
export const LOGICAL_H = 600;

const ANGULAR_MARGIN = Math.PI / 6;

type NoteKind          = "click" | "stream";
export type HitResult  = "perfect" | "good" | "miss";
type NoteState         = "pending" | "hit" | "missed";

export interface Note {
  kind: NoteKind;
  time: number;
  x: number;
  y: number;
  direction: number;
  state: NoteState;
  hitResult?: HitResult;
}

interface HitAnimation {
  x: number;
  y: number;
  kind: NoteKind;
  startMs: number;
  seed: number;
}

export interface GameStats {
  score: number;
  perfect: number;
  good: number;
  miss: number;
  total: number;
  combo: number;
}

export interface GameHandle {
  setChart(notes: Note[]): void;
  reset(): void;
  start(): void;
  tick(songMs: number): void;
  getStats(): GameStats;
  setApproachMs(ms: number): void;
  destroy(): void;
}

interface GameDeps {
  canvas:          HTMLCanvasElement;
  gameArea:        HTMLElement;
  onScore:         (score: number) => void;
  onFeedback:      (result: HitResult, x: number, y: number) => void;
  onComboChange:   (combo: number) => void;
  onPlayingChange: (playing: boolean) => void;
  hitSoundUrl?:    string;
}

export function createGame(deps: GameDeps): GameHandle {
  const { canvas, gameArea, onScore, onFeedback, onComboChange, onPlayingChange } = deps;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2D canvas context unavailable");

  let approachMs = arToMs(loadAr());
  let hiddenMod  = loadHiddenMod();

  let audioCtx: AudioContext | null = null;
  let hitSoundBuffer: AudioBuffer | null = null;
  let hitsoundGain: GainNode | null = null;

  const playHitSound = (): void => {
    if (!audioCtx || !hitSoundBuffer || !hitsoundGain) return;
    const source = audioCtx.createBufferSource();
    source.buffer = hitSoundBuffer;
    source.connect(hitsoundGain);
    source.start();
  };

  let audioLoadCleanup: (() => void) | null = null;

  if (deps.hitSoundUrl) {
    const url = deps.hitSoundUrl;
    let loading = false;
    const loadSound = (): void => {
      if (loading) return;
      loading = true;
      audioLoadCleanup = null;
      audioCtx = new AudioContext();
      hitsoundGain = audioCtx.createGain();
      hitsoundGain.gain.value = volToFactor(loadHitsoundVolume());
      hitsoundGain.connect(audioCtx.destination);
      fetch(url)
        .then(r => r.arrayBuffer())
        .then(buf => audioCtx!.decodeAudioData(buf))
        .then(decoded => { hitSoundBuffer = decoded; })
        .catch(err => console.error("[mimi] hitsound load failed:", err));
    };
    window.addEventListener("pointerdown", loadSound, { once: true });
    window.addEventListener("keydown",     loadSound, { once: true });
    audioLoadCleanup = (): void => {
      window.removeEventListener("pointerdown", loadSound);
      window.removeEventListener("keydown",     loadSound);
    };
  }

  const unsubHitsound = subscribeHitsoundVolume(v => {
    if (hitsoundGain) hitsoundGain.gain.value = volToFactor(v);
  });

  const unsubHiddenMod = subscribeHiddenMod(v => { hiddenMod = v; });

  const resize = (): void => {
    const rect = gameArea.getBoundingClientRect();
    const dpr  = window.devicePixelRatio || 1;
    canvas.width  = rect.width  * dpr;
    canvas.height = rect.height * dpr;
  };
  resize();

  const getScale = (): number => canvas.width / LOGICAL_W;

  const pointer = { x: 0, y: 0, prevX: 0, prevY: 0, held: false };
  const keysHeld = new Set<string>();
  const actionHeld = (): boolean => pointer.held || keysHeld.size > 0;

  const setPointer = (clientX: number, clientY: number): void => {
    const rect = canvas.getBoundingClientRect();
    pointer.x = (clientX - rect.left) * (LOGICAL_W / rect.width);
    pointer.y = (clientY - rect.top)  * (LOGICAL_H / rect.height);
  };

  const onMouseMove  = (e: MouseEvent): void => setPointer(e.clientX, e.clientY);
  const onMouseDown  = (e: MouseEvent): void => { setPointer(e.clientX, e.clientY); pointer.held = true; };
  const onMouseUp    = (): void => { pointer.held = false; };
  const onTouchMove  = (e: TouchEvent): void => {
    const t = e.touches[0]; if (t) setPointer(t.clientX, t.clientY); e.preventDefault();
  };
  const onTouchStart = (e: TouchEvent): void => {
    const t = e.touches[0]; if (t) { setPointer(t.clientX, t.clientY); pointer.held = true; } e.preventDefault();
  };
  const onTouchEnd   = (): void => { pointer.held = false; };
  const onKeyDown    = (e: KeyboardEvent): void => { if (!e.repeat) keysHeld.add(e.key); };
  const onKeyUp      = (e: KeyboardEvent): void => { keysHeld.delete(e.key); };

  canvas.addEventListener("mousemove",  onMouseMove);
  canvas.addEventListener("mousedown",  onMouseDown);
  window.addEventListener("mouseup",    onMouseUp);
  canvas.addEventListener("touchmove",  onTouchMove,  { passive: false });
  canvas.addEventListener("touchstart", onTouchStart, { passive: false });
  window.addEventListener("touchend",   onTouchEnd);
  window.addEventListener("keydown",    onKeyDown);
  window.addEventListener("keyup",      onKeyUp);
  window.addEventListener("resize",     resize);

  let notes: Note[] = [];
  let pendingStart = 0;
  let animations: HitAnimation[] = [];
  let score = 0;
  let perfectCount = 0;
  let goodCount = 0;
  let missCount = 0;
  let comboCount = 0;
  let playing = false;

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
    if (NOTE_STYLE[note.kind].requiresHold && !actionHeld()) return;
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
    if (points > 0) {
      setScore(score + points);
      comboCount++;
      onComboChange(comboCount);
      animations.push({
        x: note.x, y: note.y, kind: note.kind, startMs: songMs,
        seed: Math.floor(note.x * 7919 + note.y * 6271),
      });
    }
    onFeedback(result, note.x, note.y);
    playHitSound();
  };

  const expireMisses = (songMs: number): void => {
    // Notes are time-sorted: break as soon as a pending note is within the hit window
    for (let i = pendingStart; i < notes.length; i++) {
      const n = notes[i];
      if (n.state !== "pending") continue;
      if (songMs - n.time <= GOOD_MS) break;
      n.state = "missed";
      n.hitResult = "miss";
      missCount++;
      comboCount = 0;
      onComboChange(0);
      onFeedback("miss", n.x, n.y);
    }
  };

  const draw = (songMs: number): void => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const scale = getScale();
    // Notes are time-sorted: break once a pending note is past the approach window
    for (let i = pendingStart; i < notes.length; i++) {
      const note = notes[i];
      if (note.state !== "pending") continue;
      const dt = note.time - songMs;
      if (dt > approachMs) break;
      if (dt < -GOOD_MS) continue;
      const appearProgress = clamp(1 - dt / approachMs, 0, 1);
      drawArrow(ctx, note, appearProgress, scale, hiddenMod);
    }
    for (let i = 0; i < animations.length; i++) {
      const anim = animations[i];
      const dt = songMs - anim.startMs;
      if (dt < 0 || dt >= 300) continue;
      drawFireworks(ctx, anim.x, anim.y, anim.kind, dt / 300, scale, anim.seed);
    }
    // Animations are pushed in chronological order; trim expired from front
    let trimTo = 0;
    while (trimTo < animations.length && songMs - animations[trimTo].startMs >= 300) trimTo++;
    if (trimTo > 0) animations.splice(0, trimTo);
  };

  return {
    setChart(n: Note[]): void { notes = n; pendingStart = 0; },

    reset(): void {
      skipExpiry = true;
      pendingStart = 0;
      for (const n of notes) { n.state = "pending"; n.hitResult = undefined; }
      animations = [];
      setScore(0);
      perfectCount = 0;
      goodCount    = 0;
      missCount    = 0;
      comboCount   = 0;
      playing      = false;
      onComboChange(0);
      onPlayingChange(false);
    },

    start(): void {
      playing = true;
      onPlayingChange(true);
    },

    getStats(): GameStats {
      return {
        score,
        perfect: perfectCount,
        good:    goodCount,
        miss:    missCount,
        total:   perfectCount + goodCount + missCount,
        combo:   comboCount,
      };
    },

    setApproachMs(ms: number): void {
      approachMs = ms;
    },

    tick(songMs: number): void {
      // Only check notes within the hit window; notes are time-sorted so break early
      for (let i = pendingStart; i < notes.length; i++) {
        const n = notes[i];
        if (n.time > songMs + GOOD_MS) break;
        if (n.state === "pending") tryHit(n, songMs);
      }
      if (skipExpiry) {
        if (songMs <= approachMs) skipExpiry = false;
      } else {
        expireMisses(songMs);
      }
      // Advance past resolved notes (hit or missed) at the front
      while (pendingStart < notes.length && notes[pendingStart].state !== "pending") pendingStart++;
      draw(songMs);
      pointer.prevX = pointer.x;
      pointer.prevY = pointer.y;
    },

    destroy(): void {
      canvas.removeEventListener("mousemove",  onMouseMove);
      canvas.removeEventListener("mousedown",  onMouseDown);
      window.removeEventListener("mouseup",    onMouseUp);
      canvas.removeEventListener("touchmove",  onTouchMove);
      canvas.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend",   onTouchEnd);
      window.removeEventListener("keydown",    onKeyDown);
      window.removeEventListener("keyup",      onKeyUp);
      window.removeEventListener("resize",     resize);
      unsubHitsound();
      unsubHiddenMod();
      audioLoadCleanup?.();
    },
  };
}
