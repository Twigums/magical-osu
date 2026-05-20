import type { TextAliveChar, TextAlivePhrase, TextAliveVideo } from "./textalive";

interface StoryboardRenderer {
  setVideo(video: TextAliveVideo): void;
  update(songMs: number): void;
  setApproachingLyricTime(timeMs: number | null): void;
  reset(): void;
}

export function createStoryboardRenderer(root: HTMLElement): StoryboardRenderer {
  let video: TextAliveVideo | null = null;
  let currentPhrase: TextAlivePhrase | null = null;
  let lineEl: HTMLElement | null = null;
  let charEls: { ch: TextAliveChar; el: HTMLElement }[] = [];
  let clearTimer: ReturnType<typeof setTimeout> | null = null;
  let approachTime: number | null = null;

  const renderPhrase = (phrase: TextAlivePhrase): void => {
    root.innerHTML = "";
    lineEl = document.createElement("div");
    lineEl.className = "storyboard-line";
    charEls = [];
    let c = phrase.firstChar;
    while (c && c.startTime <= phrase.endTime) {
      const span = document.createElement("span");
      span.className = "storyboard-char";
      span.textContent = c.text;
      lineEl.appendChild(span);
      charEls.push({ ch: c, el: span });
      c = c.next;
    }
    root.appendChild(lineEl);
    requestAnimationFrame(() => lineEl?.classList.add("visible"));
  };

  const clearLine = (): void => {
    if (clearTimer !== null) { clearTimeout(clearTimer); clearTimer = null; }
    if (lineEl) lineEl.classList.remove("visible");
    const toRemove = lineEl;
    clearTimer = setTimeout(() => {
      clearTimer = null;
      if (toRemove && toRemove.parentNode === root) root.removeChild(toRemove);
    }, 300);
    lineEl = null;
    charEls = [];
    currentPhrase = null;
  };

  return {
    setVideo(v): void { video = v; },
    setApproachingLyricTime(timeMs): void { approachTime = timeMs; },
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
          const isApproach = approachTime !== null && approachTime >= ch.startTime && approachTime <= ch.endTime;
          cls = isApproach ? "storyboard-char approach" : "storyboard-char";
        }
        if (el.className !== cls) el.className = cls;
      }
    },
    reset(): void { clearLine(); },
  };
}