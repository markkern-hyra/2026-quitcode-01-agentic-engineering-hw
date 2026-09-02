# Vibe notes — Workshop 1

**App:** Porsche Chess — a playable chess game (local two-player or a bot at
three levels) on Next.js 16 + Porsche Design System v4.
**Tool:** Claude Code (Opus 5, 1M context).
**Branch:** `ws01/markkern-hyra` · **Code:** `app/`

---

## 1. What came out of the first prompt, and what did not

**Worked essentially first time**

- **The scaffold and the PDS wiring.** `create-next-app` → provider → partials →
  global stylesheet → a rendering `PHeading`/`PButton`, with `npm run build`
  green. Zero iterations.
- **The chess core.** The mutable `Chess` instance in a ref, an immutable
  `GameSnapshot` per move, and a per-ply identity map so pieces keep stable ids.
  That last idea is what makes the slide animation free — castling moves two ids
  in one snapshot and both pieces glide together with no extra code.
- **The board's re-render contract.** 64 memoised buttons, hover in pure CSS,
  drag coordinates deliberately kept out of React state. Never needed revisiting.
- **The engine's shape.** Negamax + alpha-beta + transposition table + quiescence
  was correct as written; only its *tuning* needed work (§2).

**Did not work first time**

- **The first piece set was unusable.** The knight rendered as a featureless
  blob and the king read as a heart. Hand-authored SVG is fine as an idea, but
  the first attempt at the paths was simply bad drawing. Redrawing all six around
  a *shared base shape* is what made them read as one family.
- **Three separate React 19 lint rejections** of the same underlying need — a
  stable mutable container (§3).
- **Four bugs that typecheck, lint and build all passed** (§2). This is the
  headline finding.

---

## 2. Where the agent stumbled, and how it got turned round

Every bug that mattered was invisible to static checking. The prompt that
actually moved things was some variant of **"now run it and look."**

| Bug | Why static checks missed it | How it was caught |
|---|---|---|
| Search timeout left the board corrupted | The `TimeUp` exception unwinds between a `move()` and its `undo()`, so an aborted search abandoned the board 11 plies deep in a dead line. The next `move()` threw `Invalid move: Nc3`. Perfectly typed. | Bundling `src/engine` with esbuild and playing a **full self-play game in Node**. A single-move test would have passed. |
| `setPointerCapture` silently killed click-to-move | Capture retargets the subsequent `click` to the capturing element, so the square's own `onClick` never fired. The board looked completely inert and threw **no errors at all**. | Driving the real page with Playwright: "selecting e2 shows 0 legal targets". |
| Black pieces invisible in dark mode | PDS's contrast tokens are *translucent overlays*, so `--p-color-canvas` as the "light" square resolves to `#010205` and the black army had nothing to contrast against — it rendered as hollow outlines. | Looking at a dark-mode screenshot. |
| Game-over banner laid out at 0×0 | It was in `PCanvas`'s `footer` slot with correct shadow content — present in the DOM, correct text, zero size. | Probing `getBoundingClientRect()` after noticing it wasn't in the screenshot. |

Two smaller ones: the roving `tabindex` only followed *clicks*, so keyboard focus
arriving by Tab left the anchor behind and the next arrow key stepped from a
square the user had already left; and `getMetaTagsAndIconLinks({format:'js'})`
returns `openGraph.image` (singular) where Next's `Metadata` type wants `images`.

**Engine tuning.** The first version reached only depth 2 in a midgame position.
Profiling `chess.js` directly settled where the time actually went:

| Call | ops/s | |
|---|---|---|
| `hash()` | 22,900,000 | free — safe to key a transposition table on |
| `board()` | 1,860,000 | free |
| `move()` + `undo()` | 19,000 | **the ceiling** |
| `moves()` | 17,000 | **the ceiling** |

So ~10k nodes/s is the hard limit and no amount of cleverness in the evaluation
would matter. Adding **delta pruning and a 6-ply quiescence cap** bought depth
3–4. Difficulty levels are therefore defined by *time budget*, not fixed depth.
Separately, ordering moves by reading the SAN string (`=` > `x` > `+`/`#` >
quiet) costs nothing because `moves()` already produced those strings, and it cut
a midgame depth-4 search from 37,625 nodes / 1,885 ms to **5,514 nodes / 396 ms**.

---

## 3. Numbers

**Research paid for itself.** Before any code, three parallel agents read the
*shipped* PDS 4.6.0 package rather than trusting the docs. That found
[#4684](https://github.com/porsche-design-system/porsche-design-system/issues/4684):
PDS's `splitChildren` runs `typeof children === 'object' && 'type' in children`,
and since `typeof null === 'object'`, **a bare `null` child throws during
prerender** — in nearly every `P*` component, and *only* in `next build`, never
in `next dev`. Knowing that up front made it a coding convention
(`{cond && <X/>}`, plus a `pdsText()` helper) instead of a late mystery build
failure. The half-empty last row of the move-history table would have hit it.

The same pass killed four things the model would otherwise have written from
stale memory: `theme` props (removed in v4 — theming is CSS `light-dark()`),
`PFlex`/`PGrid` (removed), `getInitialStyles()` (removed), and the `settings`,
`crown` and `undo` icons (they don't exist; `configurate`, `return`, `switch` do).

**Delivered**

| | |
|---|---|
| Commits | 6, each with `npm run build` green |
| Source | 3,290 lines across 46 files — engine 490, lib 482, hooks 755, components 1,257 |
| Direct dependencies | **2** (`chess.js`, `@porsche-design-system/components-react`) |
| Prod dependency tree | 96 packages |
| Engine | ~490 lines, no chess-AI dependency, Web Worker |
| Bot response | Easy ~0.7 s · Medium ~0.8 s · Hard ~1.7 s (measured in-browser) |
| Piece artwork | 6 hand-authored SVG shapes, ~2 KB, no licensing question |

**Verification actually run** (not just asserted): castling both sides, en
passant, promotion to a non-queen (`hxg8=N`), fool's mate with the live-region
sentence "Checkmate. Black wins.", a full keyboard-only move, exactly one
`tabindex="0"` at a time, arrows staying visually correct after a board flip,
take-back mid-search dropping the stale engine reply, and 390 px with no
horizontal overflow.

> **Session cost:** run `/cost` in Claude Code and paste the figure here.
> I could not read it from inside the session, and inventing a number would
> defeat the point of the exercise.

---

## 4. Takeaways

1. **The build is the test — and the browser is the real test.** Typecheck, lint
   and `next build` were green while the board was completely unclickable and
   the black army was invisible. Four of the six real bugs were only findable by
   *running and looking*. "Write it, then look at it" should be the default loop,
   not the last step.
2. **Read the shipped package, not the docs.** Every v4 fact that mattered —
   the removed `theme` prop, the missing icons, the `null`-child crash — came
   from the actual `.d.ts` and `.mjs` files on npm. The model's memory of this
   library was confidently wrong, and the docs site is version-fuzzy.
3. **Profile before optimising, even in a "small" component.** The instinct was
   to make the evaluation function cleverer. Measurement showed `hash()` at 23M
   ops/s and `moves()` at 17k — the ceiling was entirely in move generation, so
   the fix was pruning search *volume*, not improving the eval.
4. **Next time: get it on screen sooner.** The whole board, engine and panel
   layer were written before anything was rendered in a browser. Half a day's
   worth of bugs sat undetected in green builds. A screenshot after the first
   64 squares would have caught the pointer-capture bug immediately.

---

## Task 2 checklist, for the reviewer

Input controls (`PSegmentedControl` for opponent/difficulty/side, `PSwitch` for
board options) → state in a `useReducer` → data display (`PTable` move history,
captured-piece tray, `PTag` status). UI chrome is PDS components throughout;
the board itself is deliberately our own CSS and SVG built on PDS's `--p-*`
custom properties, so the game stays playable even if the CDN-loaded components
never upgrade.
