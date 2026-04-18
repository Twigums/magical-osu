// Song page: reads body data-* attributes, starts TextAlive player, and drives game elements

import { createGame } from "./game";
import type { Note } from "./game";
import { createStoryboardRenderer } from "./storyboard";
import type { TextAlivePlayer, TextAlivePlayerOptions } from "./textalive";

export function initSongPage(): void {
  const body    = document.body;
  const songUrl = body.dataset.songUrl ?? "";
  const chart   = body.dataset.songChart ?? "";
  const token   = body.dataset.textaliveToken ?? "";

  const beatId               = parseInt(body.dataset.textaliveBeatId ?? "");
  const chordId              = parseInt(body.dataset.textaliveChordId ?? "");
  const repetitiveSegmentId  = parseInt(body.dataset.textaliveRepetitiveSegmentId ?? "");
  const lyricId              = parseInt(body.dataset.textaliveLyricId ?? "");
  const lyricDiffId          = parseInt(body.dataset.textaliveLyricDiffId ?? "");
  const hasVideoIds = !isNaN(beatId) && !isNaN(chordId) && !isNaN(repetitiveSegmentId) && !isNaN(lyricId) && !isNaN(lyricDiffId);

  const btnPlay      = document.getElementById("btn-play-song")   as HTMLButtonElement | null;
  const btnStop      = document.getElementById("btn-stop-song")   as HTMLButtonElement | null;
  const progressFill = document.getElementById("progress-fill")   as HTMLElement       | null;
  const canvas       = document.getElementById("game-canvas")     as HTMLCanvasElement | null;
  const scoreEl      = document.getElementById("score-value")     as HTMLElement       | null;
  const storyboardEl = document.getElementById("song-storyboard") as HTMLElement       | null;
  const gameArea     = document.getElementById("game-area")       as HTMLElement       | null;

  if (!btnPlay || !btnStop || !progressFill || !canvas || !scoreEl || !gameArea) return;

  const game = createGame({ canvas, scoreEl, gameArea });
  const storyboard = storyboardEl ? createStoryboardRenderer(storyboardEl) : null;

  let player: TextAlivePlayer | null = null;
  let playerReady = false;
  let songLengthMs = 0;

  const TextAliveApp = window.TextAliveApp;
  if (TextAliveApp && songUrl && token) {
    btnPlay.disabled = true;

    const mediaElement = document.getElementById("textalive-media");
    const opts: TextAlivePlayerOptions = {
      app: { token },
      mediaElement,
    };

    player = new TextAliveApp.Player(opts);
    player.addListener({
      onAppReady(app) {
        console.info("[magical-osu] onAppReady — managed:", app.managed);
        if (!app.songUrl && player) {
          const videoOpts = hasVideoIds ? {
            video: { beatId, chordId, repetitiveSegmentId, lyricId, lyricDiffId }
          } : undefined;
          player.createFromSongUrl(songUrl, videoOpts).catch(err => {
            console.error("[magical-osu] createFromSongUrl failed:", err);
          });
        }
      },
      onVideoReady(video) {
        storyboard?.setVideo(video);
        songLengthMs = video.duration;
        if (player?.data.song) {
          const songNameEl   = document.querySelector(".song-name")   as HTMLElement | null;
          const songAuthorEl = document.querySelector(".song-author") as HTMLElement | null;
          const { name, artist } = player.data.song;
          if (songNameEl)   { songNameEl.textContent   = name;        songNameEl.dataset.en   = name;        }
          if (songAuthorEl) { songAuthorEl.textContent = artist.name; songAuthorEl.dataset.en = artist.name; }
        }
      },
      onTimerReady() {
        playerReady = true;
        btnPlay.disabled = false;
      },
      onPlay()  { btnPlay.disabled = true;  },
      onPause() { btnPlay.disabled = false; },
      onStop()  {
        btnPlay.disabled = false;
        game.reset();
        storyboard?.reset();
        progressFill.style.width = "0%";
      },
    });
  }

  (async () => {
    if (!chart) return;
    try {
      const res = await fetch(chart);
      if (!res.ok) return;
      const notes = await res.json() as Note[];
      game.setChart(notes);
    } catch (err) {
      console.error("[magical-osu] chart load failed:", err);
    }
  })();

  btnPlay.addEventListener("click", () => {
    if (!playerReady || !player) return;
    player.requestPlay();
  });

  btnStop.addEventListener("click", () => {
    if (!playerReady || !player) return;
    player.requestStop();
  });

  const loop = (): void => {
    const songMs = player?.timer.position ?? 0;
    game.tick(songMs);
    storyboard?.update(songMs);

    if (songLengthMs > 0) {
      const pct = Math.max(0, Math.min(100, (songMs / songLengthMs) * 100));
      progressFill.style.width = `${pct}%`;
    }

    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}
