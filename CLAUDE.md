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
These commands are listed to establish context. You should assume that the user will run these commands after your changes. Do not run any following commands unless explicitly directed by the user.

### Build & Run

```bash
# Install Node dependencies (sass, esbuild — used by Hakyll compilers)
npm install

# Build Hakyll site binary
stack build

# Generate site into docs/
stack exec site build

# Watch for changes and rebuild
stack exec site watch

# Clean build artifacts
stack exec site clean
```

### Haskell

```bash
# Rebuild after .hs changes
stack build && stack exec site rebuild
```

## Architecture

### Build Pipeline

`site.hs` (entry point) defines all Hakyll rules. It imports modules from `src/`:

| Module | Purpose |
|--------|---------|
| `src/Config.hs` | Site-wide constants: `siteRoot`, `blogsDir`, `templateDir`, `tabPaths` |
| `src/Compilers.hs` | `sassCompiler` (npx sass) and `tsCompiler` (npx esbuild) |
| `src/Context.hs` | `postCtx` — adds `root` and `date` fields to Hakyll context |
| `src/Routes.hs` | `titleRoute` — derives URL slugs from post `title` metadata |
| `src/Slug.hs` | Converts text to `underscore_slugs` |

### Content Structure

- `src/tabs/` — Top-level pages. `home.md` → `index.html`, `blog.md` → `blog/index.html`, others → `<name>/index.html`
- `src/blogs/` — Blog posts. Routed via `titleRoute` → `blogs/<title-slug>.html`
- `src/templates/` — Hakyll HTML templates (`default.html`, `blog_post.html`, `header.html`, etc.)
- `src/scss/` — SCSS partials; `default.scss` is the entry point, imports all `_*.scss` partials
- `src/ts/main.ts` — TypeScript entry point, compiled to `js/main.js`
- `static/` — Copied verbatim to output (images, robots.txt, etc.)

### Output

All output goes to `docs/` (configured in `Config.hs` via `hakyllConfig`).

### SCSS

Partials use `@use` with `variables` as `*` (variables are globally forwarded). Dark mode is toggled via JS adding `dark-mode` class to `<html>`; theme preference is persisted in `localStorage`.
