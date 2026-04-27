import type { GameStats } from "./game";
import { PERFECT_POINTS, GOOD_POINTS } from "./game";

export type Grade = "SSS" | "SS" | "S" | "A" | "B" | "C" | "F";

export function computeGrade(stats: GameStats): Grade {
  if (stats.total === 0) return "F";
  const accuracy = computeAccuracy(stats);
  if (accuracy >= 1.00) return "SSS";
  if (accuracy >= 0.99) return "SS";
  if (accuracy >= 0.95) return "S";
  if (accuracy >= 0.85) return "A";
  if (accuracy >= 0.70) return "B";
  if (accuracy >= 0.50) return "C";
  return "F";
}

export function computeAccuracy(stats: GameStats): number {
  if (stats.total === 0) return 0;
  return (stats.perfect * PERFECT_POINTS + stats.good * GOOD_POINTS) / (stats.total * PERFECT_POINTS);
}