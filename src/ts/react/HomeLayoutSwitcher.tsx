import { useState } from "react";
import { useLang } from "./useLang";

type Layout = "original" | "play" | "info";

interface Props {
  infoContent: string;
}

export function HomeLayoutSwitcher({ infoContent }: Props) {
  const [layout, setLayout] = useState<Layout>("original");
  const lang = useLang();
  const t = (en: string, jp: string) => lang === "jp" ? jp : en;

  return (
    <div className="layout-container">
      {layout === "original" && (
        <>
          <button className="btn-main" onClick={() => setLayout("play")}>
            {t("Play", "プレイ")}
          </button>
          <a href="/tutorial/" className="btn-main">
            {t("Tutorial", "チュートリアル")}
          </a>
          <button className="btn-main" onClick={() => setLayout("info")}>
            {t("Info", "情報")}
          </button>
        </>
      )}
      {layout === "play" && (
        <>
          <div className="song-list">
            <a href="/song1/" className="btn-main">
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
      {layout === "info" && (
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
  );
}