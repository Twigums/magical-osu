// Lyric storyboard to display jp phrases from TextAlive 
// After a phrase ends, the line fades out and the next phrase fades in

import type { TextAliveChar, TextAlivePhrase, TextAliveVideo } from "./textalive";

export interface StoryboardRenderer {
  setVideo(video: TextAliveVideo): void;
  update(songMs: number): void;
  reset(): void;
}

export function createStoryboardRenderer(root: HTMLElement): StoryboardRenderer {
  let video: TextAliveVideo | null = null;
  let currentPhrase: TextAlivePhrase | null = null;
  let lineEl: HTMLElement | null = null;
  let charEls: { ch: TextAliveChar; el: HTMLElement }[] = [];

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
    if (lineEl) lineEl.classList.remove("visible");
    const toRemove = lineEl;
    setTimeout(() => { if (toRemove && toRemove.parentNode === root) root.removeChild(toRemove); }, 300);
    lineEl = null;
    charEls = [];
    currentPhrase = null;
  };

  return {
    setVideo(v): void { video = v; },
    update(songMs): void {
      if (!video) return;
      const phrase = video.findPhrase(songMs);
      if (phrase !== currentPhrase) {
        if (currentPhrase) clearLine();
        currentPhrase = phrase;
        if (phrase) renderPhrase(phrase);
      }
      for (const { ch, el } of charEls) {
        if (songMs < ch.startTime)     el.className = "storyboard-char";
        else if (songMs <= ch.endTime) el.className = "storyboard-char active";
        else                           el.className = "storyboard-char sung";
      }
    },
    reset(): void { clearLine(); },
  };
}