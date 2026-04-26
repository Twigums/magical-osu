// Song page: reads body data-* attributes, starts TextAlive player, and drives game elements

import type { GameHandle, Note } from "./game";
import { createStoryboardRenderer } from "./storyboard";
import type { TextAlivePlayer, TextAlivePlayerOptions } from "./textalive";

export function initSongPage(game: GameHandle): void {
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
  const storyboardEl = document.getElementById("song-storyboard") as HTMLElement       | null;

  if (!btnPlay || !btnStop || !progressFill) return;

  const storyboard = storyboardEl ? createStoryboardRenderer(storyboardEl) : null;

  const loadingScreen = document.getElementById("loading-screen");
  const loadingBar    = document.getElementById("loading-bar-fill") as HTMLElement | null;

  const setProgress = (pct: number): void => {
    if (loadingBar) loadingBar.style.width = `${pct}%`;
  };

  const dismissLoading = (): void => {
    if (!loadingScreen) return;
    setProgress(100);
    setTimeout(() => {
      loadingScreen.classList.add("loaded");
      loadingScreen.addEventListener("transitionend", () => loadingScreen.remove(), { once: true });
    }, 400);
  };

  if (loadingBar) requestAnimationFrame(() => setProgress(30));

  let player: TextAlivePlayer | null = null;
  let playerReady = false;
  let songLengthMs = 0;

  const TextAliveApp = window.TextAliveApp;
  if (!songUrl || !token) {
    dismissLoading();
  } else if (TextAliveApp) {
    btnPlay.disabled = true;

    const mediaElement = document.getElementById("textalive-media");
    const opts: TextAlivePlayerOptions = {
      app: { token },
      mediaElement,
    };

    const loadTimeout = setTimeout(() => {
      playerReady = true;
      btnPlay.disabled = false;
      dismissLoading();
    }, 15000);

    player = new TextAliveApp.Player(opts);
    player.addListener({
      onAppReady(app) {
        console.info("[mimi] onAppReady — managed:", app.managed);
        if (!app.songUrl && player) {
          const videoOpts = hasVideoIds ? {
            video: { beatId, chordId, repetitiveSegmentId, lyricId, lyricDiffId }
          } : undefined;
          player.createFromSongUrl(songUrl, videoOpts).catch(err => {
            console.error("[mimi] createFromSongUrl failed:", err);
          });
        }
      },
      onVideoReady(video) {
        setProgress(70);
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
        clearTimeout(loadTimeout);
        playerReady = true;
        btnPlay.disabled = false;
        dismissLoading();
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
  } else {
    setTimeout(dismissLoading, 15000);
  }

  (async () => {
    if (!chart) return;
    try {
      const res = await fetch(chart);
      if (!res.ok) return;
      const notes = await res.json() as Note[];
      game.setChart(notes);
    } catch (err) {
      console.error("[mimi] chart load failed:", err);
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