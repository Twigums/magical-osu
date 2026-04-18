// Site-wide EN/JP language toggle
// Applies to any element with data-en/data-jp or data-title-en/data-title-jp attributes; persists preference to localStorage

export function initLangToggle(): void {
  const savedLang = localStorage.getItem("lang") ?? "en";
  applyLang(savedLang);

  document.getElementById("lang-toggle")?.addEventListener("click", () => {
    const current = localStorage.getItem("lang") ?? "en";
    const next = current === "en" ? "jp" : "en";
    localStorage.setItem("lang", next);
    applyLang(next);
  });
}

function applyLang(lang: string): void {
  document.documentElement.classList.toggle("lang-jp", lang === "jp");

  const toggle = document.getElementById("lang-toggle");
  if (toggle) toggle.setAttribute("aria-checked", (lang === "jp").toString());

  for (const opt of document.querySelectorAll<HTMLElement>(".lang-option")) {
    opt.classList.toggle("active", opt.dataset.lang === lang);
  }
  for (const el of document.querySelectorAll<HTMLElement>("[data-en]")) {
    const text = lang === "jp" ? el.dataset.jp : el.dataset.en;
    if (text !== undefined) el.textContent = text;
  }
  for (const el of document.querySelectorAll<HTMLElement>("[data-title-en]")) {
    const title = lang === "jp" ? el.dataset.titleJp : el.dataset.titleEn;
    if (title !== undefined) el.title = title;
  }
}