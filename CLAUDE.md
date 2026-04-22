# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Important Context

The user has defined important context for the final application within `/wiki`. All information in `/wiki` must strictly be prioritized during implementation. If you are in a state of confusion or uncertainty, you must check and refer to the files for facts (entry point at `/wiki/main.md`). When referencing any aspect of any file in `/wiki`, you must directly quote the stated fact. Do not alter any quote. Do not perform any changes to any files in `/wiki`. Note that the concepts and points mentioned in the files in `/wiki` may or may not be already implemented.

Your changes to the repo will be graded on:

1. Whether your reasoning is accurate and based on facts.
2. Whether your code breaks other, unrelated portions of the repository.
3. Whether your code follows existing repo conventions.
4. Whether your changes are necessary and efficient.

## Commands
These commands are listed to establish context. You should assume that the user will run these commands after your changes. Do NOT run any following commands unless explicitly directed by the user.

### Build & Run

```bash
# Install Node dependencies and build Hakyll binary
npm run setup

# Generate site into docs/
npm run rebuild

# Watch for changes and rebuild
npm run watch

# Rebuild with sub-path (e.g. for GitHub Pages); also accepts --path /sub-path flag
SITE_PATH=/mimi npm run rebuild
# or: npm run rebuild:pages
```

### Haskell

```bash
# Required after any .hs file change, before rebuild/watch
stack build --system-ghc
```

## Architecture

### Build Pipeline

`site.hs` (entry point) defines all Hakyll rules. It imports modules from `src/`:

| Module | Purpose |
|--------|---------|
| `src/Config.hs` | Site-wide constants: `siteRoot`, `templateDir`, `tabPaths`, `textaliveToken` |
| `src/Compilers.hs` | `sassCompiler` (npx sass) and `tsCompiler` (npx esbuild) |
| `src/ChartCompiler.hs` | `chartCompiler` — compiles `.mimi` chart files into `Note[]` JSON |
| `src/Context.hs` | `postCtx` — adds `root` and `date` fields to Hakyll context |

### Content Structure

- `src/tabs/` — Top-level pages. `home.md` → `index.html`, `song1.md` → `song1/index.html`, etc.
- `src/songs/<name>/` — Per-song assets. `.mimi` chart files compiled to `.json`; other files copied verbatim
- `src/templates/` — Hakyll HTML templates: `home.html`, `song.html`, `tutorial.html`, `lang_toggle.html`, `imports.html`, `sitemap.xml`
- `src/scss/` — SCSS partials; `default.scss` is the entry point, imports all `_*.scss` partials
- `src/ts/main.ts` — TypeScript entry point, compiled to `js/main.js`
- `src/ts/game.ts` — Rhythm game engine: note rendering, hit detection, scoring
- `src/ts/song.ts` — Song page controller: TextAlive integration, chart loading, game loop
- `src/ts/react/` — React components (`GameSurface.tsx` — canvas + hit feedback, `HomeLayoutSwitcher.tsx`, `useLang.ts`)
- `static/` — Copied verbatim to output (images, `robots.txt`, etc.)

### Output

All output goes to `docs/` (configured in `Config.hs` via `hakyllConfig`).

### Chart Format (`.mimi`)

Song charts live at `src/songs/<name>/chart.mimi` and are compiled by `ChartCompiler.hs` to `songs/<name>/chart.json`.

```
bpm: 120
offset: 5000
beats_per_measure: 4

# kind, beat, degrees, x, y
c, 1,   0, 400, 300
s, 3,  90, 200, 150
c, 5, 270, 600, 450
```

- `kind`: `c` (click, red) or `s` (stream, blue)
- `beat`: 1-indexed beat number; supports decimals (e.g. `1.5`)
- `degrees`: direction in standard math convention (0 = right, 90 = up, CCW); converted to canvas radians on compile
- `x`, `y`: logical game coordinates (800 × 600 space)
- `offset`: milliseconds from song start to beat 1
- Blank lines and `#` comment lines are ignored

### SCSS

Partials use `@use` with `variables` as `*` (variables are globally forwarded). Dark mode is toggled via JS adding `dark-mode` class to `<html>`; theme preference is persisted in `localStorage`.
