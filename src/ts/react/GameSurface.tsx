import { useEffect, useRef, useState } from "react";
import { createGame, LOGICAL_W, LOGICAL_H } from "../game";
import type { GameHandle, HitResult, GameStats } from "../game";
import { useLang } from "./useLang";
import { ResultsOverlay } from "./ResultsOverlay";

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
  const [score, setScore]       = useState(0);
  const [feedbacks, setFeedbacks] = useState<FeedbackToast[]>([]);
  const [result, setResult]     = useState<GameStats | null>(null);
  const lang = useLang();

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
      onFeedback: (res, x, y) => {
        const id = Date.now() + Math.random();
        setFeedbacks(prev => [...prev, { id, result: res, x, y }]);
        setTimeout(() => setFeedbacks(prev => prev.filter(f => f.id !== id)), 700);
      },
    });

    onReady(game, setResult, () => setResult(null));
  }, []);

  const handleTryAgain = (): void => {
    setResult(null);
    onTryAgain();
  };

  return (
    <div className="game-area" ref={gameAreaRef}>
      <canvas className="game-canvas" ref={canvasRef} />
      <div className="score-display">
        <span className="score-label">{lang === "jp" ? "スコア" : "Score"}</span>
        <span className="score-value">{score}</span>
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
  );
}
