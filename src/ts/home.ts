// Home page: swap between the three layouts (original / play / info)

export function initHomePage(): void {
  const layouts: Record<string, HTMLElement | null> = {
    original: document.getElementById("layout-original"),
    play:     document.getElementById("layout-play"),
    info:     document.getElementById("layout-info"),
  };

  const show = (name: string): void => {
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