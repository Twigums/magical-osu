"use strict";
(() => {
  // src/ts/lang.ts
  function initLangToggle() {
    const savedLang = localStorage.getItem("lang") ?? "en";
    applyLang(savedLang);
    document.getElementById("lang-toggle")?.addEventListener("click", () => {
      const current = localStorage.getItem("lang") ?? "en";
      const next = current === "en" ? "jp" : "en";
      localStorage.setItem("lang", next);
      applyLang(next);
    });
  }
  function applyLang(lang) {
    document.documentElement.classList.toggle("lang-jp", lang === "jp");
    const toggle = document.getElementById("lang-toggle");
    if (toggle) toggle.setAttribute("aria-checked", (lang === "jp").toString());
    for (const opt of document.querySelectorAll(".lang-option")) {
      opt.classList.toggle("active", opt.dataset.lang === lang);
    }
    for (const el of document.querySelectorAll("[data-en]")) {
      const text = lang === "jp" ? el.dataset.jp : el.dataset.en;
      if (text !== void 0) el.textContent = text;
    }
    for (const el of document.querySelectorAll("[data-title-en]")) {
      const title = lang === "jp" ? el.dataset.titleJp : el.dataset.titleEn;
      if (title !== void 0) el.title = title;
    }
  }

  // src/ts/home.ts
  function initHomePage() {
    const layouts = {
      original: document.getElementById("layout-original"),
      play: document.getElementById("layout-play"),
      info: document.getElementById("layout-info")
    };
    const show = (name) => {
      for (const layout of Object.values(layouts)) {
        if (layout) layout.hidden = true;
      }
      const target = layouts[name];
      if (target) target.hidden = false;
    };
    document.getElementById("btn-play")?.addEventListener("click", () => show("play"));
    document.getElementById("btn-info")?.addEventListener("click", () => show("info"));
    document.getElementById("back-from-play")?.addEventListener("click", () => show("original"));
    document.getElementById("back-from-info")?.addEventListener("click", () => show("original"));
  }

  // src/ts/utils.ts
  function clamp(v, lo, hi) {
    return v < lo ? lo : v > hi ? hi : v;
  }
  function angleDiff(a, b) {
    let d = b - a;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d <= -Math.PI) d += Math.PI * 2;
    return d;
  }

  // src/ts/game.ts
  var PERFECT_MS = 32;
  var GOOD_MS = 100;
  var PERFECT_POINTS = 5;
  var GOOD_POINTS = 2;
  var APPROACH_MS = 1500;
  var LOGICAL_W = 800;
  var LOGICAL_H = 600;
  var NOTE_RADIUS = 42;
  var ANGULAR_MARGIN = Math.PI / 4;
  function createGame(deps) {
    const { canvas, scoreEl, gameArea } = deps;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("2D canvas context unavailable");
    const resize = () => {
      const rect = gameArea.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
    };
    resize();
    window.addEventListener("resize", resize);
    const getScale = () => canvas.width / LOGICAL_W;
    const pointer = { x: 0, y: 0, prevX: 0, prevY: 0, held: false };
    const keysHeld = /* @__PURE__ */ new Set();
    const actionHeld = () => pointer.held || keysHeld.size > 0;
    const setPointer = (clientX, clientY) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = (clientX - rect.left) * (LOGICAL_W / rect.width);
      pointer.y = (clientY - rect.top) * (LOGICAL_H / rect.height);
    };
    canvas.addEventListener("mousemove", (e) => setPointer(e.clientX, e.clientY));
    canvas.addEventListener("mousedown", (e) => {
      setPointer(e.clientX, e.clientY);
      pointer.held = true;
    });
    window.addEventListener("mouseup", () => {
      pointer.held = false;
    });
    canvas.addEventListener("touchmove", (e) => {
      const t = e.touches[0];
      if (t) setPointer(t.clientX, t.clientY);
      e.preventDefault();
    }, { passive: false });
    canvas.addEventListener("touchstart", (e) => {
      const t = e.touches[0];
      if (t) {
        setPointer(t.clientX, t.clientY);
        pointer.held = true;
      }
      e.preventDefault();
    }, { passive: false });
    window.addEventListener("touchend", () => {
      pointer.held = false;
    });
    window.addEventListener("keydown", (e) => {
      if (!e.repeat) keysHeld.add(e.key);
    });
    window.addEventListener("keyup", (e) => {
      keysHeld.delete(e.key);
    });
    let notes = [];
    let score = 0;
    const setScore = (v) => {
      score = v;
      scoreEl.textContent = String(score);
    };
    const showFeedback = (result, x, y) => {
      const rect = gameArea.getBoundingClientRect();
      const el = document.createElement("div");
      el.className = `hit-feedback hit-${result}`;
      el.textContent = result.toUpperCase();
      el.style.left = `${x / LOGICAL_W * rect.width}px`;
      el.style.top = `${y / LOGICAL_H * rect.height}px`;
      gameArea.appendChild(el);
      setTimeout(() => el.remove(), 700);
    };
    const scoreFor = (deltaMs) => {
      const d = Math.abs(deltaMs);
      if (d <= PERFECT_MS) return { result: "perfect", points: PERFECT_POINTS };
      if (d <= GOOD_MS) return { result: "good", points: GOOD_POINTS };
      return { result: "miss", points: 0 };
    };
    const tryHit = (note, songMs) => {
      if (note.state !== "pending") return;
      if (!actionHeld()) return;
      if (Math.abs(songMs - note.time) > GOOD_MS) return;
      const dx = Math.cos(note.direction);
      const dy = Math.sin(note.direction);
      const pPrev = (pointer.prevX - note.x) * dx + (pointer.prevY - note.y) * dy;
      const pCurr = (pointer.x - note.x) * dx + (pointer.y - note.y) * dy;
      if (pPrev >= 0 || pCurr < 0) return;
      const perpPrev = -(pointer.prevX - note.x) * dy + (pointer.prevY - note.y) * dx;
      const perpCurr = -(pointer.x - note.x) * dy + (pointer.y - note.y) * dx;
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
      showFeedback(result, note.x, note.y);
    };
    const expireMisses = (songMs) => {
      for (const n of notes) {
        if (n.state !== "pending") continue;
        if (songMs - n.time > GOOD_MS) {
          n.state = "missed";
          n.hitResult = "miss";
          showFeedback("miss", n.x, n.y);
        }
      }
    };
    const drawNote = (note, appearProgress, scale) => {
      const cx = note.x * scale;
      const cy = note.y * scale;
      const r = NOTE_RADIUS * scale;
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
      const tipX = cx + dx * (r - 6);
      const tipY = cy + dy * (r - 6);
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
    const draw = (songMs) => {
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
      setChart(n) {
        notes = n;
      },
      reset() {
        for (const n of notes) {
          n.state = "pending";
          n.hitResult = void 0;
        }
        setScore(0);
      },
      tick(songMs) {
        for (const note of notes) tryHit(note, songMs);
        expireMisses(songMs);
        draw(songMs);
        pointer.prevX = pointer.x;
        pointer.prevY = pointer.y;
      }
    };
  }

  // src/ts/storyboard.ts
  function createStoryboardRenderer(root) {
    let video = null;
    let currentPhrase = null;
    let lineEl = null;
    let charEls = [];
    const renderPhrase = (phrase) => {
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
    const clearLine = () => {
      if (lineEl) lineEl.classList.remove("visible");
      const toRemove = lineEl;
      setTimeout(() => {
        if (toRemove && toRemove.parentNode === root) root.removeChild(toRemove);
      }, 300);
      lineEl = null;
      charEls = [];
      currentPhrase = null;
    };
    return {
      setVideo(v) {
        video = v;
      },
      update(songMs) {
        if (!video) return;
        const phrase = video.findPhrase(songMs);
        if (phrase !== currentPhrase) {
          if (currentPhrase) clearLine();
          currentPhrase = phrase;
          if (phrase) renderPhrase(phrase);
        }
        for (const { ch, el } of charEls) {
          if (songMs < ch.startTime) el.className = "storyboard-char";
          else if (songMs <= ch.endTime) el.className = "storyboard-char active";
          else el.className = "storyboard-char sung";
        }
      },
      reset() {
        clearLine();
      }
    };
  }

  // src/ts/song.ts
  function initSongPage() {
    const body = document.body;
    const songUrl = body.dataset.songUrl ?? "";
    const chart = body.dataset.songChart ?? "";
    const token = body.dataset.textaliveToken ?? "";
    const beatId = parseInt(body.dataset.textaliveBeatId ?? "");
    const chordId = parseInt(body.dataset.textaliveChordId ?? "");
    const repetitiveSegmentId = parseInt(body.dataset.textaliveRepetitiveSegmentId ?? "");
    const lyricId = parseInt(body.dataset.textaliveLyricId ?? "");
    const lyricDiffId = parseInt(body.dataset.textaliveLyricDiffId ?? "");
    const hasVideoIds = !isNaN(beatId) && !isNaN(chordId) && !isNaN(repetitiveSegmentId) && !isNaN(lyricId) && !isNaN(lyricDiffId);
    const btnPlay = document.getElementById("btn-play-song");
    const btnStop = document.getElementById("btn-stop-song");
    const progressFill = document.getElementById("progress-fill");
    const canvas = document.getElementById("game-canvas");
    const scoreEl = document.getElementById("score-value");
    const storyboardEl = document.getElementById("song-storyboard");
    const gameArea = document.getElementById("game-area");
    if (!btnPlay || !btnStop || !progressFill || !canvas || !scoreEl || !gameArea) return;
    const game = createGame({ canvas, scoreEl, gameArea });
    const storyboard = storyboardEl ? createStoryboardRenderer(storyboardEl) : null;
    let player = null;
    let playerReady = false;
    let songLengthMs = 0;
    const TextAliveApp = window.TextAliveApp;
    if (TextAliveApp && songUrl && token) {
      btnPlay.disabled = true;
      const mediaElement = document.getElementById("textalive-media");
      const opts = {
        app: { token },
        mediaElement
      };
      player = new TextAliveApp.Player(opts);
      player.addListener({
        onAppReady(app) {
          console.info("[magical-osu] onAppReady \u2014 managed:", app.managed);
          if (!app.songUrl && player) {
            const videoOpts = hasVideoIds ? {
              video: { beatId, chordId, repetitiveSegmentId, lyricId, lyricDiffId }
            } : void 0;
            player.createFromSongUrl(songUrl, videoOpts).catch((err) => {
              console.error("[magical-osu] createFromSongUrl failed:", err);
            });
          }
        },
        onVideoReady(video) {
          storyboard?.setVideo(video);
          songLengthMs = video.duration;
          if (player?.data.song) {
            const songNameEl = document.querySelector(".song-name");
            const songAuthorEl = document.querySelector(".song-author");
            const { name, artist } = player.data.song;
            if (songNameEl) {
              songNameEl.textContent = name;
              songNameEl.dataset.en = name;
            }
            if (songAuthorEl) {
              songAuthorEl.textContent = artist.name;
              songAuthorEl.dataset.en = artist.name;
            }
          }
        },
        onTimerReady() {
          playerReady = true;
          btnPlay.disabled = false;
        },
        onPlay() {
          btnPlay.disabled = true;
        },
        onPause() {
          btnPlay.disabled = false;
        },
        onStop() {
          btnPlay.disabled = false;
          game.reset();
          storyboard?.reset();
          progressFill.style.width = "0%";
        }
      });
    }
    (async () => {
      if (!chart) return;
      try {
        const res = await fetch(chart);
        if (!res.ok) return;
        const notes = await res.json();
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
    const loop = () => {
      const songMs = player?.timer.position ?? 0;
      game.tick(songMs);
      storyboard?.update(songMs);
      if (songLengthMs > 0) {
        const pct = Math.max(0, Math.min(100, songMs / songLengthMs * 100));
        progressFill.style.width = `${pct}%`;
      }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  // src/ts/main.ts
  document.addEventListener("DOMContentLoaded", () => {
    initLangToggle();
    if (document.getElementById("layout-original")) {
      initHomePage();
    }
    if (document.getElementById("btn-play-song")) {
      initSongPage();
    }
  });
})();
