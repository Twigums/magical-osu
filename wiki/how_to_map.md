# How to Map a Song

A chart is a JSON file containing an array of `Note` objects. Place it under `src/songs/<song-id>/` and reference it via the `song-chart` field in the song's markdown frontmatter.

## Note Format

```typescript
{
  kind:      "click" | "stream",  // note type (see below)
  time:      number,              // hit time in milliseconds from song start
  x:         number,              // horizontal position, 0–800 (left → right)
  y:         number,              // vertical position, 0–600 (top → bottom)
  direction: number,              // swipe direction in radians (see below)
  state:     "pending"            // always "pending" in chart files
}
```

## Coordinate System

The play area is a logical 800 × 600 canvas. (0, 0) is the top-left corner.

```
(0,0) ──────────────── (800,0)
  │                        │
  │   usable: ~80–720 x   │
  │            ~80–520 y   │
  │                        │
(0,600) ──────────── (800,600)
```

Keep notes away from edges — the game uses an 80 px padding margin on all sides.

## Note Kinds

| Kind | Use when |
|------|----------|
| `"click"` | Single isolated hit — one syllable standing alone |
| `"stream"` | Part of a rapid sequence — multiple syllables in one word/burst |

## Direction

Direction is a swipe angle in **radians**, measured clockwise from the right (standard Math convention):

```
        -π/2  (up)
          │
  π ──────┼────── 0   (right)
          │
        +π/2  (down)
```

Common values:

| Angle | Direction |
|-------|-----------|
| `0` | → right |
| `Math.PI / 2` | ↓ down |
| `Math.PI` or `-Math.PI` | ← left |
| `-Math.PI / 2` | ↑ up |
| `Math.PI / 4` | ↘ down-right |
| `-Math.PI / 4` | ↗ up-right |

The player must swipe **through the center of the note** in this direction while holding a key or mouse button. A tolerance of ±45° is accepted.

## Timing from TextAlive

Open the TextAlive portal for your song to get character/word start times. The `startTime` of each character (in ms) is what goes into the `time` field. Round to the nearest 10 ms if needed — the hit window is ±100 ms for a Good, ±32 ms for a Perfect.

The song's TextAlive lyric data (via the `textalive-lyric-id` frontmatter field) gives you phrase → word → character timings in this shape:

```
phrases[
  words[
    chars[ { startTime, endTime }, ... ],
    ...
  ],
  ...
]
```

Use those `startTime` values directly as `time` in each note.

## Minimal Example

```json
[
  { "kind": "click",  "time": 4200,  "x": 400, "y": 200, "direction": 0,           "state": "pending" },
  { "kind": "click",  "time": 4800,  "x": 560, "y": 320, "direction": -0.785,      "state": "pending" },
  { "kind": "stream", "time": 5100,  "x": 300, "y": 400, "direction": 1.571,       "state": "pending" },
  { "kind": "stream", "time": 5300,  "x": 300, "y": 500, "direction": 1.571,       "state": "pending" }
]
```

## Wiring It Up

1. Save your chart as `src/songs/<song-id>/timings.json`
2. In the song's markdown (`src/tabs/<song-id>.md`), set:
   ```yaml
   song-chart: /songs/<song-id>/timings.json
   ```
3. Run `stack exec site rebuild` — the file is copied verbatim to `docs/songs/`.

## Tips

- Map to **syllable beats**, not musical beats — the game syncs to lyric timing, not the drum track.
- Alternate left/right horizontally for streams to make them feel natural to swipe.
- Leave at least 200 ms between notes in a non-stream section so players can reset their cursor.
- Test at different play speeds by adjusting the simulated-time offset in `song.ts` (`simStart = performance.now() - <ms>`).
