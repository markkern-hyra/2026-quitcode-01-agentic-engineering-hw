import { memo } from 'react';
import type { Color, PieceSymbol } from 'chess.js';
import { Bishop } from './Bishop';
import { King } from './King';
import { Knight } from './Knight';
import { Pawn } from './Pawn';
import { Queen } from './Queen';
import { Rook } from './Rook';
import styles from './pieces.module.css';

const SHAPES: Record<PieceSymbol, () => React.JSX.Element> = {
  p: Pawn,
  n: Knight,
  b: Bishop,
  r: Rook,
  q: Queen,
  k: King,
};

/**
 * One colourless shape per piece type. Colour comes from the `color` and
 * `--chess-stroke` properties inherited from whatever renders it, so the same
 * six components serve both armies at any size — the board, the captured tray
 * (~20px) and the promotion dialog (~56px) all reuse these verbatim.
 *
 * The 45x45 viewBox is the Cburnett convention, which keeps the option of
 * dropping in a licensed piece set later without touching layout.
 */
export const PieceGlyph = memo(function PieceGlyph({ type }: { type: PieceSymbol }) {
  const Shape = SHAPES[type];
  return (
    <svg
      viewBox="0 0 45 45"
      className={styles.glyph}
      aria-hidden="true"
      focusable="false"
      preserveAspectRatio="xMidYMid meet"
    >
      <Shape />
    </svg>
  );
});

/** Standalone glyph with its own colours, for use outside the board layer. */
export function StandalonePiece({
  type,
  color,
  size,
}: {
  type: PieceSymbol;
  color: Color;
  size: number | string;
}) {
  return (
    <span
      style={{
        display: 'inline-block',
        width: typeof size === 'number' ? `${size}px` : size,
        height: typeof size === 'number' ? `${size}px` : size,
        color: color === 'w' ? 'var(--chess-piece-white)' : 'var(--chess-piece-black)',
        ['--chess-stroke' as string]: 'var(--chess-piece-outline)',
        ['--chess-detail' as string]:
          color === 'w' ? 'var(--chess-piece-outline)' : 'var(--chess-piece-white)',
      }}
    >
      <PieceGlyph type={type} />
    </span>
  );
}
