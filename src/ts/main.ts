document.addEventListener("DOMContentLoaded", function () {
  initLangToggle();

  if (document.getElementById("layout-original")) {
    initHomePage();
  }

  if (document.getElementById("btn-play-song")) {
    initSongPage();
  }
});

function initLangToggle(): void {
  const savedLang = localStorage.getItem("lang") ?? "en";
  applyLang(savedLang);

  document.getElementById("lang-toggle")?.addEventListener("click", () => {
    const current = localStorage.getItem("lang") ?? "en";
    const next = current === "en" ? "jp" : "en";
    localStorage.setItem("lang", next);
    applyLang(next);
  });
}

function initHomePage(): void {
  const layouts: Record<string, HTMLElement | null> = {
    original: document.getElementById("layout-original"),
    play:     document.getElementById("layout-play"),
    info:     document.getElementById("layout-info"),
  };

  function showLayout(name: string): void {
    for (const layout of Object.values(layouts)) {
      if (layout) layout.hidden = true;
    }
    const target = layouts[name];
    if (target) target.hidden = false;
  }

  document.getElementById("btn-play")?.addEventListener("click", () => showLayout("play"));
  document.getElementById("btn-info")?.addEventListener("click", () => showLayout("info"));
  document.getElementById("back-from-play")?.addEventListener("click", () => showLayout("original"));
  document.getElementById("back-from-info")?.addEventListener("click", () => showLayout("original"));
}

function applyLang(lang: string): void {
  document.documentElement.classList.toggle("lang-jp", lang === "jp");

  const toggle = document.getElementById("lang-toggle");
  if (toggle) toggle.setAttribute("aria-checked", (lang === "jp").toString());

  const options = document.querySelectorAll<HTMLElement>(".lang-option");
  for (const opt of options) {
    opt.classList.toggle("active", opt.dataset.lang === lang);
  }

  const textEls = document.querySelectorAll<HTMLElement>("[data-en]");
  for (const el of textEls) {
    const text = lang === "jp" ? el.dataset.jp : el.dataset.en;
    if (text !== undefined) {
      el.textContent = text;
    }
  }

  const titleEls = document.querySelectorAll<HTMLElement>("[data-title-en]");
  for (const el of titleEls) {
    const title = lang === "jp" ? el.dataset.titleJp : el.dataset.titleEn;
    if (title !== undefined) {
      el.title = title;
    }
  }
}

function initSongPage(): void {
  const btnPlay = document.getElementById("btn-play-song") as HTMLButtonElement | null;
  const btnStop = document.getElementById("btn-stop-song") as HTMLButtonElement | null;
  const progressFill = document.getElementById("progress-fill") as HTMLElement | null;

  btnPlay?.addEventListener("click", () => {
    if (btnPlay) btnPlay.disabled = true;
  });

  btnStop?.addEventListener("click", () => {
    if (btnPlay) btnPlay.disabled = false;
    if (progressFill) progressFill.style.width = "0%";
  });
}