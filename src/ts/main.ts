import { createElement } from "react";
import { createRoot } from "react-dom/client";
import { initLangToggle } from "./lang";
import { initSongPage }   from "./song";
import { HomeLayoutSwitcher } from "./react/HomeLayoutSwitcher";
import { GameSurface }        from "./react/GameSurface";
import { OptionsPanel }       from "./react/OptionsPanel";

document.addEventListener("DOMContentLoaded", () => {
  initLangToggle();

  // Mount options panel globally — it is accessible from both home and song pages
  const settingsRoot = document.createElement("div");
  settingsRoot.id = "settings-root";
  document.body.appendChild(settingsRoot);
  createRoot(settingsRoot).render(createElement(OptionsPanel, null));

  const homeRoot = document.getElementById("home-root");
  if (homeRoot) {
    const infoContent = homeRoot.dataset.infoContent ?? "";
    createRoot(homeRoot).render(
      createElement(HomeLayoutSwitcher, { infoContent })
    );
  }

  const gameRoot = document.getElementById("game-root");
  if (gameRoot) {
    const returnHref = document.querySelector<HTMLAnchorElement>(".btn-back")?.href ?? "/";

    let stopSong: (() => void) | null = null;

    const handleTryAgain = (): void => {
      stopSong?.();
    };

    createRoot(gameRoot).render(
      createElement(GameSurface, {
        onReady: (game, show, hide) => {
          const handle = initSongPage({
            game,
            onSongFinish: show,
            hideResult: hide,
          });

          stopSong = () => handle.stop();
        },
        returnHref,
        onTryAgain: handleTryAgain,
      })
    );
  }
});