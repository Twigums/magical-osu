import { initLangToggle } from "./lang";
import { initHomePage }   from "./home";
import { initSongPage }   from "./song";

document.addEventListener("DOMContentLoaded", () => {
  initLangToggle();

  if (document.getElementById("layout-original")) {
    initHomePage();
  }
  if (document.getElementById("btn-play-song")) {
    initSongPage();
  }
});