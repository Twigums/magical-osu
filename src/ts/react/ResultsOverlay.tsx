import { useState } from "react";
import { useLang } from "./useLang";
import { computeGrade, computeAccuracy } from "../grade";
import { shareResult } from "../share";
import type { GameStats } from "../game";

interface Props {
  stats: GameStats;
  returnHref: string;
  onTryAgain: () => void;
}

export function ResultsOverlay({ stats, returnHref, onTryAgain }: Props) {
  const lang = useLang();
  const [shareStatus, setShareStatus] = useState<"idle" | "copied" | "failed">("idle");

  const grade = computeGrade(stats);
  const accuracy = computeAccuracy(stats);
  const pct = (accuracy * 100).toFixed(2);
  const songName = document.querySelector<HTMLElement>(".song-name")?.textContent ?? "";

  const labels = lang === "jp"
    ? { title: "リザルト", score: "スコア", accuracy: "精度", perfect: "パーフェクト", good: "グッド", miss: "ミス", share: "シェア", copied: "コピー済み！", failed: "失敗", tryAgain: "やり直す", back: "戻る" }
    : { title: "Results", score: "Score", accuracy: "Accuracy", perfect: "Perfect", good: "Good", miss: "Miss", share: "Share", copied: "Copied!", failed: "Failed", tryAgain: "Try Again", back: "Back" };

  const handleShare = (): void => {
    shareResult({ score: stats.score, accuracy: `${pct}%`, grade, songName, lang })
      .then(ok => {
        setShareStatus(ok ? "copied" : "failed");
        setTimeout(() => setShareStatus("idle"), 2000);
      })
      .catch(() => {
        setShareStatus("failed");
        setTimeout(() => setShareStatus("idle"), 2000);
      });
  };

  const shareLabel = shareStatus === "copied" ? labels.copied
    : shareStatus === "failed" ? labels.failed
    : labels.share;

  return (
    <div className="results-overlay">
      <div className="results-panel">
        <h2 className="results-title">{labels.title}</h2>
        <div className={`results-grade results-grade--${grade.toLowerCase()}`}>{grade}</div>
        <div className="results-stats">
          <div className="results-stat">
            <span className="results-stat__label">{labels.score}</span>
            <span className="results-stat__value">{stats.score}</span>
          </div>
          <div className="results-stat">
            <span className="results-stat__label">{labels.accuracy}</span>
            <span className="results-stat__value">{pct}%</span>
          </div>
          <div className="results-breakdown">
            <span className="results-breakdown__perfect">{labels.perfect}: {stats.perfect}</span>
            <span className="results-breakdown__good">{labels.good}: {stats.good}</span>
            <span className="results-breakdown__miss">{labels.miss}: {stats.miss}</span>
          </div>
        </div>
        <div className="results-actions">
          <button
            className={`results-btn results-btn--share results-btn--share-${shareStatus}`}
            onClick={handleShare}
          >
            {shareLabel}
          </button>
          <button className="results-btn results-btn--try-again" onClick={onTryAgain}>{labels.tryAgain}</button>
          <a className="results-btn results-btn--back" href={returnHref}>{labels.back}</a>
        </div>
      </div>
    </div>
  );
}
