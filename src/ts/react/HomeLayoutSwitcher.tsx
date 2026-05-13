import { useEffect, useMemo, useRef, useState } from "react";
import { useLang } from "./hooks/useLang";
import { OptionsPanel } from "./OptionsPanel";

type Layout = "original" | "play" | "info" | "tutorial";

interface Props {
  infoContent: string;
  tutorialContent: string;
  songsManifest: string;
}

interface DifficultyInfo {
  id: string;
  labelEn: string;
  labelJp: string;
  level: number;
}

interface SongEntry {
  id: string;
  titleEn: string;
  titleJp: string;
  authorEn: string;
  authorJp: string;
  href: string;
  difficulties: DifficultyInfo[];
}

interface ManifestSong {
  id: string;
  titleEn: string;
  titleJp: string;
  authorEn: string;
  authorJp: string;
  href: string;
  difficulties: { id: string; level: number }[];
}

const DIFF_LABELS: Record<string, { labelEn: string; labelJp: string }> = {
  easy:   { labelEn: "EASY",   labelJp: "EASY" },
  medium: { labelEn: "MEDIUM", labelJp: "MEDIUM" },
  hard:   { labelEn: "HARD",   labelJp: "HARD" },
  expert: { labelEn: "EXPERT", labelJp: "EXPERT" },
};

function parseManifest(json: string): SongEntry[] {
  try {
    const data = JSON.parse(json) as { songs?: ManifestSong[] };
    return (data.songs ?? []).map(s => ({
      id: s.id,
      titleEn: s.titleEn,
      titleJp: s.titleJp,
      authorEn: s.authorEn,
      authorJp: s.authorJp,
      href: s.href,
      difficulties: s.difficulties
        .filter(d => d.id in DIFF_LABELS)
        .map(d => ({ id: d.id, level: d.level, ...DIFF_LABELS[d.id] })),
    }));
  } catch {
    return [];
  }
}

export function HomeLayoutSwitcher({ infoContent, tutorialContent, songsManifest }: Props) {
  const songs = useMemo(() => parseManifest(songsManifest), [songsManifest]);

  const [layout, setLayout] = useState<Layout>("original");
  const [currentLayout, setCurrentLayout] = useState<Layout>(layout);
  const [exiting, setExiting] = useState(false);
  const [paneKey, setPaneKey] = useState(0);
  const exitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [selectedSong, setSelectedSong] = useState<SongEntry | null>(null);
  const [renderedSong, setRenderedSong] = useState<SongEntry | null>(null);
  const [songExiting, setSongExiting] = useState(false);
  const [songPaneKey, setSongPaneKey] = useState(0);
  const songTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  useEffect(() => {
    if (selectedSong === renderedSong) return;
    setSongExiting(true);
    songTimer.current = setTimeout(() => {
      setRenderedSong(selectedSong);
      setSongPaneKey(k => k + 1);
      setSongExiting(false);
    }, 240);
    return () => {
      if (songTimer.current !== null) clearTimeout(songTimer.current);
    };
  }, [selectedSong, renderedSong]);

  useEffect(() => () => {
    if (exitTimer.current !== null) clearTimeout(exitTimer.current);
    if (songTimer.current !== null) clearTimeout(songTimer.current);
  }, []);

  const lang = useLang();
  const t = (en: string, jp: string) => lang === "jp" ? jp : en;

  const handlePlayClick = () => {
    setSelectedSong(null);
    setRenderedSong(null);
    setLayout("play");
  };

  return (
    <div className="layout-container">
      <OptionsPanel />
      <div className={`layout-pane${exiting ? " exiting" : ""}`} key={paneKey}>
        {currentLayout === "original" && (
          <>
            <button className="btn-main" onClick={handlePlayClick}>
              {t("Play", "プレイ")}
            </button>
            <button className="btn-main" onClick={() => setLayout("tutorial")}>
              {t("Tutorial", "チュートリアル")}
            </button>
            <button className="btn-main" onClick={() => setLayout("info")}>
              {t("Info", "情報")}
            </button>
          </>
        )}
        {currentLayout === "play" && (
          <div className={`song-pane${songExiting ? " exiting" : ""}`} key={songPaneKey}>
            {!renderedSong && (
              <>
                <div className="song-list">
                  {songs.map(song => (
                    <button
                      key={song.id}
                      className="btn-main"
                      onClick={() => setSelectedSong(song)}
                    >
                      {t(`${song.titleEn} — ${song.authorEn}`, `${song.titleJp} — ${song.authorJp}`)}
                    </button>
                  ))}
                  {songs.length === 0 && (
                    <p className="placeholder-text">
                      {t("No songs available.", "曲がありません。")}
                    </p>
                  )}
                  <p className="placeholder-text">
                    {t("More songs will be added later.", "他の曲は後に追加されます。")}
                  </p>
                </div>
                <button className="btn-back" onClick={() => setLayout("original")}>
                  {t("Back", "戻る")}
                </button>
              </>
            )}
            {renderedSong && (
              <>
                <span className="song-title">
                  {t(
                    `${renderedSong.titleEn} — ${renderedSong.authorEn}`,
                    `${renderedSong.titleJp} — ${renderedSong.authorJp}`
                  )}
                </span>
                <div className="difficulty-list">
                  {renderedSong.difficulties.map(diff => (
                    <a
                      key={diff.id}
                      href={`${renderedSong.href}?d=${diff.id}`}
                      className={`btn-main diff-btn diff-btn--${diff.id}`}
                    >
                      <span className="diff-level">{diff.level}</span>
                      <span className="diff-label">{t(diff.labelEn, diff.labelJp)}</span>
                    </a>
                  ))}
                </div>
                <button className="btn-back" onClick={() => setSelectedSong(null)}>
                  {t("Back", "戻る")}
                </button>
              </>
            )}
          </div>
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
        {currentLayout === "tutorial" && (
          <>
            <div
              className="info-content"
              dangerouslySetInnerHTML={{ __html: tutorialContent }}
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