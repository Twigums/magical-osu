import { useEffect, useRef, useState } from "react";
import { createGame, LOGICAL_W, LOGICAL_H } from "../game";
import type { GameHandle, HitResult, GameStats } from "../game";
import { arToMs } from "../settings";
import { useLang } from "./hooks/useLang";
import { useApproachRate } from "./hooks/useSettings";
import { ResultsOverlay } from "./ResultsOverlay";
import { OptionsPanel } from "./OptionsPanel";

let _toastId = 0;

interface FeedbackToast {
  id: number;
  result: HitResult;
  x: number;
  y: number;
}

interface Props {
  onReady: (handle: GameHandle, showResult: (stats: GameStats) => void, hideResult: () => void) => void;
  returnHref: string;
  onTryAgain: () => void;
}

export function GameSurface({ onReady, returnHref, onTryAgain }: Props) {
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const gameRef     = useRef<GameHandle | null>(null);
  const comboRef    = useRef<HTMLSpanElement>(null);

  const [score, setScore]         = useState(0);
  const [combo, setCombo]         = useState(0);
  const [playing, setPlaying]     = useState(false);
  const [feedbacks, setFeedbacks] = useState<FeedbackToast[]>([]);
  const [result, setResult]       = useState<GameStats | null>(null);

  const lang       = useLang();
  const [ar]       = useApproachRate();

  useEffect(() => {
    const canvas   = canvasRef.current;
    const gameArea = gameAreaRef.current;
    if (!canvas || !gameArea) return;

    const hitSoundUrl = document.body.dataset.hitSoundUrl;
    const game = createGame({
      canvas,
      gameArea,
      hitSoundUrl,
      onScore: setScore,
      onComboChange: setCombo,
      onPlayingChange: setPlaying,
      onFeedback: (res, x, y) => {
        const id = ++_toastId;
        setFeedbacks(prev => [...prev, { id, result: res, x, y }]);
        setTimeout(() => setFeedbacks(prev => prev.filter(f => f.id !== id)), 700);
      },
    });

    gameRef.current = game;
    onReady(game, setResult, () => setResult(null));
    return () => game.destroy();
  }, []);

  useEffect(() => {
    gameRef.current?.setApproachMs(arToMs(ar));
  }, [ar]);

  useEffect(() => {
    if (comboRef.current) {
      comboRef.current.classList.remove("combo-pop");
      void comboRef.current.offsetWidth;
      comboRef.current.classList.add("combo-pop");
    }
  }, [combo]);

  const handleTryAgain = (): void => {
    setResult(null);
    onTryAgain();
  };

  return (
    <>
      <OptionsPanel isSongPage={true} />

      <div className={`game-area${playing ? " playing" : ""}`} ref={gameAreaRef}>
        <canvas className="game-canvas" ref={canvasRef} />

        <div className="score-display">
          <span className="score-label">{lang === "jp" ? "スコア" : "Score"}</span>
          <span className="score-value">{score}</span>
        </div>

        <div className="combo-display">
          <span className="combo-value" ref={comboRef}>{combo}x</span>
          <span className="combo-label">{lang === "jp" ? "コンボ" : "Combo"}</span>
        </div>

        {feedbacks.map(f => (
          <div
            key={f.id}
            className={`hit-feedback hit-${f.result}`}
            style={{
              left: `${(f.x / LOGICAL_W) * 100}%`,
              top:  `${(f.y / LOGICAL_H) * 100}%`,
            }}
          >
            {f.result.toUpperCase()}
          </div>
        ))}

        {result && (
          <ResultsOverlay
            stats={result}
            returnHref={returnHref}
            onTryAgain={handleTryAgain}
          />
        )}
      </div>
    </>
  );
}