import { useState } from "react";
import { useLang } from "./useLang";
import { withPath } from "../sitePath";
import { useTransitionState } from "./useTransitionState";

type Layout = "original" | "play" | "info";

interface Props {
  infoContent: string;
}

export function HomeLayoutSwitcher({ infoContent }: Props) {
  const [layout, setLayout] = useState<Layout>("original");
  const { current: currentLayout, state } = useTransitionState(layout, 240);
  const lang = useLang();
  const t = (en: string, jp: string) => lang === "jp" ? jp : en;

  return (
    <div className="layout-container">
      <div className="layout-pane" data-state={state}>
        {currentLayout === "original" && (
          <>
            <button className="btn-main" onClick={() => setLayout("play")}>
              {t("Play", "プレイ")}
            </button>
            <a href={withPath('/tutorial/')} className="btn-main">
              {t("Tutorial", "チュートリアル")}
            </a>
            <button className="btn-main" onClick={() => setLayout("info")}>
              {t("Info", "情報")}
            </button>
          </>
        )}
        {currentLayout === "play" && (
          <>
            <div className="song-list">
              <a href={withPath('/song1/')} className="btn-main">
                {t("Song 1", "ソング 1")}
              </a>
              <p className="placeholder-text">
                {t("More songs will be added later.", "他の曲は後に追加されます。")}
              </p>
            </div>
            <button className="btn-back" onClick={() => setLayout("original")}>
              {t("Back", "戻る")}
            </button>
          </>
        )}
        {currentLayout === "info" && (
          <>
            <div
              className="info-content"
              dangerouslySetInnerHTML={{ __html: infoContent }}
            />
            <button className="btn-back" onClick={() => setLayout("original")}>
              {t("Back", "戻る")}
            </button>
          </>
        )}
      </div>
    </div>
  );
}