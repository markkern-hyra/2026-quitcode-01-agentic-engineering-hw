# Porsche Chess

A playable chess game — local two-player or against a bot at three difficulty
levels — built with **Next.js 16 (App Router)** and the
**[Porsche Design System v4](https://designsystem.porsche.com/v4/)**.

**▶ Play it: https://markkern-hyra.github.io/2026-quitcode-01-agentic-engineering-hw/**

```bash
npm install
npm run dev          # http://localhost:3000
npm run build        # must pass; see "The build is the test" below
npm run build:pages  # static export for GitHub Pages (subpath baked in)
```

Requires Node 20.9+ (developed on 22.20). No environment variables, no
secrets, no backend.

## What it does

Full legal chess via [`chess.js`](https://github.com/jhlywa/chess.js): castling,
en passant, promotion with a real four-piece choice, check, checkmate,
stalemate, and all four draw conditions. Plus legal-move dots, last-move and
check highlighting, a captured-piece tray with material advantage, algebraic
move history, take-back, board flip, and light/dark/system theming.

Play with the mouse (click-to-move *or* drag), touch, or entirely by keyboard.

## Layout

```
src/
├── app/          layout.tsx (PDS partials, provider), globals.css (tokens), page.tsx
├── components/   board/ (grid, sprites, SVG pieces) · panels/ (PDS chrome) · GameShell
├── hooks/        useChessGame (the reducer) · useEngine · useBoardPointer/Keyboard
├── engine/       negamax search, evaluation, move ordering, Web Worker entry
└── lib/          types, chess helpers (identity, snapshot, labels, material)
```

**The App Router lives at `src/app/`. Never create `app/app/`** — Next hard-errors
when both exist, and this project's own directory is called `app`.

## Conventions worth knowing before editing

**Import PDS components from `/ssr`, never the package root.** Mixing the two
creates two provider contexts and real hydration errors.

**Never pass a bare `null` child to a `P*` component.** PDS's `splitChildren`
does `typeof children === 'object' && 'type' in children`, and `typeof null` is
`'object'`, so a `null` child throws during prerender
([#4684](https://github.com/porsche-design-system/porsche-design-system/issues/4684)).
Use `{cond && <X/>}` for elements and `pdsText(v)` for text. **This only fires
in `next build`, never in `next dev`** — which is why the build is the gate.

**`PButton` defaults to `type="submit"`.** Always set `type="button"`.

**ARIA goes through the `aria={{ ... }}` object prop**, not flat `aria-*`
attributes, which would land on the host element instead of the inner control.

**Board performance invariants.** The board is 64 memoised buttons, and that
only holds because:

| Event | What re-renders |
|---|---|
| Hovering a square | Nothing — pure CSS |
| Dragging (`pointermove`) | Nothing — the ghost is positioned imperatively; drag coordinates are deliberately *not* in React state |
| Selecting a piece | The selected square plus its legal targets; the rest bail out |
| Applying a move | Up to 4 squares and 2 sprites; the slide is a CSS transition, so React never ticks per frame |

`actions` from `useChessGame` is referentially stable forever. If you make it
unstable, every square re-renders on every hover.

**The `Chess` instance is mutable and lives in a ref.** It is never read during
render. Each mutation produces a fresh immutable `GameSnapshot`, which is the
only thing React sees.

## The build is the test

`npm run build` is the real gate — it typechecks *and* prerenders, which is the
only place the `null`-child crash above surfaces. Run it before every commit.

```bash
npm run build && npm run lint
```

The engine can also be exercised directly, which is how its search bugs were
found — bundle `src/engine` with esbuild and call `findBestMove` from Node.

## Notes

The bot is a hand-rolled negamax with alpha-beta, quiescence, delta pruning and
a transposition table, running in a Web Worker so the UI never blocks. It tops
out around 10k nodes/s because `chess.js` move generation is the ceiling, so the
difficulty levels are defined by time budget rather than by fixed depth.

The board, the pieces and every highlight are our own CSS and SVG, consuming
PDS's `--p-*` custom properties. That is deliberate: PDS components render from
a CDN at runtime, and this way the game stays playable even if none of them
upgrade.
