import type { TextAliveChar, TextAlivePhrase, TextAliveVideo } from "./textalive";

export interface StoryHighlight { type: "h"; from: number; to: number; }
export interface StoryMove      { type: "m"; time: number; x: number; y: number; }
export type StoryEntry = StoryHighlight | StoryMove;

const LOGICAL_W = 800;
const LOGICAL_H = 600;

interface StoryboardRenderer {
  setVideo(video: TextAliveVideo): void;
  setStoryData(entries: StoryEntry[]): void;
  update(songMs: number): void;
  reset(): void;
}

export function createStoryboardRenderer(root: HTMLElement): StoryboardRenderer {
  let video: TextAliveVideo | null = null;
  let currentPhrase: TextAlivePhrase | null = null;
  let charEls: { ch: TextAliveChar; el: HTMLElement }[] = [];
  let lineEls: HTMLElement[] = [];
  let highlights: StoryHighlight[] = [];
  let moves: StoryMove[] = [];
  let clearTimer: ReturnType<typeof setTimeout> | null = null;

  const renderPhrase = (phrase: TextAlivePhrase): void => {
    root.innerHTML = "";
    charEls = [];
    lineEls = [];

    const chars: TextAliveChar[] = [];
    let c = phrase.firstChar;
    while (c && c.startTime <= phrase.endTime) { chars.push(c); c = c.next; }

    const relevantMoves = moves.filter(m => m.time >= phrase.startTime && m.time <= phrase.endTime);

    const getMoveForChar = (ch: TextAliveChar): StoryMove | null => {
      let best: StoryMove | null = null;
      for (const m of relevantMoves) {
        if (m.time <= ch.startTime && (best === null || m.time > best.time)) best = m;
      }
      return best;
    };

    // Group chars by applicable move (insertion-order groups the segment splits correctly)
    const groups = new Map<StoryMove | null, TextAliveChar[]>();
    for (const ch of chars) {
      const move = getMoveForChar(ch);
      if (!groups.has(move)) groups.set(move, []);
      groups.get(move)!.push(ch);
    }

    const addSpans = (container: HTMLElement, group: TextAliveChar[]): void => {
      for (const ch of group) {
        const span = document.createElement("span");
        span.className = "storyboard-char";
        span.textContent = ch.text;
        container.appendChild(span);
        charEls.push({ ch, el: span });
      }
    };

    const defaultChars = groups.get(null) ?? [];
    if (defaultChars.length > 0) {
      const lineEl = document.createElement("div");
      lineEl.className = "storyboard-line";
      addSpans(lineEl, defaultChars);
      root.appendChild(lineEl);
      lineEls.push(lineEl);
      requestAnimationFrame(() => lineEl.classList.add("visible"));
    }

    for (const [move, mChars] of groups) {
      if (move === null) continue;
      const seg = document.createElement("div");
      seg.className = "storyboard-segment";
      seg.style.left = `${(move.x / LOGICAL_W) * 100}%`;
      seg.style.top  = `${(move.y / LOGICAL_H) * 100}%`;
      addSpans(seg, mChars);
      root.appendChild(seg);
      lineEls.push(seg);
      requestAnimationFrame(() => seg.classList.add("visible"));
    }
  };

  const clearLine = (): void => {
    if (clearTimer !== null) { clearTimeout(clearTimer); clearTimer = null; }
    for (const el of lineEls) el.classList.remove("visible");
    const toRemove = [...lineEls];
    clearTimer = setTimeout(() => {
      clearTimer = null;
      for (const el of toRemove) { if (el.parentNode === root) root.removeChild(el); }
    }, 300);
    lineEls = [];
    charEls = [];
    currentPhrase = null;
  };

  return {
    setVideo(v): void { video = v; },

    setStoryData(entries): void {
      highlights = entries.filter((e): e is StoryHighlight => e.type === "h");
      moves      = entries.filter((e): e is StoryMove      => e.type === "m");
    },

    update(songMs): void {
      if (!video) return;
      const phrase = video.findPhrase(songMs);
      if (phrase !== currentPhrase) {
        if (currentPhrase) clearLine();
        currentPhrase = phrase;
        if (phrase) renderPhrase(phrase);
      }
      for (const { ch, el } of charEls) {
        let cls: string;
        if (songMs >= ch.startTime && songMs <= ch.endTime) {
          cls = "storyboard-char active";
        } else if (songMs > ch.endTime) {
          cls = "storyboard-char sung";
        } else {
          const highlighted = highlights.some(
            h => songMs >= h.from && songMs <= h.to && ch.startTime >= h.from && ch.startTime <= h.to,
          );
          cls = highlighted ? "storyboard-char approach" : "storyboard-char";
        }
        if (el.className !== cls) el.className = cls;
      }
    },

    reset(): void { clearLine(); },
  };
}
