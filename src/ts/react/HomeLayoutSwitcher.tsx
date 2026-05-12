import { useEffect, useRef, useState } from "react";
import { useLang } from "./hooks/useLang";
import { withPath } from "../sitePath";
import { OptionsPanel } from "./OptionsPanel";

type Layout = "original" | "play" | "info";

interface Props {
  infoContent: string;
}

export function HomeLayoutSwitcher({ infoContent }: Props) {
  const [layout, setLayout] = useState<Layout>("original");
  const [currentLayout, setCurrentLayout] = useState<Layout>(layout);
  const [exiting, setExiting] = useState(false);
  const [paneKey, setPaneKey] = useState(0);
  const exitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (layout === currentLayout) return;
    setExiting(true);
    exitTimer.current = setTimeout(() => {
      setCurrentLayout(layout);
      setPaneKey(k => k + 1);
      setExiting(false);
    }, 240);
    return () => {
      if (exitTimer.current !== null) clearTimeout(exitTimer.current);
    };
  }, [layout, currentLayout]);

  useEffect(() => () => {
    if (exitTimer.current !== null) clearTimeout(exitTimer.current);
  }, []);

  const lang = useLang();
  const t = (en: string, jp: string) => lang === "jp" ? jp : en;

  return (
    <div className="layout-container">
      <OptionsPanel />
      <div className={`layout-pane${exiting ? " exiting" : ""}`} key={paneKey}>
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