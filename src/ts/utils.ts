export function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

// smallest signed angle delta a → b, in (-π, π]
export function angleDiff(a: number, b: number): number {
  let d = b - a;
  while (d > Math.PI)   d -= Math.PI * 2;
  while (d <= -Math.PI) d += Math.PI * 2;
  return d;
}